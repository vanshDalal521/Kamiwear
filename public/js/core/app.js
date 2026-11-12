document.addEventListener('DOMContentLoaded', () => {
    const CURRENCY = '₹';

    const formatMoney = value => `${CURRENCY}${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    // 1. Update every cart count badge in the nav
    const updateCartCount = () => {
        const count = window.Store.getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);

        const badges = new Set(document.querySelectorAll('#cart-count-badge, [data-cart-count]'));
        document.querySelectorAll('.material-symbols-outlined').forEach(icon => {
            if (!['shopping_cart', 'shopping_bag'].includes(icon.textContent.trim())) return;
            const badge = icon.parentElement?.querySelector('span:not(.material-symbols-outlined)');
            if (badge) badges.add(badge);
        });

        badges.forEach(badge => {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    };

    window.addEventListener('cartUpdated', updateCartCount);
    updateCartCount();

    // 2. Product extraction helpers
    const parsePrice = value => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        const cleaned = String(value || '').replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const cleanText = value => String(value || '').replace(/\s+/g, ' ').trim();

    const isProductUi = el => {
        if (!el || !el.closest) return false;
        return !el.closest('#cart-drawer') &&
            !el.closest('#profile-modal') &&
            !el.closest('nav') &&
            !el.closest('footer');
    };

    const findProductCard = button => {
        let node = button;
        let best = null;

        for (let depth = 0; node && depth < 10; depth += 1) {
            if (node === document.body || node === document.documentElement) break;
            if (node.matches && (node.matches('[data-price]') || node.matches('.product-card'))) {
                return node;
            }
            if (node.matches && node.matches('.group, .liquid-glass, .glass-panel, .glass-card')) {
                // Prefer the smallest card-like container that also has a price or an image.
                if (node.querySelector('img') || /\d/.test(node.textContent || '')) best = node;
            }
            node = node.parentElement;
        }
        return best;
    };

    const extractProductFromCard = card => {
        if (!card) return null;

        let name = card.dataset.name || card.dataset.productName || '';
        if (!name) {
            const heading = card.querySelector('h1, h2, h3, h4, h5, .product-name');
            if (heading) name = cleanText(heading.textContent);
        }
        if (!name) {
            // Fall back to the most prominent bold line, skipping tiny category labels.
            const candidates = Array.from(card.querySelectorAll('p, span, div'))
                .map(el => cleanText(el.textContent))
                .filter(text => text && text.length < 80 && !/[₹$]/.test(text));
            name = candidates.sort((a, b) => b.length - a.length)[0] || 'Product';
        }

        let price = parsePrice(card.dataset.price);
        if (!price) {
            const priceEl = Array.from(card.querySelectorAll('p, span, div, h4, h5'))
                .find(el => /[₹$]\s?[\d,]+(?:\.\d+)?/.test(el.textContent || ''));
            if (priceEl) price = parsePrice(priceEl.textContent);
        }

        const imgEl = card.querySelector('img');
        let image = imgEl ? imgEl.currentSrc || imgEl.src || '' : '';
        if (!image) {
            const bgEl = card.querySelector('[style*="background-image"]');
            if (bgEl) image = bgEl.style.backgroundImage.replace(/^url\(['"]?|['"]?\)$/g, '');
        }

        const categoryEl = card.querySelector('[data-category], .text-accent-purple, .text-primary.font-bold.uppercase');
        const category = categoryEl ? cleanText(categoryEl.textContent) : 'Apparel';

        return { name: name || 'Product', price, image, category };
    };

    const extractProductFromPage = () => {
        // Prefer explicit product markup; never fall back to the navbar logo.
        const titleEl = document.getElementById('product-title') ||
            document.querySelector('h1.text-6xl, h1.text-5xl, h1.text-4xl');
        const name = cleanText(titleEl?.textContent || document.title.split('|')[0]);

        const priceEl = document.getElementById('product-price') ||
            document.querySelector('.text-4xl.text-primary, .text-5xl.text-primary, .text-3xl.text-primary, .text-primary.font-800');
        let price = parsePrice(priceEl?.textContent);
        if (!price) {
            const anyPrice = Array.from(document.querySelectorAll('p, span, div'))
                .find(el => /[₹$]\s?[\d,]{3,}/.test(el.textContent || ''));
            if (anyPrice) price = parsePrice(anyPrice.textContent);
        }

        const mainImage = document.getElementById('product-main-image');
        const image = mainImage?.src || document.querySelector('main img, img[alt]')?.src || '';
        const categoryEl = document.querySelector('.font-orbitron.text-accent-purple');
        return {
            name,
            price,
            image,
            category: cleanText(categoryEl?.textContent || 'Apparel'),
            size: document.body.dataset.kwSize || '',
            color: document.body.dataset.kwColor || '',
        };
    };

    // 3. Add to Cart Logic
    const isAddToCartControl = el => {
        if (!el || !isProductUi(el)) return false;
        const text = cleanText(el.textContent).toUpperCase();
        if (text.includes('ADD TO CART') || text.includes('ADD TO BAG') || text.includes('TO CART')) return true;
        // Icon-only controls (common on the shop grid)
        const icon = el.querySelector?.('.material-symbols-outlined');
        return Boolean(icon && cleanText(icon.textContent) === 'add_shopping_cart' && text.length <= 24);
    };

    // On touch devices the hover-only add-to-cart controls never appear, which
    // makes the store impossible to use from a phone. Keep them visible there.
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
        const touchStyle = document.createElement('style');
        touchStyle.textContent = '@media (hover: none) { .kw-add-to-cart, .kw-visible-on-touch { opacity: 1 !important; transform: none !important; } }';
        document.head.appendChild(touchStyle);
    }

    const attachCartListeners = root => {
        const scope = root && root.querySelectorAll ? root : document;
        const candidates = Array.from(scope.querySelectorAll('button, a[role="button"], [data-add-to-cart]'));

        candidates.forEach(btn => {
            if (btn.dataset.cartListener === 'true') return;
            if (!isAddToCartControl(btn)) return;

            btn.dataset.cartListener = 'true';
            btn.classList.add('kw-add-to-cart');
            const hoverParent = btn.closest('.quick-view, .opacity-0');
            if (hoverParent) hoverParent.classList.add('kw-visible-on-touch');

            btn.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();

                // Prefer the smallest product card that contains this button.
                // On the product page the main CTA has no card, so it falls
                // back to reading the product hero.
                const card = findProductCard(btn);
                const product = card ? extractProductFromCard(card) : extractProductFromPage();

                if (!product || !product.name || !product.price) {
                    console.warn('[Kamiwear] Could not read product details from this card.', btn);
                    return;
                }

                const added = window.Store.addToCart(product);
                if (!added) return;

                if (window.toggleCart) window.toggleCart(true);

                const original = btn.innerHTML;
                const hadText = cleanText(btn.textContent).length > 0;
                if (hadText) {
                    btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> ADDED';
                }
                btn.classList.add('bg-green-500');
                btn.disabled = true;

                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.classList.remove('bg-green-500');
                    btn.disabled = false;
                }, 1400);
            });
        });
    };

    // 4. Product Card Navigation
    const initProductNavigation = root => {
        const scope = root && root.querySelectorAll ? root : document;
        const cards = Array.from(scope.querySelectorAll('[data-price], .product-card, .glass-card'));

        cards.forEach(card => {
            if (card.dataset.navListener === 'true') return;
            if (!isProductUi(card)) return;

            const hasPrice = card.dataset.price || /[₹$]\s?[\d,]/.test(card.textContent || '');
            if (!hasPrice) return;

            card.dataset.navListener = 'true';
            card.style.cursor = 'pointer';
            card.addEventListener('click', event => {
                if (event.target.closest('button, a, input, select, textarea')) return;

                const product = extractProductFromCard(card);
                if (!product || !product.name) return;

                const params = new URLSearchParams({
                    name: product.name,
                    price: String(product.price),
                    image: product.image || '',
                });
                window.location.href = `product.html?${params.toString()}`;
            });
        });
    };

    // 5. Initialization + re-scan for dynamically rendered content
    let scheduled = false;
    const refresh = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            attachCartListeners();
            initProductNavigation();
        });
    };

    attachCartListeners();
    initProductNavigation();

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });

    // 6. Profile UI
    const updateProfileUI = () => {
        const user = window.Store.getUser();
        const userIcons = Array.from(document.querySelectorAll('nav .material-symbols-outlined, #profile-btn-trigger .material-symbols-outlined'))
            .filter(el => ['person', 'account_circle'].includes(el.textContent.trim()));

        if (user && userIcons.length > 0) {
            userIcons.forEach(userIcon => {
                const parent = userIcon.parentElement;
                if (parent && !parent.querySelector('img.user-nav-avatar')) {
                    userIcon.style.display = 'none';

                    const img = document.createElement('img');
                    img.src = 'assets/brand/kw.png';
                    img.alt = 'User Avatar';
                    img.className = 'w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-primary/50 user-nav-avatar object-cover shadow-[0_0_10px_rgba(242,223,13,0.3)] hover:scale-110 transition-transform';
                    parent.appendChild(img);
                }
            });
        } else if (!user) {
            document.querySelectorAll('.user-nav-avatar').forEach(avatar => avatar.remove());
            userIcons.forEach(icon => {
                icon.style.display = '';
                icon.textContent = 'person';
                icon.classList.remove('text-primary');
            });
        }
    };
    updateProfileUI();

    // 7. Verify Session on Load
    if (window.Store && typeof window.Store.verifySession === 'function') {
        window.Store.verifySession().then(() => {
            updateProfileUI();

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('auth') === 'true' && !window.Store.getUser()) {
                if (window.toggleProfile) window.toggleProfile(true);
            }
        });
    }

    // Expose helpers other pages can reuse.
    window.KamiwearUI = {
        formatMoney,
        parsePrice,
        extractProductFromPage,
        extractProductFromCard,
        findProductCard,
        refresh,
    };
});
