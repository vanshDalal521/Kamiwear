// Use same-origin /api in production. In local development, talk to the API on
// port 3000 (this also works when the static files are served by another tool).
const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const API_BASE = isLocal
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : '/api';

const SESSION_HINT_KEY = 'kw_session_hint';
const SESSION_VERIFIED_KEY = 'kw_session_verified_at';
const LAST_EMAIL_KEY = 'kw_last_email';
const SESSION_CACHE_MS = 60 * 1000;

function normalizeSearchText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function newIdempotencyKey() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `kw_${Date.now()}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function parsePrice(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const cleaned = String(value || '').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Store same-origin images as root-relative paths. Absolute URLs captured from
 * `img.src` break when the site moves from localhost to a custom domain (or
 * between Vercel preview/production URLs) and make the cart show broken images.
 */
function normalizeImageUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    try {
        const url = new URL(raw, window.location.href);
        // Also rewrite URLs saved on localhost or a previous Vercel preview
        // domain. Otherwise a cart filled before launch keeps pointing at
        // http://localhost:3000 (broken for every real visitor).
        const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
        const isPreviewHost = /\.vercel\.app$/i.test(url.hostname);
        if (url.origin === window.location.origin || isLocalHost || isPreviewHost) {
            return `${url.pathname.replace(/^\//, '')}${url.search}${url.hash}`;
        }
        return url.href;
    } catch (error) {
        return raw;
    }
}

