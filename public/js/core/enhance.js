/**
 * Kamiwear interaction layer.
 *
 * Loaded last on every page. Most of the original templates were static
 * mock-ups with hover-only or decorative controls; this file gives those
 * controls real behaviour without rewriting each page:
 *   - nav / wishlist / quick-view controls
 *   - hero CTAs + anthem video
 *   - shop sorting, filters, grid/list view and load-more
 *   - product gallery, size & colour selection, accordions, size guide
 *   - collection drop CTAs and category filters
 *   - newsletter forms, profile wish archive and order details
 */
(function () {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
    const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const parsePrice = value => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        const cleaned = String(value || '').replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const THEME_YELLOW = '#f9f906';
    const PLACEHOLDER = 'assets/brand/placeholder.jpg';
    const storeReady = () => Boolean(window.Store && typeof window.Store.getCart === 'function');

    // ------------------------------------------------------------------ styles
    function injectStyles() {
        if (document.getElementById('kw-enhance-styles')) return;
        const style = document.createElement('style');
        style.id = 'kw-enhance-styles';
        style.textContent = `
            #kw-toast-stack{position:fixed;right:20px;bottom:20px;z-index:300;display:flex;flex-direction:column;gap:10px;max-width:min(360px,calc(100vw - 40px))}
            .kw-toast{background:rgba(10,8,18,.96);color:#f8fafc;border:1px solid rgba(249,249,6,.45);box-shadow:0 18px 50px rgba(0,0,0,.55);border-radius:14px;padding:13px 16px;font:600 12px/1.5 Inter,system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;display:flex;gap:10px;align-items:flex-start;animation:kwToastIn .25s ease both}
            .kw-toast[data-type="error"]{border-color:rgba(248,113,113,.6)}
            .kw-toast[data-type="success"]{border-color:rgba(74,222,128,.6)}
            .kw-toast .kw-toast-dot{width:7px;height:7px;border-radius:999px;background:#f9f906;margin-top:5px;flex:0 0 auto}
            .kw-toast[data-type="error"] .kw-toast-dot{background:#f87171}
            .kw-toast[data-type="success"] .kw-toast-dot{background:#4ade80}
            @keyframes kwToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
            .kw-selected{outline:2px solid ${THEME_YELLOW};outline-offset:2px;box-shadow:0 0 18px rgba(249,249,6,.25)}
            .kw-list-view{display:flex!important;flex-direction:column!important;gap:14px!important}
            .kw-list-view .product-card{display:flex;gap:18px;align-items:stretch;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.03)}
            .kw-list-view .product-card>div:first-child{width:170px;flex:0 0 170px;aspect-ratio:4/5;margin-bottom:0}
            .kw-list-view .product-card>div:last-child{flex:1;align-self:center;padding:8px 10px}
            .kw-list-view .quick-view{position:static!important;opacity:1!important;transform:none!important;margin-top:10px}
            @media(max-width:640px){.kw-list-view .product-card>div:first-child{width:110px;flex-basis:110px;margin-bottom:0}}
            @media (hover:none){.kw-touch-visible{opacity:1!important;transform:none!important}}
            #kw-anthem-modal{position:fixed;inset:0;z-index:260;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(3,2,8,.92);backdrop-filter:blur(10px)}
            #kw-anthem-modal.kw-open{display:flex}
            #kw-anthem-modal .kw-video-shell{width:min(980px,100%);background:#0a0812;border:1px solid rgba(255,255,255,.12);border-radius:22px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.7)}
            #kw-anthem-modal video{display:block;width:100%;max-height:72vh;background:#000}
            #kw-anthem-modal .kw-video-title{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-top:1px solid rgba(255,255,255,.08)}
            #kw-anthem-modal .kw-video-title span:first-child{font:800 13px Syne,system-ui,sans-serif;letter-spacing:.28em;text-transform:uppercase;color:#f9f906}
            #kw-anthem-modal button{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:999px;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center}
            .kw-modal{position:fixed;inset:0;z-index:270;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(3,2,8,.86);backdrop-filter:blur(8px)}
            .kw-modal .kw-modal-card{width:min(620px,100%);max-height:86vh;overflow:auto;background:#0d0b16;border:1px solid rgba(249,249,6,.28);border-radius:20px;padding:28px;color:#e2e8f0;box-shadow:0 30px 90px rgba(0,0,0,.7);font-family:Inter,system-ui,sans-serif}
            .kw-modal h3{font:800 22px Syne,system-ui,sans-serif;text-transform:uppercase;margin:0 0 16px;color:#f8fafc}
            .kw-modal label{display:block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;margin:12px 0 6px}
            .kw-modal input,.kw-modal select,.kw-modal textarea{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#fff;font-size:13px}
            .kw-modal table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
            .kw-modal th,.kw-modal td{border-bottom:1px solid rgba(255,255,255,.08);padding:10px 8px;text-align:left}
            .kw-modal th{color:#f9f906;text-transform:uppercase;letter-spacing:.12em;font-size:10px}
            .kw-modal .kw-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
            .kw-modal button.kw-btn{border-radius:999px;padding:11px 20px;font:700 11px Inter,system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#e2e8f0}
            .kw-modal button.kw-btn-primary{background:#f9f906;color:#000;border-color:#f9f906}
            .kw-accordion-panel{display:none;color:#94a3b8;font-size:13px;line-height:1.7;padding:0 0 18px}
            .kw-accordion-panel.kw-open{display:block}
            .kw-order-card{cursor:pointer}
        `;
        document.head.appendChild(style);
    }

    // ------------------------------------------------------------------- toast
    function toast(message, type = 'info', timeout = 3200) {
        let stack = document.getElementById('kw-toast-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'kw-toast-stack';
            document.body.appendChild(stack);
        }
        const el = document.createElement('div');
        el.className = 'kw-toast';
        el.dataset.type = type;
        el.innerHTML = `<span class="kw-toast-dot"></span><span>${String(message || '').replace(/[<>&]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch]))}</span>`;
        stack.appendChild(el);
        window.setTimeout(() => {
            el.style.transition = 'opacity .25s ease, transform .25s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
            window.setTimeout(() => el.remove(), 260);
        }, timeout);
    }
    window.kwToast = toast;

    // ------------------------------------------------------------- anthem modal
    function openAnthem() {
        let modal = document.getElementById('kw-anthem-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'kw-anthem-modal';
            modal.innerHTML = `
                <div class="kw-video-shell">
                    <video id="kw-anthem-video" controls playsinline preload="metadata"
                        poster="assets/video/kamiwear-anthem-poster.jpg"
                        src="assets/video/kamiwear-anthem.mp4"></video>
                    <div class="kw-video-title">
                        <span>KAMIWEAR // ANTHEM</span>
                        <button type="button" aria-label="Close anthem video" data-kw-close-anthem>✕</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', event => {
                if (event.target === modal || event.target.closest('[data-kw-close-anthem]')) closeAnthem();
            });
            modal.querySelector('video').addEventListener('error', () => {
                toast('Anthem video is still uploading. Try again in a moment.', 'error');
            });
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && modal.classList.contains('kw-open')) closeAnthem();
            });
        }
        modal.classList.add('kw-open');
        const video = modal.querySelector('video');
        video.muted = false;
        video.currentTime = 0;
        const attempt = video.play();
        if (attempt && typeof attempt.catch === 'function') {
            attempt.catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
        }
    }
    function closeAnthem() {
        const modal = document.getElementById('kw-anthem-modal');
        if (!modal) return;
        modal.classList.remove('kw-open');
        const video = modal.querySelector('video');
        if (video) video.pause();
    }
    window.openKamiwearAnthem = openAnthem;

    // ------------------------------------------------------------- generic modal
    function openModal(title, bodyHtml, onMount) {
        closeModal();
        const modal = document.createElement('div');
        modal.className = 'kw-modal';
        modal.id = 'kw-generic-modal';
        modal.innerHTML = `<div class="kw-modal-card"><h3>${title}</h3><div class="kw-modal-body">${bodyHtml}</div></div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', event => {
            if (event.target === modal || event.target.closest('[data-kw-modal-close]')) closeModal();
        });
        document.addEventListener('keydown', function esc(event) {
            if (event.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', esc);
            }
        });
        if (typeof onMount === 'function') onMount(modal);
        return modal;
    }
    function closeModal() {
        document.getElementById('kw-generic-modal')?.remove();
    }

    // ---------------------------------------------------------- product helpers
    function classifyProduct(name) {
        const value = String(name || '').toUpperCase();
        if (/SNEAKER|RUNNER|SHOE|BOOT/.test(value)) return 'ACCESSORIES';
        if (/BELT|BAG|TOTE|CAP|HAT|MASK|PENDANT|SOCKS|ACCESSOR/.test(value)) return 'ACCESSORIES';
        if (/JOGGER|CARGO|PANT|SHORT|JEAN|TROUSER/.test(value)) return 'BOTTOMS';
        if (/TEE|T-SHIRT|SHIRT|TOP|LONG SLEEVE/.test(value)) return 'TEES';
        if (/HOODIE|JACKET|VEST|KNIT|BOMBER|SWEATSHIRT|COAT|KIMONO/.test(value)) return 'OUTERWEAR';
        return 'OUTERWEAR';
    }

    function productFromCard(card) {
        if (!card) return null;
        let name = card.dataset.name || card.dataset.productName || '';
        if (!name) {
            const heading = card.querySelector('h1, h2, h3, h4, h5, .product-name');
            if (heading) name = clean(heading.textContent);
        }
        if (!name) {
            const candidates = $$('p, span, div', card)
                .map(el => clean(el.textContent))
                .filter(text => text && text.length < 80 && !/[₹$]/.test(text));
            name = candidates.sort((a, b) => b.length - a.length)[0] || 'Product';
        }

        let price = parsePrice(card.dataset.price);
        if (!price) {
            const priceEl = $$('p, span, div, h4, h5', card)
                .find(el => /[₹$]\s?[\d,]+(?:\.\d+)?/.test(el.textContent || ''));
            if (priceEl) price = parsePrice(priceEl.textContent);
        }

        const img = card.querySelector('img');
        let image = img ? img.getAttribute('src') || img.src || '' : '';
        if (!image) {
            const bgEl = card.querySelector('[style*="background-image"]');
            if (bgEl) image = bgEl.style.backgroundImage.replace(/^url\(['"]?|['"]?\)$/g, '');
        }

        const seriesEl = card.querySelector('p');
        const series = clean(card.dataset.series || seriesEl?.textContent || 'Archive');
        return {
            name: name || 'Product',
            price,
            image,
            category: card.dataset.category || classifyProduct(name),
            series,
        };
    }

    function findProductCard(button) {
        let node = button;
        for (let depth = 0; node && depth < 10; depth += 1) {
            if (node === document.body || node === document.documentElement) break;
            if (node.matches && (node.matches('[data-price]') || node.matches('.product-card'))) return node;
            node = node.parentElement;
        }
        return button?.closest?.('[data-price], .product-card, .glass-card, .liquid-glass') || null;
    }

    function goToProduct(card) {
        const product = productFromCard(card);
        if (!product || !product.name) return;
        const params = new URLSearchParams({
            name: product.name,
            price: String(product.price || 0),
            image: product.image || '',
            category: product.category || 'Apparel',
        });
        window.location.href = `product.html?${params.toString()}`;
    }

    // --------------------------------------------------------- global listeners
    function initGlobalDelegates() {
        document.addEventListener('click', event => {
            const button = event.target.closest('button, a');
            if (!button) return;
            const icon = button.querySelector('.material-symbols-outlined');
            const iconText = clean(icon?.textContent || '').toLowerCase();

            // Wishlist controls in the nav and on product cards.
            if (iconText === 'favorite' || iconText === 'favorite_border') {
                if (button.closest('nav')) {
                    if (page !== 'wishlist.html') {
                        event.preventDefault();
                        window.location.href = 'wishlist.html';
                    }
                    return;
                }
                if (button.id === 'wishlist-button' || button.closest('#wishlist-grid') || button.closest('#cart-drawer')) return;

                const card = findProductCard(button);
                if (!card || !storeReady()) return;
                const product = productFromCard(card);
                if (!product || !product.price) return;
                event.preventDefault();
                event.stopPropagation();
                const result = window.Store.toggleWishlist(product);
                if (icon) icon.textContent = result.added ? 'favorite' : 'favorite_border';
                button.style.color = result.added ? THEME_YELLOW : '';
                button.classList.add('kw-touch-visible');
                button.parentElement?.classList.add('kw-touch-visible');
                toast(result.added ? 'Saved to wish archive' : 'Removed from wish archive', result.added ? 'success' : 'info');
                return;
            }

            // Quick view on the shop grid -> open the real product page.
            if (clean(button.textContent).toLowerCase().includes('quick view')) {
                event.preventDefault();
                event.stopPropagation();
                const card = findProductCard(button);
                if (card) goToProduct(card);
                return;
            }

            // Notification bell.
            if (iconText === 'notifications') {
                event.preventDefault();
                toast('No new transmissions. Drop alerts are active.');
                return;
            }

            // Dead # links still need feedback instead of doing nothing.
            const anchor = button.tagName === 'A' ? button : null;
            if (anchor && anchor.getAttribute('href') === '#' && !anchor.dataset.kwHandled) {
                event.preventDefault();
                toast('This archive is being restored — explore the current drop in the shop.', 'info');
            }
        });
    }

    function initNewsletter() {
        $$('footer input[type="email"], footer input[placeholder*="EMAIL" i]').forEach(input => {
            if (input.dataset.kwNewsletter === 'true') return;
            input.dataset.kwNewsletter = 'true';
            const row = input.parentElement;
            const button = row?.querySelector('button');
            if (!button) return;

            const subscribe = () => {
                const email = clean(input.value);
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    toast('Enter a valid email to join the syndicate.', 'error');
                    input.focus();
                    return;
                }
                try {
                    localStorage.setItem('kw_newsletter_email', email);
                } catch (error) {}
                input.value = '';
                toast('Subscribed. Drop alerts will reach your terminal.', 'success');
            };

            button.addEventListener('click', event => {
                event.preventDefault();
                subscribe();
            });
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    subscribe();
                }
            });
        });
    }

    function initRankCards() {
        const labels = new Set(['GENIN', 'CHUNIN', 'JONIN', 'KAGE']);
        $$('div').forEach(el => {
            if (!labels.has(clean(el.textContent))) return;
            const card = el.closest('.glass-panel');
            if (!card || card.dataset.kwRank === 'true') return;
            card.dataset.kwRank = 'true';
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                if (storeReady() && window.Store.getUser()) window.location.href = 'profile.html';
                else if (window.toggleProfile) window.toggleProfile(true);
                else window.location.href = 'index.html?auth=true';
            });
        });
    }

    function initHome() {
        const buttons = $$('button');
        const summon = buttons.find(button => /SUMMON COLLECTION/i.test(button.textContent));
        const anthem = buttons.find(button => /WATCH ANTHEM/i.test(button.textContent));
        if (summon && summon.dataset.kwBound !== 'true') {
            summon.dataset.kwBound = 'true';
            summon.addEventListener('click', () => {
                window.location.href = 'shop.html';
            });
        }
        if (anthem && anthem.dataset.kwBound !== 'true') {
            anthem.dataset.kwBound = 'true';
            anthem.addEventListener('click', event => {
                event.preventDefault();
                openAnthem();
            });
        }

        $$('a').forEach(link => {
            if (/VIEW ALL ARCHIVES/i.test(link.textContent) && link.getAttribute('href') !== 'shop.html') {
                link.setAttribute('href', 'shop.html');
            }
        });

        // Community imagery should lead somewhere useful.
        $$('#community img').forEach(img => {
            if (img.dataset.kwBound === 'true') return;
            img.dataset.kwBound = 'true';
            img.addEventListener('click', () => {
                window.location.href = 'shop.html';
            });
        });
        initRankCards();
    }

    // --------------------------------------------------------------------- shop
    const EXTRA_PRODUCTS = [
        { name: 'Flame Reaper Hoodie', price: 8900, image: 'assets/cdn/black-anime-hoodie-with-flame-graphics-59266a.png', series: 'Demon Slayer' },
        { name: 'Neon Runner Hoodie', price: 12600, image: 'assets/cdn/cyberpunk-black-hoodie-with-neon-yello-a4caf7.png', series: 'Cyberpunk' },
        { name: 'Shiro Oversized Tee', price: 3900, image: 'assets/cdn/oversized-white-anime-graphic-t-shirt-71804a.png', series: 'Jujutsu Kaisen' },
        { name: 'Kuro Minimal Tee', price: 3200, image: 'assets/cdn/black-minimalist-anime-t-shirt-1c0599.png', series: 'Akira' },
        { name: 'Ronin Denim Jacket', price: 15800, image: 'assets/cdn/denim-jacket-with-embroidery-87f061.png', series: 'Ghost in the Shell' },
        { name: 'Strap Cargo Shorts', price: 6400, image: 'assets/cdn/black-cargo-shorts-with-many-straps-27d7ee.png', series: 'Cyberpunk 2077' },
        { name: 'Archive Tote Bag', price: 2600, image: 'assets/cdn/canvas-tote-bag-with-anime-print-d34cca.png', series: 'Accessories' },
        { name: 'Zenitsu Oversized Tee', price: 4200, image: 'assets/cdn/zenitsu-oversized-a04b3a.png', series: 'Demon Slayer' },
    ];

    function shopCardMarkup(product) {
        const params = new URLSearchParams({
            name: product.name,
            price: String(product.price),
            image: product.image,
            category: product.category,
        });
        return `
            <div class="product-card group relative" data-price="${product.price}"
                 data-name="${product.name}" data-image="${product.image}"
                 data-series="${product.series}" data-category="${classifyProduct(product.name)}">
                <div class="relative aspect-[4/5] glass-panel rounded-2xl overflow-hidden mb-4">
                    <a href="product.html?${params.toString()}" class="block h-full">
                        <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt="${product.name}" src="${product.image}" />
                    </a>
                    <div class="absolute top-4 left-4 flex flex-col gap-2">
                        <span class="font-orbitron text-[10px] bg-primary text-background-dark px-2 py-1 font-bold">NEW</span>
                    </div>
                    <button class="absolute top-4 right-4 h-10 w-10 glass-panel flex items-center justify-center rounded-full hover:bg-white/20 transition-all kw-touch-visible" aria-label="Save ${product.name}">
                        <span class="material-symbols-outlined text-xl">favorite_border</span>
                    </button>
                    <div class="quick-view absolute bottom-4 left-4 right-4 opacity-0 transform translate-y-4 transition-all duration-300 flex flex-col gap-2">
                        <button class="w-full py-3 bg-white text-background-dark font-bold text-xs tracking-widest rounded-xl shadow-2xl uppercase">Quick View</button>
                        <button class="w-full py-3 bg-primary text-black font-bold text-xs tracking-widest rounded-xl shadow-2xl uppercase flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-sm">add_shopping_cart</span> ADD TO CART
                        </button>
                    </div>
                </div>
                <div class="space-y-1 px-2">
                    <p class="text-[10px] font-bold text-accent-purple tracking-widest uppercase">${product.series}</p>
                    <h3 class="text-sm font-semibold text-white/90">${product.name}</h3>
                    <div class="flex items-center justify-between mt-2">
                        <p class="text-sm font-bold text-primary">${money(product.price)}.00</p>
                        <div class="flex text-primary">
                            <span class="material-symbols-outlined text-xs fill-1">star</span>
                            <span class="material-symbols-outlined text-xs fill-1">star</span>
                            <span class="material-symbols-outlined text-xs fill-1">star</span>
                            <span class="material-symbols-outlined text-xs fill-1">star</span>
                            <span class="material-symbols-outlined text-xs">star</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function initShop() {
        const grids = $$('main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
        const grid = grids[0] || $('.product-card')?.parentElement;
        if (!grid) return;
        // The shop is split into gender sections, so filters must span every
        // grid rather than only the first one.
        const allCards = () => $$('.product-card', $('main')).filter(card => !card.closest('footer'));
        const countEl = $$('main p').find(p => /Showing\s+\d+\s+of\s+\d+/i.test(p.textContent));

        // Category chip labels that map onto classifyProduct() buckets.
        const CATEGORY_ALIASES = { ALL: '', JEANS: 'BOTTOMS', HOODIES: 'OUTERWEAR' };
        const isCategoryChip = button =>
            !button.classList.contains('gender-filter-btn') &&
            /^(ALL|OUTERWEAR|TEES|BOTTOMS|JEANS|HOODIES|ACCESSORIES)$/i.test(clean(button.textContent));

        // The static template ships with two decorative "active filter" chips
        // that do not match the unfiltered catalog. Remove them so the chip row
        // always reflects the real filter state.
        $$('main span').forEach(chip => {
            if (clean(chip.querySelector('.material-symbols-outlined')?.textContent) === 'close') {
                chip.remove();
            }
        });

        allCards().forEach((card, index) => {
            const product = productFromCard(card);
            card.dataset.name = product.name;
            card.dataset.image = product.image;
            card.dataset.series = product.series;
            card.dataset.category = classifyProduct(product.name);
            card.dataset.kwOrder = String(index);
            const heart = card.querySelector('button .material-symbols-outlined')?.closest('button');
            if (heart) heart.classList.add('kw-touch-visible');
        });

        let activeCategory = '';
        let seriesTouched = false;
        const selectedSeries = () => $$('aside input[type="checkbox"]')
            .filter(input => input.checked)
            .map(input => clean(input.closest('label')?.textContent || '').toUpperCase())
            .filter(Boolean);

        function applyFilters() {
            const series = seriesTouched ? selectedSeries() : [];
            allCards().forEach(card => {
                const categoryOk = !activeCategory || card.dataset.category === activeCategory;
                const seriesOk = series.length === 0 ||
                    series.some(name => String(card.dataset.series || '').toUpperCase().includes(name));
                // Record the verdict instead of writing display directly: the
                // shop's pagination (kwApplyShopView) owns the final rendering
                // so filters and paging never fight over element styles.
                card.dataset.kwFilter = (categoryOk && seriesOk) ? '1' : '0';
            });
            if (window.kwApplyShopView) {
                window.kwApplyShopView();
            } else {
                allCards().forEach(card => {
                    card.style.display = card.dataset.kwFilter === '0' ? 'none' : '';
                });
                if (countEl) {
                    const visible = allCards().filter(card => card.dataset.kwFilter !== '0').length;
                    countEl.textContent = `Showing ${visible} of ${allCards().length} products in premium catalog`;
                }
            }
        }

        function setCategory(category, clicked) {
            activeCategory = category;
            const chips = $$('aside button').filter(isCategoryChip);
            chips.forEach(chip => {
                const label = clean(chip.textContent).toUpperCase();
                const effective = Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, label)
                    ? CATEGORY_ALIASES[label]
                    : label;
                const isActive = effective === (category || '');
                chip.classList.toggle('bg-primary', isActive);
                chip.classList.toggle('text-background-dark', isActive);
                chip.classList.toggle('bg-white/10', !isActive);
                chip.classList.toggle('hover:bg-white/20', !isActive);
            });
            if (clicked) toast(category ? `Filtering: ${category.toLowerCase()}` : 'Showing every archived product');
            applyFilters();
        }

        // Add an ALL chip so users can reset the category filter.
        const categoryHeading = $$('aside h3').find(h => /CATEGORIES/i.test(h.textContent));
        if (categoryHeading) {
            const row = categoryHeading.parentElement?.querySelector('.flex.flex-wrap');
            if (row && !$$('button', row).some(button => clean(button.textContent).toUpperCase() === 'ALL')) {
                const all = document.createElement('button');
                all.textContent = 'ALL';
                all.className = 'px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20';
                row.prepend(all);
            }
        }
        $$('aside button').forEach(button => {
            if (!isCategoryChip(button)) return;
            if (button.dataset.kwCategory === 'true') return;
            button.dataset.kwCategory = 'true';
            button.addEventListener('click', () => {
                const label = clean(button.textContent).toUpperCase();
                const category = Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, label)
                    ? CATEGORY_ALIASES[label]
                    : label;
                setCategory(category, true);
            });
        });
        setCategory('', false);

        // Anime series checkboxes.
        $$('aside input[type="checkbox"]').forEach(input => {
            if (input.dataset.kwSeries === 'true') return;
            input.dataset.kwSeries = 'true';
            input.addEventListener('change', () => {
                seriesTouched = true;
                applyFilters();
            });
        });

        // Colour swatches: visible selection + feedback.
        const colorHeading = $$('aside h3').find(h => /^COLOR$/i.test(clean(h.textContent)));
        if (colorHeading) {
            const swatches = $$('button', colorHeading.parentElement);
            const colorName = button => {
                const cls = button.className;
                if (cls.includes('bg-black')) return 'Midnight Black';
                if (cls.includes('bg-white')) return 'Bone White';
                if (cls.includes('bg-primary')) return 'Electric Yellow';
                if (cls.includes('bg-accent-purple')) return 'Cursed Purple';
                return 'Storm Grey';
            };
            swatches.forEach(button => {
                button.addEventListener('click', () => {
                    const isSelected = button.classList.contains('kw-selected');
                    swatches.forEach(other => other.classList.remove('kw-selected'));
                    if (!isSelected) button.classList.add('kw-selected');
                    toast(isSelected ? 'Colour filter cleared' : `Colour preference: ${colorName(button)}`);
                });
            });
        }

        // Size chips: visible selection + feedback.
        const sizeHeading = $$('aside h3').find(h => /^SIZE$/i.test(clean(h.textContent)));
        if (sizeHeading) {
            const sizes = $$('button', sizeHeading.parentElement);
            sizes.forEach(button => {
                button.addEventListener('click', () => {
                    const wasSelected = button.classList.contains('kw-selected');
                    sizes.forEach(other => {
                        other.classList.remove('kw-selected');
                        other.classList.remove('border-primary', 'bg-primary/10');
                        other.classList.add('border-white/10');
                    });
                    if (!wasSelected) {
                        button.classList.add('kw-selected', 'border-primary', 'bg-primary/10');
                        button.classList.remove('border-white/10');
                        toast(`Size preference: ${clean(button.textContent)}`);
                    } else {
                        toast('Size filter cleared');
                    }
                });
            });
        }

        // Sort.
        const sortSelect = $('main select');
        if (sortSelect && sortSelect.dataset.kwSort !== 'true') {
            sortSelect.dataset.kwSort = 'true';
            sortSelect.addEventListener('change', () => {
                const option = clean(sortSelect.value);
                const cards = allCards();
                if (/LOW TO HIGH/i.test(option)) {
                    cards.sort((a, b) => parsePrice(a.dataset.price) - parsePrice(b.dataset.price));
                } else if (/HIGH TO LOW/i.test(option)) {
                    cards.sort((a, b) => parsePrice(b.dataset.price) - parsePrice(a.dataset.price));
                } else if (/BEST SELLING/i.test(option)) {
                    cards.sort((a, b) => String(a.dataset.name).localeCompare(String(b.dataset.name)));
                } else {
                    cards.sort((a, b) => Number(a.dataset.kwOrder) - Number(b.dataset.kwOrder));
                }
                cards.forEach(card => grid.appendChild(card));
                toast(`Sorted: ${option.toLowerCase()}`);
            });
        }

        // Remove sort chips.
        $$('main span').forEach(chip => {
            const icon = chip.querySelector('.material-symbols-outlined');
            if (clean(icon?.textContent) !== 'close') return;
            chip.style.cursor = 'pointer';
            chip.addEventListener('click', () => {
                const label = clean(chip.textContent).replace('close', '').trim().toUpperCase();
                if (/OUTERWEAR|TEES|BOTTOMS|ACCESSORIES|ALL/.test(label)) {
                    setCategory('', false);
                } else {
                    const checkbox = $$('aside input[type="checkbox"]').find(input =>
                        clean(input.closest('label')?.textContent || '').toUpperCase().includes(label));
                    if (checkbox) {
                        checkbox.checked = false;
                        seriesTouched = true;
                    }
                }
                chip.remove();
                applyFilters();
                toast('Filter removed');
            });
        });

        // Grid / list toggle.
        const gridButton = $$('button').find(button => clean(button.querySelector('.material-symbols-outlined')?.textContent) === 'grid_view');
        const listButton = $$('button').find(button => clean(button.querySelector('.material-symbols-outlined')?.textContent) === 'view_list');
        const setView = list => {
            grids.forEach(target => target.classList.toggle('kw-list-view', list));
            gridButton?.classList.toggle('text-primary', !list);
            listButton?.classList.toggle('text-primary', list);
            gridButton?.classList.toggle('bg-white/10', !list);
            listButton?.classList.toggle('bg-white/10', list);
            if (listButton) listButton.classList.toggle('hover:bg-white/5', !list);
            if (gridButton) gridButton.classList.toggle('hover:bg-white/5', list);
        };
        gridButton?.addEventListener('click', () => setView(false));
        listButton?.addEventListener('click', () => setView(true));

        // Load more. Buttons marked data-kw-paginated belong to the shop's own
        // gender-aware pagination, so leave those alone.
        const loadMore = $$('button').find(button => /LOAD MORE/i.test(clean(button.textContent)));
        if (loadMore && loadMore.dataset.kwLoadMore !== 'true' && loadMore.dataset.kwPaginated !== 'true') {
            loadMore.dataset.kwLoadMore = 'true';
            loadMore.addEventListener('click', () => {
                if (loadMore.disabled) return;
                grid.insertAdjacentHTML('beforeend', EXTRA_PRODUCTS.map(product => shopCardMarkup(product)).join(''));
                const added = allCards().slice(-EXTRA_PRODUCTS.length);
                added.forEach((card, offset) => {
                    card.dataset.kwOrder = String(allCards().length + offset);
                });
                loadMore.disabled = true;
                loadMore.textContent = 'ALL PRODUCTS LOADED';
                loadMore.classList.add('opacity-40', 'cursor-not-allowed');
                applyFilters();
                toast('Eight more artifacts added to the archive.', 'success');
            });
        }

        applyFilters();
    }

    // ------------------------------------------------------------------ product
    function initProduct() {
        const mainImage = document.getElementById('product-main-image');
        const title = document.getElementById('product-title');
        if (!mainImage && !title) return;

        // Default size + colour reflected in body dataset (read by app.js).
        document.body.dataset.kwSize = document.body.dataset.kwSize || 'L';
        document.body.dataset.kwColor = document.body.dataset.kwColor || 'Midnight Black';

        // Colour swatches.
        const colorLabel = $$('span').find(span => /^Color:/i.test(clean(span.textContent)));
        const colorSection = colorLabel?.closest('.space-y-3') || colorLabel?.parentElement?.parentElement;
        if (colorSection) {
            const buttons = $$('button', colorSection).filter(button => /rounded-full/.test(button.className));
            const nameFor = button => {
                const cls = button.className;
                if (cls.includes('bg-black')) return 'Midnight Black';
                if (cls.includes('bg-slate-700')) return 'Storm Grey';
                if (cls.includes('bg-slate-200')) return 'Bone White';
                if (cls.includes('bg-primary')) return 'Electric Yellow';
                return 'Archive Colour';
            };
            const select = button => {
                buttons.forEach(other => {
                    other.style.borderColor = 'transparent';
                    other.style.boxShadow = 'none';
                    other.classList.remove('kw-selected');
                });
                button.style.borderColor = THEME_YELLOW;
                button.style.boxShadow = '0 0 0 4px rgba(249,249,6,.12)';
                button.classList.add('kw-selected');
                const value = nameFor(button);
                document.body.dataset.kwColor = value;
                const valueEl = colorLabel.querySelector('span');
                if (valueEl) valueEl.textContent = value;
            };
            buttons.forEach(button => {
                button.setAttribute('aria-label', nameFor(button));
                button.addEventListener('click', () => select(button));
            });
            if (buttons[0]) select(buttons[0]);
        }

        // Size buttons.
        const sizeLabel = $$('span, a').find(el => /^Select Size$/i.test(clean(el.textContent)));
        const sizeSection = sizeLabel?.closest('.space-y-3') || sizeLabel?.parentElement?.parentElement;
        let selectedSize = '';
        if (sizeSection) {
            const sizeButtons = $$('button', sizeSection).filter(button => /^(S|M|L|XL|XXL|2XL|3XL)$/i.test(clean(button.textContent)));
            const select = button => {
                sizeButtons.forEach(other => {
                    other.classList.remove('bg-primary', 'text-black');
                    other.classList.add('border', 'border-glass-border', 'hover:border-primary');
                    other.style.background = '';
                    other.style.color = '';
                });
                button.classList.remove('border', 'border-glass-border');
                button.classList.add('bg-primary', 'text-black');
                button.style.background = THEME_YELLOW;
                button.style.color = '#000';
                selectedSize = clean(button.textContent).toUpperCase();
                document.body.dataset.kwSize = selectedSize;
                if (window.Store && selectedSize) {
                    sessionStorage.setItem('kw_selected_size', selectedSize);
                }
            };
            sizeButtons.forEach(button => button.addEventListener('click', () => select(button)));
            const defaultButton = sizeButtons.find(button => button.classList.contains('bg-primary')) || sizeButtons[1] || sizeButtons[0];
            if (defaultButton) select(defaultButton);
        }

        // Thumbnail gallery + 360 + video thumb.
        const thumbGrid = $('.grid.grid-cols-5');
        if (thumbGrid && mainImage) {
            const thumbs = $$(':scope > div', thumbGrid);
            const activate = thumb => {
                thumbs.forEach(other => {
                    other.classList.remove('border-primary/50', 'border-2');
                    other.classList.add('opacity-60');
                    other.style.borderColor = 'transparent';
                });
                thumb.classList.remove('opacity-60');
                thumb.style.borderColor = 'rgba(249,249,6,.55)';
                const img = thumb.querySelector('img');
                if (img && mainImage) {
                    mainImage.src = img.getAttribute('src');
                    mainImage.style.transform = 'scale(1)';
                }
            };
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    const img = thumb.querySelector('img');
                    if (img) {
                        activate(thumb);
                        return;
                    }
                    openAnthem();
                });
            });
            const imageThumbs = thumbs.filter(thumb => thumb.querySelector('img'));
            let spinIndex = 0;
            const spinButton = $$('button').find(button => /360/.test(button.textContent));
            spinButton?.addEventListener('click', event => {
                event.preventDefault();
                if (!imageThumbs.length) return;
                spinIndex = 0;
                const timer = window.setInterval(() => {
                    const thumb = imageThumbs[spinIndex % imageThumbs.length];
                    activate(thumb);
                    spinIndex += 1;
                    if (spinIndex >= imageThumbs.length * 2) {
                        window.clearInterval(timer);
                        toast('360° scan complete');
                    }
                }, 320);
            });
        }

        // Accordions.
        $$('.cursor-pointer').forEach(row => {
            const label = clean(row.querySelector('span')?.textContent || '');
            if (!/^(PRODUCT DESCRIPTION|SIZE & FIT|SHIPPING & RETURNS)$/i.test(label)) return;
            if (row.dataset.kwAccordion === 'true') return;
            row.dataset.kwAccordion = 'true';
            const icon = row.querySelector('.material-symbols-outlined');
            const panel = document.createElement('div');
            panel.className = 'kw-accordion-panel';
            const copy = {
                'product description': 'Premium heavyweight cotton with reinforced stitching, a relaxed oversized silhouette and high-density anime-inspired embroidery. Each piece is inspected before it leaves the archive.',
                'size & fit': 'Relaxed, true-to-size fit with dropped shoulders. If you want a boxier silhouette, take one size up. Full measurements are available in the size guide.',
                'shipping & returns': 'Orders dispatch within 24–48 hours. Free worldwide shipping over ₹12,000. Unworn items can be returned within 14 days of delivery.',
            };
            panel.textContent = copy[label.toLowerCase()] || 'Archive details coming soon.';
            row.insertAdjacentElement('afterend', panel);
            row.addEventListener('click', () => {
                const open = panel.classList.toggle('kw-open');
                if (icon) icon.textContent = open ? 'remove' : 'add';
                row.style.color = open ? THEME_YELLOW : '';
            });
        });

        // Size guide modal.
        $$('a, button').forEach(el => {
            if (!/^SIZE GUIDE$/i.test(clean(el.textContent))) return;
            if (el.dataset.kwSizeGuide === 'true') return;
            el.dataset.kwSizeGuide = 'true';
            el.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                if (el.tagName === 'A') el.removeAttribute('href');
                openModal('Size Guide', `
                    <p style="color:#94a3b8;font-size:12px;line-height:1.7;margin:0 0 10px">
                        Measurements are in centimetres. Our cuts are intentionally oversized; choose your normal size for the intended fit.
                    </p>
                    <table>
                        <tr><th>Size</th><th>Chest</th><th>Length</th><th>Sleeve</th></tr>
                        <tr><td>S</td><td>104</td><td>66</td><td>60</td></tr>
                        <tr><td>M</td><td>110</td><td>69</td><td>62</td></tr>
                        <tr><td>L</td><td>116</td><td>72</td><td>64</td></tr>
                        <tr><td>XL</td><td>122</td><td>75</td><td>66</td></tr>
                        <tr><td>XXL</td><td>128</td><td>78</td><td>68</td></tr>
                    </table>
                    <div class="kw-modal-actions"><button type="button" class="kw-btn kw-btn-primary" data-kw-modal-close>Got it</button></div>
                `);
            });
        });

        // Review modal.
        const reviewButton = $$('button').find(button => /WRITE A REVIEW/i.test(clean(button.textContent)));
        if (reviewButton && reviewButton.dataset.kwReview !== 'true') {
            reviewButton.dataset.kwReview = 'true';
            reviewButton.addEventListener('click', () => {
                openModal('Write a Review', `
                    <label>Display name</label>
                    <input id="kw-review-name" type="text" placeholder="Your codename" />
                    <label>Rating</label>
                    <select id="kw-review-rating">
                        <option value="5">★★★★★ — Legendary</option>
                        <option value="4">★★★★☆ — Strong</option>
                        <option value="3">★★★☆☆ — Decent</option>
                        <option value="2">★★☆☆☆ — Needs work</option>
                        <option value="1">★☆☆☆☆ — Broken</option>
                    </select>
                    <label>Review</label>
                    <textarea id="kw-review-body" rows="4" placeholder="How does the fabric feel? How is the fit?"></textarea>
                    <div class="kw-modal-actions">
                        <button type="button" class="kw-btn" data-kw-modal-close>Cancel</button>
                        <button type="button" class="kw-btn kw-btn-primary" id="kw-review-submit">Submit review</button>
                    </div>
                `, modal => {
                    modal.querySelector('#kw-review-submit').addEventListener('click', () => {
                        const name = clean(modal.querySelector('#kw-review-name').value) || 'Anonymous Shinobi';
                        const rating = Number(modal.querySelector('#kw-review-rating').value) || 5;
                        const body = clean(modal.querySelector('#kw-review-body').value);
                        if (body.length < 4) {
                            toast('Write a few words before submitting.', 'error');
                            return;
                        }
                        const stars = Array.from({ length: 5 }, (_, index) =>
                            `<span class="material-symbols-outlined text-[14px] ${index < rating ? 'fill-1' : ''}">star</span>`).join('');
                        const list = $$('section').find(section => /Customer Reviews/i.test(section.textContent))?.querySelector('.flex-1.space-y-6');
                        if (list) {
                            list.insertAdjacentHTML('afterbegin', `
                                <div class="glass-card p-8 rounded-2xl">
                                    <div class="flex justify-between items-start mb-6">
                                        <div class="flex items-center gap-4">
                                            <div class="size-12 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold">${name.slice(0, 1).toUpperCase()}</div>
                                            <div>
                                                <h4 class="font-bold text-slate-100">${name.replace(/[<>&]/g, '')}</h4>
                                                <div class="flex text-primary text-xs">${stars}</div>
                                            </div>
                                        </div>
                                        <span class="text-xs text-slate-500 font-medium">just now</span>
                                    </div>
                                    <p class="text-slate-300 leading-relaxed">${body.replace(/[<>&]/g, '')}</p>
                                </div>`);
                        }
                        closeModal();
                        toast('Review transmitted. Thank you, warrior.', 'success');
                    });
                });
            });
        }
    }

    // --------------------------------------------------------------- collections
    function initCollection() {
        const collectionPages = ['demon-slayer.html', 'cursed-energy.html', 'night-city.html', 'neo-tokyo.html'];
        if (!collectionPages.includes(page)) return;

        const productSection = $$('main section').find(section => section.querySelector('[data-price]'));
        if (productSection && !productSection.id) productSection.id = 'kw-collection-grid';

        $$('main button').forEach(button => {
            if (!/EXPLORE DROP|UNLEASH VOID|JACK IN|ACTIVATE/i.test(clean(button.textContent))) return;
            if (button.dataset.kwCta === 'true') return;
            button.dataset.kwCta = 'true';
            button.style.cursor = 'pointer';
            button.addEventListener('click', () => {
                productSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                toast('Drop unlocked. Scroll the archive.');
            });
        });

        // Demon Slayer category filter bar.
        const filterButtons = $$('main button').filter(button => /^(ALL|T-SHIRTS|HOODIES|ACCESSORIES)$/i.test(clean(button.textContent)));
        if (filterButtons.length) {
            const cards = $$('main [data-price]').filter(card => !card.closest('footer'));
            const apply = category => {
                cards.forEach(card => {
                    const name = clean(card.querySelector('h3, h4')?.textContent || productFromCard(card)?.name || '').toUpperCase();
                    let match = true;
                    if (category === 'T-Shirts') match = /TEE|T-SHIRT|SHIRT/.test(name);
                    else if (category === 'Hoodies') match = /HOODIE/.test(name);
                    else if (category === 'Accessories') match = /PACK|BELT|PENDANT|MASK|CAP|BAG|ACCESSOR/.test(name);
                    card.style.display = match ? '' : 'none';
                });
                filterButtons.forEach(button => {
                    const active = clean(button.textContent).toLowerCase() === category.toLowerCase();
                    button.classList.toggle('bg-primary', active);
                    button.classList.toggle('text-black', active);
                    button.classList.toggle('hover:bg-white/5', !active);
                    button.classList.toggle('text-slate-300', !active);
                });
                toast(category === 'All' ? 'Showing the full drop' : `Filtering: ${category}`);
            };
            filterButtons.forEach(button => {
                if (button.dataset.kwFilter === 'true') return;
                button.dataset.kwFilter = 'true';
                button.addEventListener('click', () => apply(clean(button.textContent)));
            });
        }

        $$('main [data-price]').forEach(card => {
            card.dataset.category = classifyProduct(productFromCard(card)?.name || '');
        });
    }

    // ------------------------------------------------------------------ wishlist
    function initWishlist() {
        if (page !== 'wishlist.html') return;
        $$('main button').forEach(button => {
            if (/NOTIFY ME/i.test(clean(button.textContent)) && button.dataset.kwNotify !== 'true') {
                button.dataset.kwNotify = 'true';
                button.addEventListener('click', () => {
                    button.textContent = 'SIGNAL REGISTERED';
                    button.classList.add('text-primary', 'border-primary/40');
                    toast('Signal registered. We will alert you when this drop returns.', 'success');
                });
            }
        });

        // Size chips inside wishlist cards.
        const grid = document.getElementById('wishlist-grid');
        if (grid) {
            grid.addEventListener('click', event => {
                const chip = event.target.closest('button');
                if (!chip || !/^(S|M|L|XL|XXL|2XL|28|30|32|OS)$/i.test(clean(chip.textContent))) return;
                event.preventDefault();
                const siblings = chip.parentElement ? $$('button', chip.parentElement) : [];
                const selected = chip.classList.contains('kw-selected');
                siblings.forEach(other => {
                    other.classList.remove('kw-selected');
                    other.style.borderColor = '';
                    other.style.color = '';
                });
                if (!selected) {
                    chip.classList.add('kw-selected');
                    chip.style.borderColor = THEME_YELLOW;
                    chip.style.color = THEME_YELLOW;
                }
            });
        }
    }

    // ------------------------------------------------------------------- profile
    function initProfile() {
        if (page !== 'profile.html') return;

        // Render the real wishlist into the Wish Archives tab.
        const archive = $('#wish-archives-section');
        if (archive && storeReady()) {
            const items = window.Store.getWishlist();
            const placeholder = archive.querySelector('.border-dashed');
            if (placeholder) {
                if (!items.length) {
                    // Keep the nice empty state.
                } else {
                    const grid = document.createElement('div');
                    grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
                    grid.innerHTML = items.map(item => `
                        <a href="product.html?${new URLSearchParams({ name: item.name, price: String(item.price), image: item.image || '', category: item.category || 'Archive' }).toString()}"
                           class="liquid-glass rounded-2xl p-4 flex gap-4 hover:border-primary/40 transition-all">
                            <img src="${item.image || PLACEHOLDER}" alt="${item.name}" class="w-20 h-20 rounded-xl object-cover bg-white/5"
                                 onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
                            <div class="min-w-0">
                                <h5 class="font-syne text-sm font-bold uppercase truncate">${item.name}</h5>
                                <p class="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest mt-1">${item.category || 'Archive'}</p>
                                <p class="text-primary font-bold mt-2">${money(item.price)}</p>
                            </div>
                        </a>`).join('');
                    placeholder.replaceWith(grid);
                }
            }
        }

        // Order detail modal.
        document.addEventListener('click', async event => {
            const card = event.target.closest('#mission-feed [data-order-id], #mission-feed .liquid-glass');
            if (!card) return;
            if (event.target.closest('a')) return;
            const orderId = card.dataset.orderId;
            if (!orderId) return;
            let order = (window.__kwOrders || []).find(entry => entry._id === orderId);
            if (!order && storeReady()) {
                const orders = await window.Store.getOrderHistory();
                order = orders.find(entry => entry._id === orderId);
            }
            if (!order) {
                toast('Order details are unavailable right now.', 'error');
                return;
            }
            const items = (order.items || []).map(item => `
                <tr>
                    <td>${String(item.name || 'Item').replace(/[<>&]/g, '')}${item.size ? ` · ${item.size}` : ''}</td>
                    <td>${item.quantity || 1}</td>
                    <td>${money(item.price)}</td>
                </tr>`).join('');
            openModal(`Order #KM-${String(order._id || '').slice(-6).toUpperCase()}`, `
                <p style="color:#94a3b8;font-size:12px;margin:0 0 12px">
                    Status: <strong style="color:#f9f906">${order.status || 'Transmitting'}</strong><br>
                    Placed: ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}<br>
                    Payment: ${order.paymentMethod || 'COD'}
                </p>
                <table>
                    <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
                    ${items || '<tr><td colspan="3">No items recorded.</td></tr>'}
                </table>
                <p style="text-align:right;margin:14px 0 0;font-weight:800;color:#f9f906">Total: ${money(order.totalAmount)}</p>
                <div class="kw-modal-actions"><button type="button" class="kw-btn kw-btn-primary" data-kw-modal-close>Close</button></div>
            `);
        });

        $$('button').forEach(button => {
            if (/UNLOCK PERKS/i.test(clean(button.textContent)) && button.dataset.kwPerks !== 'true') {
                button.dataset.kwPerks = 'true';
                button.addEventListener('click', () => toast('Perks unlock at Chunin tier. Keep collecting KamiKoins.', 'info'));
            }
            if (/VIEW ALL TRANSMISSIONS/i.test(clean(button.textContent)) && button.dataset.kwTransmissions !== 'true') {
                button.dataset.kwTransmissions = 'true';
                button.addEventListener('click', () => toast('All available transmissions are already on screen.'));
            }
        });
    }

    // --------------------------------------------------------------------- boot
    function init() {
        injectStyles();
        initGlobalDelegates();
        initNewsletter();

        if (page === 'index.html' || page === '') initHome();
        if (page === 'shop.html') initShop();
        if (page === 'product.html') initProduct();
        initCollection();
        initWishlist();
        initProfile();

        // Some templates render their cards after their own DOMContentLoaded
        // handlers. Re-run the tiny hero/rank wiring once more after that.
        if (page === 'index.html' || page === '') window.setTimeout(initRankCards, 400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
