// Use same-origin /api in production. In local development, talk to the API on
// port 3000 (this also works when the static files are served by another tool).
const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const API_BASE = isLocal
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : '/api';

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
                razorpayKeyId: config.razorpayKeyId || '',
                currency: config.currency || 'INR',
                payments: config.payments || { cod: true, upi: true, card: false, simulatedCard: false },
            }))
            .catch(() => {
                // Do not cache a failed lookup: the next open should retry
                // (important after a cold start / temporary API outage).
                this._configPromise = null;
                return {
                    googleClientId: '',
                    razorpayKeyId: '',
                    currency: 'INR',
                    payments: { cod: true, upi: true, card: false, simulatedCard: false },
                };
            });

        return this._configPromise;
    },

    async _request(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

        const token = this.getToken();
        if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
            error.data = data;
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
        if (!data || !data.token) return;
        localStorage.setItem('kw_token', data.token);
        localStorage.setItem('kw_user', JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent('authUpdated', { detail: data.user }));
    },

    async updateProfile(profileData) {
        try {
            const data = await this._request('/auth/update-profile', {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });
            if (data.token) localStorage.setItem('kw_token', data.token);
            if (data.user) {
                localStorage.setItem('kw_user', JSON.stringify(data.user));
                window.dispatchEvent(new CustomEvent('authUpdated', { detail: data.user }));
            }
            return data;
        } catch (error) {
            return { error: error.message || 'Update failed' };
        }
    },

    async verifySession() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const data = await this._request('/auth/me');
            if (data.user) {
                localStorage.setItem('kw_user', JSON.stringify(data.user));
                window.dispatchEvent(new CustomEvent('authUpdated', { detail: data.user }));
                return data.user;
            }
            this.logout();
            return null;
        } catch (error) {
            if (error.status === 401 || error.status === 404) {
                this.logout();
                return null;
            }
            // Network/server issue: keep the cached session instead of logging out.
            console.error('Session verification failed:', error.message);
            return this.getUser();
        }
    },

    logout() {
        localStorage.removeItem('kw_token');
        localStorage.removeItem('kw_user');
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html';
        } else {
            window.location.reload();
        }
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
        return localStorage.getItem('kw_token');
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
    async placeOrder({ paymentMethod = 'COD', paymentDetails = {}, shipping = {} } = {}) {
        if (!this.getToken()) return { success: false, message: 'Please log in to complete your order.' };

        const cart = this.getCart();
        if (cart.length === 0) return { success: false, message: 'Your cart is empty.' };

        try {
            const data = await this._request('/orders/create', {
                method: 'POST',
                body: JSON.stringify({
                    items: cart,
                    paymentMethod,
                    paymentDetails,
                    shipping,
                }),
            });

            if (data.order) {
                this.clearCart();
                return { success: true, order: data.order, message: data.message };
            }
            return { success: false, message: data.error || 'Order could not be created.' };
        } catch (error) {
            console.error('Order Error:', error);
            return {
                success: false,
                message: error.message || 'Could not reach the server. Please try again.',
            };
        }
    },

    async createRazorpayOrder() {
        const cart = this.getCart();
        return this._request('/orders/razorpay/create', {
            method: 'POST',
            body: JSON.stringify({ items: cart }),
        });
    },

    async getOrderHistory() {
        if (!this.getToken()) return [];
        try {
            const data = await this._request('/orders/history');
            return data.orders || [];
        } catch (error) {
            console.error('Failed to fetch order history:', error.message);
            return [];
        }
    },

    // ------------------------------------------------------------------ Search
    searchProducts(query) {
        const q = String(query || '').toLowerCase().trim();
        const products = [
            { id: 'tanjiro-hoodie', name: 'Tanjiro Hoodie V2', price: 6800, image: 'assets/hoodies/water-breathing-hoodie-main.jpeg', category: 'Demon Slayer' },
            { id: 'neo-tokyo-tee', name: 'Neo-Tokyo Heavy Tee', price: 4400, image: 'assets/cdn/nobara-resonance-c48588.png', category: 'Neo Tokyo' },
            { id: 'sukuna-hoodie', name: 'Sukuna Cursed Hoodie', price: 6320, image: 'assets/t-shirts/sukuna-cursed-energy-main.jpeg', category: 'Cursed Energy' },
            { id: 'zenitsu-jacket', name: 'Zenitsu Bolt Jacket', price: 9600, image: 'assets/generated/demon-slayer-kokushibo-hoodie-1773032491748.png', category: 'Demon Slayer' },
            { id: 'cyber-joggers', name: 'Cyber Joggers 2077', price: 7600, image: 'assets/generated/night-city-cyber-joggers-1773032534008.png', category: 'Night City' },
            { id: 'shinobi-mask', name: 'Shinobi Tech Mask', price: 3600, image: 'assets/accessories/headband-replica.jpeg', category: 'Accessories' },
        ];

        if (!q) return [];
        return products.filter(product =>
            product.name.toLowerCase().includes(q) || product.category.toLowerCase().includes(q)
        );
    },
};

window.Store = Store;