function normalizeCartItem(product, quantity = 1) {
    const name = String(product.name || 'Product').trim().slice(0, 120);
    const price = parsePrice(product.price);
    const qty = Math.max(1, Math.min(25, Math.floor(Number(quantity) || 1)));
    const size = String(product.size || '').trim().slice(0, 12);
    const color = String(product.color || '').trim().slice(0, 30);
    const variant = [size, color].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = String(product.id || `${name}-${price}${variant ? `-${variant}` : ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')).slice(0, 120);

    return {
        id,
        name,
        price,
        quantity: qty,
        image: normalizeImageUrl(product.image),
        category: product.category || 'Apparel',
        size,
        color,
    };
}

const Store = {
    // ---------------------------------------------------------------- Config
    _configPromise: null,

    async getConfig(force = false) {
        if (!force && this._configPromise) return this._configPromise;

        this._configPromise = fetch(`${API_BASE}/config`, { headers: { Accept: 'application/json' } })
            .then(res => {
                if (!res.ok) throw new Error(`Config request failed (${res.status})`);
                return res.json();
            })
            .then(config => ({
                googleClientId: config.googleClientId || '',
                currency: config.currency || 'INR',
                payments: config.payments || { cod: true, upi: true, card: false, simulatedCard: false },
                upi: config.upi || {
                    id: '9253395564@ybl',
                    payeeName: 'Kamiwear',
                    qrImage: '/assets/payments/kamiwear-upi-scanner.png',
                },
                emailConfigured: Boolean(config.emailConfigured),
                emailProvider: config.emailProvider || 'none',
                supportEmail: config.supportEmail || 'orders@kamiwear.in',
                session: config.session || { cookieAuth: true, tokenInBody: false },
            }))
            .catch(() => {
                // Do not cache a failed lookup: the next open should retry
                // (important after a cold start / temporary API outage).
                this._configPromise = null;
                return {
                    googleClientId: '',
                    currency: 'INR',
                    payments: { cod: true, upi: true, card: false, simulatedCard: false },
                    upi: {
                        id: '9253395564@ybl',
                        payeeName: 'Kamiwear',
                        qrImage: '/assets/payments/kamiwear-upi-scanner.png',
                    },
                    emailConfigured: false,
                    emailProvider: 'none',
                    supportEmail: 'orders@kamiwear.in',
                    session: { cookieAuth: true, tokenInBody: false },
                };
            });

        return this._configPromise;
    },

    async _request(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

        // Bearer support remains for old clients/API tools, but the browser
        // session itself lives in an httpOnly cookie and is not readable by JS.
        const token = this.getToken();
        if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
            credentials: 'include',
        });
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }
        if (!response.ok) {
            const message = data.details || data.error || `Request failed (${response.status})`;
            const error = new Error(message);
            error.status = response.status;
            error.code = data.code || '';
            error.data = data;

            if (response.status === 401 && ['SESSION_REPLACED', 'SESSION_EXPIRED', 'INVALID_TOKEN', 'TOKEN_EXPIRED'].includes(error.code)) {
                this._clearLocalSession();
                window.dispatchEvent(new CustomEvent('authExpired', { detail: { message, code: error.code } }));
            }

            throw error;
        }
        return data;
    },

    // ---------------------------------------------------------- Authentication
    async register(name, email, password) {
        try {
            const data = await this._request('/auth/register', {
                method: 'POST',
                auth: false,
                body: JSON.stringify({ name, email, password }),
            });
            this._storeSession(data);
            return data;
        } catch (error) {
            return { error: error.message || 'Registration failed' };
        }
    },

    async login(email, password) {
        try {
            const data = await this._request('/auth/login', {
                method: 'POST',
                auth: false,
                body: JSON.stringify({ email, password }),
            });
            this._storeSession(data);
            return data;
        } catch (error) {
            return { error: error.message || 'Login failed' };
        }
    },

    async googleLogin(token) {
        try {
            const data = await this._request('/auth/google', {
                method: 'POST',
                auth: false,
                body: JSON.stringify({ token }),
            });
            this._storeSession(data);
            return data;
        } catch (error) {
            return { error: error.message || 'Google authentication failed' };
        }
    },

    _storeSession(data) {
        if (!data || !data.user) return;

        // Do not persist the JWT in localStorage. The server sets an httpOnly
        // cookie; localStorage only caches the public profile for instant UI.
        localStorage.removeItem('kw_token');
        localStorage.setItem('kw_user', JSON.stringify(data.user));
        localStorage.setItem(SESSION_HINT_KEY, '1');
        localStorage.setItem(SESSION_VERIFIED_KEY, String(Date.now()));
        if (data.user.email) localStorage.setItem(LAST_EMAIL_KEY, data.user.email);
        try {
            sessionStorage.removeItem('kw_signed_out');
        } catch (error) {}
        window.dispatchEvent(new CustomEvent('authUpdated', { detail: data.user }));
    },

    _clearLocalSession() {
        localStorage.removeItem('kw_token');
        localStorage.removeItem('kw_user');
        localStorage.removeItem(SESSION_HINT_KEY);
        localStorage.removeItem(SESSION_VERIFIED_KEY);
    },

    async updateProfile(profileData) {
        try {
            const data = await this._request('/auth/update-profile', {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });
            if (data.user) {
                localStorage.setItem('kw_user', JSON.stringify(data.user));
                localStorage.setItem(SESSION_VERIFIED_KEY, String(Date.now()));
                window.dispatchEvent(new CustomEvent('authUpdated', { detail: data.user }));
            }
            return data;
        } catch (error) {
            return { error: error.message || 'Update failed' };
        }
    },

    async verifySession(force = false) {
        const cachedUser = this.getUser();
        const hasSession = Boolean(cachedUser || localStorage.getItem(SESSION_HINT_KEY));
        if (!hasSession) return null;

        const verifiedAt = Number(localStorage.getItem(SESSION_VERIFIED_KEY) || 0);
        if (!force && cachedUser && Date.now() - verifiedAt < SESSION_CACHE_MS) {
            return cachedUser;
        }

        try {
            const data = await this._request('/auth/me');
            if (data.user) {
                localStorage.setItem('kw_user', JSON.stringify(data.user));
                localStorage.setItem(SESSION_HINT_KEY, '1');
                localStorage.setItem(SESSION_VERIFIED_KEY, String(Date.now()));
                window.dispatchEvent(new CustomEvent('authUpdated', { detail: data.user }));
                return data.user;
            }
            this._clearLocalSession();
            return null;
        } catch (error) {
            if (error.status === 401 || error.status === 404) {
                this._clearLocalSession();
                window.dispatchEvent(new CustomEvent('authUpdated', { detail: null }));
                return null;
            }
            // Network/server issue: keep the cached session instead of logging out.
            console.error('Session verification failed:', error.message);
            return cachedUser;
        }
    },

    async logout() {
        try {
            await this._request('/auth/logout', { method: 'POST' });
        } catch (error) {
            // Even if the server is unreachable, clear the local profile. The
            // httpOnly cookie expires on its own; the server also rotates the
            // session when the request succeeds.
        }
        this._clearLocalSession();
        try {
            sessionStorage.setItem('kw_signed_out', '1');
        } catch (error) {}
        window.dispatchEvent(new CustomEvent('authUpdated', { detail: null }));
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html?auth=true';
        } else {
            const next = new URL(window.location.href);
            next.searchParams.set('auth', 'true');
            window.location.href = next.toString();
        }
    },

    getLastEmail() {
        return localStorage.getItem(LAST_EMAIL_KEY) || '';
    },

    rememberEmail(email) {
        const value = String(email || '').trim().toLowerCase();
        if (value) localStorage.setItem(LAST_EMAIL_KEY, value);
        return value;
    },

    getUser() {
        try {
            const user = localStorage.getItem('kw_user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },

    getToken() {
        // Legacy only. New sessions use the httpOnly cookie and never write a
        // token into localStorage.
        return localStorage.getItem('kw_token');
    },

    newIdempotencyKey() {
        return newIdempotencyKey();
    },

    // -------------------------------------------------------------------- Cart
    getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem('kw_cart') || '[]');
            if (!Array.isArray(cart)) return [];

            // Drop entries saved by older/broken sessions (missing name, zero
            // price, corrupt quantity). They used to stay in the cart forever
            // and made checkout fail with "Invalid price for ..." for everyone
            // on that browser.
            const clean = cart
                .filter(entry => entry && typeof entry === 'object')
                .map(entry => normalizeCartItem(entry, entry.quantity))
                .filter(item => item.price > 0 && item.quantity > 0);

            if (clean.length !== cart.length) {
                localStorage.setItem('kw_cart', JSON.stringify(clean));
            }

            return clean;
        } catch (e) {
            return [];
        }
    },

    saveCart(cart) {
        const safeCart = Array.isArray(cart) ? cart : [];
        localStorage.setItem('kw_cart', JSON.stringify(safeCart));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: safeCart }));
        return safeCart;
    },

    addToCart(product, quantity = 1) {
        const item = normalizeCartItem(product, quantity);
        if (!item.name || !Number.isFinite(item.price) || item.price <= 0) {
            console.warn('Refusing to add an item without a valid name/price:', product);
            return false;
        }

        const cart = this.getCart();
        const existing = cart.find(entry => entry.id === item.id);
        if (existing) {
            existing.quantity = Math.min(25, existing.quantity + item.quantity);
        } else {
            cart.push(item);
        }
        this.saveCart(cart);
        return true;
    },

    updateQuantity(productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(entry => entry.id === productId);
        if (!item) return;
        item.quantity = Math.max(0, Math.min(25, Math.floor(Number(quantity) || 0)));
        this.saveCart(cart.filter(entry => entry.quantity > 0));
    },

    removeFromCart(productId) {
        this.saveCart(this.getCart().filter(item => item.id !== productId));
    },

    clearCart() {
        this.saveCart([]);
    },

    getCartTotal() {
        return this.getCart().reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
    },

    // ----------------------------------------------------------------- Wishlist
    getWishlist() {
        try {
            const wishlist = JSON.parse(localStorage.getItem('kw_wishlist') || '[]');
            if (!Array.isArray(wishlist)) return [];

            return wishlist
                .filter(entry => entry && typeof entry === 'object')
                .map(entry => normalizeCartItem(entry, 1))
                .filter(item => item.price > 0)
                .map(({ quantity, ...item }) => item);
        } catch (e) {
            return [];
        }
    },

    saveWishlist(wishlist) {
        const safeWishlist = Array.isArray(wishlist) ? wishlist : [];
        localStorage.setItem('kw_wishlist', JSON.stringify(safeWishlist));
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: safeWishlist }));
        return safeWishlist;
    },

    productId(product) {
        return normalizeCartItem(product, 1).id;
    },

    isInWishlist(product) {
        const id = this.productId(product);
        return this.getWishlist().some(item => item.id === id);
    },

    toggleWishlist(product) {
        const item = normalizeCartItem(product, 1);
        if (!item.name || !Number.isFinite(item.price) || item.price <= 0) {
            return { added: false, item: null };
        }

        const wishlist = this.getWishlist();
        const index = wishlist.findIndex(entry => entry.id === item.id);

        if (index > -1) {
            wishlist.splice(index, 1);
            this.saveWishlist(wishlist);
            return { added: false, item };
        }

        const savedItem = { id: item.id, name: item.name, price: item.price, image: item.image, category: item.category };
        this.saveWishlist([savedItem, ...wishlist]);
        return { added: true, item: savedItem };
    },

    removeFromWishlist(productId) {
        const id = String(productId || '');
        if (!id) return;
        this.saveWishlist(this.getWishlist().filter(item => item.id !== id));
    },

    // ------------------------------------------------------------------ Orders
    async placeOrder({ paymentMethod = 'COD', paymentDetails = {}, shipping = {}, idempotencyKey = '' } = {}) {
        if (!this.getUser() && !localStorage.getItem(SESSION_HINT_KEY)) {
            return { success: false, message: 'Please log in to complete your order.' };
        }

        const cart = this.getCart();
        if (cart.length === 0) return { success: false, message: 'Your cart is empty.' };

        const key = String(idempotencyKey || newIdempotencyKey()).trim();

        try {
            const data = await this._request('/orders/create', {
                method: 'POST',
                headers: { 'Idempotency-Key': key },
                body: JSON.stringify({
                    items: cart,
                    paymentMethod,
                    paymentDetails,
                    shipping,
                    idempotencyKey: key,
                }),
            });

            if (data.order) {
                this.clearCart();
                return {
                    success: true,
                    order: data.order,
                    message: data.message,
                    email: data.email || null,
                    duplicate: Boolean(data.duplicate),
                };
            }
            return { success: false, message: data.error || 'Order could not be created.' };
        } catch (error) {
            console.error('Order Error:', error);
            return {
                success: false,
                message: error.message || 'Could not reach the server. Please try again.',
                code: error.code || '',
                status: error.status || 0,
            };
        }
    },

    async getOrderHistory() {
        if (!this.getUser() && !localStorage.getItem(SESSION_HINT_KEY)) return [];
        try {
            const data = await this._request('/orders/history');
            return data.orders || [];
        } catch (error) {
            console.error('Failed to fetch order history:', error.message);
            return [];
        }
    },

    // ------------------------------------------------------------------ Search
    _catalog: null,
    _catalogPromise: null,

    /**
     * Load the complete product catalog generated from every storefront page.
     * The result is cached for the rest of the session; the overlay preloads it
     * so typing stays instant.
     */
    loadProductCatalog(force = false) {
        if (!force && Array.isArray(this._catalog) && this._catalog.length) {
            return Promise.resolve(this._catalog);
        }
        if (!force && this._catalogPromise) return this._catalogPromise;

        this._catalogPromise = fetch('data/products.json?v=2', {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then(response => {
                if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
                return response.json();
            })
            .then(payload => {
                const products = Array.isArray(payload) ? payload : payload.products;
                this._catalog = Array.isArray(products)
                    ? products.filter(product => product && product.name && Number(product.price) > 0)
                    : [];
                return this._catalog;
            })
            .catch(error => {
                console.error('[Kamiwear] Product catalog unavailable:', error.message);
                this._catalog = Array.isArray(this._catalog) ? this._catalog : [];
                return this._catalog;
            })
            .finally(() => {
                this._catalogPromise = null;
            });

        return this._catalogPromise;
    },

    getProductCatalog() {
        return Array.isArray(this._catalog) ? this._catalog : [];
    },

    searchProducts(query, catalog = null) {
        const q = normalizeSearchText(query);
        if (!q) return [];

        const products = Array.isArray(catalog) ? catalog : this.getProductCatalog();
        if (!products.length) return [];

        const tokens = q.split(' ');
        const scored = [];

        products.forEach(product => {
            const name = normalizeSearchText(product.name);
            const category = normalizeSearchText(product.category);
            const series = normalizeSearchText(product.series);
            const haystack = normalizeSearchText(
                product.search || [product.name, product.category, product.series, product.gender, product.type].join(' ')
            );

            // Every query word must appear somewhere in the product record, so
            // "women baggy jeans" narrows instead of widening the result set.
            if (!tokens.every(token => haystack.includes(token))) return;

            let score = 0;
            if (name === q) score += 120;
            else if (name.startsWith(q)) score += 60;
            else if (name.includes(q)) score += 30;

            tokens.forEach(token => {
                if (name.split(' ').includes(token)) score += 8;
                else if (name.includes(token)) score += 4;
                if (category.includes(token)) score += 2;
                if (series.includes(token)) score += 1;
                if (String(product.gender || '').toLowerCase() === token) score += 3;
            });

            scored.push({ product, score });
        });

        scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
        return scored.map(entry => entry.product);
    },

    async searchProductsAsync(query) {
        const catalog = await this.loadProductCatalog();
        return this.searchProducts(query, catalog);
    },
};

window.Store = Store;
