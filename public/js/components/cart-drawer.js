document.addEventListener('DOMContentLoaded', () => {
    const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const escapeHtml = value => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // 1. Create the Cart Drawer HTML structure dynamically if it doesn't exist
    if (!document.getElementById('cart-drawer')) {
        const drawer = document.createElement('div');
        drawer.id = 'cart-drawer';
        drawer.className = 'fixed top-0 right-0 w-full md:w-[450px] h-full z-[100] translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] glass-panel border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col';
        drawer.innerHTML = `
            <div class="p-8 border-b border-white/10 flex items-center justify-between">
                <h3 class="font-syne text-2xl uppercase italic font-bold">Your Archive</h3>
                <button id="close-cart" class="p-2 hover:bg-white/5 rounded-full transition-colors" aria-label="Close cart">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div id="cart-items" class="flex-grow overflow-y-auto p-8 space-y-6">
                <!-- Items injected here -->
            </div>
            <div class="p-8 border-t border-white/10 space-y-4 bg-black/20">
                <div class="flex justify-between items-end">
                    <span class="text-sm text-slate-400 uppercase tracking-widest">Subtotal</span>
                    <span id="cart-subtotal" class="font-syne text-2xl font-bold">₹0</span>
                </div>
                <button id="checkout-btn" class="w-full bg-primary text-black font-bold py-4 rounded-full hover:bg-primary/80 transition-all flex items-center justify-center gap-2">
                    PROCESS CHECKOUT
                    <span class="material-symbols-outlined">trending_flat</span>
                </button>
                <p class="text-[10px] text-center text-slate-500 uppercase tracking-[0.2em]">Shipping & taxes calculated at checkout</p>
            </div>
        `;
        document.body.appendChild(drawer);

        const backdrop = document.createElement('div');
        backdrop.id = 'cart-backdrop';
        backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] opacity-0 pointer-events-none transition-opacity duration-500';
        document.body.appendChild(backdrop);
    }

    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    const itemsContainer = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const checkoutBtn = document.getElementById('checkout-btn');

    const renderCart = () => {
        if (!itemsContainer) return;
        const cart = window.Store.getCart();

        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <span class="material-symbols-outlined text-6xl">inventory_2</span>
                    <p class="uppercase tracking-widest text-sm">Your archive is empty</p>
                    <button class="text-primary text-xs underline" id="continue-shopping">CONTINUE SEARCHING</button>
                </div>
            `;
            document.getElementById('continue-shopping')?.addEventListener('click', () => toggleCart(false));
            if (subtotalEl) subtotalEl.textContent = money(0);
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.classList.add('opacity-40', 'cursor-not-allowed');
            }
            return;
        }

        itemsContainer.innerHTML = cart.map(item => {
            const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
            const image = item.image || 'assets/brand/placeholder.jpg';
            return `
                <div class="flex gap-4 group">
                    <div class="w-20 h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                        <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover"
                             onerror="this.onerror=null;this.src='assets/brand/placeholder.jpg'">
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between gap-2">
                            <h4 class="text-sm font-bold uppercase tracking-tight truncate">${escapeHtml(item.name)}</h4>
                            <button data-remove="${escapeHtml(item.id)}" class="text-slate-500 hover:text-red-500 transition-colors shrink-0" aria-label="Remove item">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                        <div class="flex justify-between items-center mt-2">
                            <div class="flex items-center gap-3 bg-white/5 rounded-full px-3 py-1 border border-white/5 text-xs">
                                <button data-qty="${escapeHtml(item.id)}" data-delta="-1" aria-label="Decrease quantity">-</button>
                                <span>${Number(item.quantity || 0)}</span>
                                <button data-qty="${escapeHtml(item.id)}" data-delta="1" aria-label="Increase quantity">+</button>
                            </div>
                            <span class="font-bold text-sm">${money(lineTotal)}</span>
                        </div>
                        ${item.size || item.color ? `<p class="text-[10px] uppercase tracking-widest text-slate-500 mt-1">${[item.size, item.color].filter(Boolean).map(escapeHtml).join(' · ')}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        if (subtotalEl) subtotalEl.textContent = money(window.Store.getCartTotal());
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove('opacity-40', 'cursor-not-allowed');
        }
    };

    const toggleCart = show => {
        if (show) {
            drawer.classList.remove('translate-x-full');
            backdrop.classList.remove('opacity-0', 'pointer-events-none');
            renderCart();
        } else {
            drawer.classList.add('translate-x-full');
            backdrop.classList.add('opacity-0', 'pointer-events-none');
        }
    };
    window.toggleCart = toggleCart;

    // Delegated controls (survive re-renders)
    itemsContainer.addEventListener('click', event => {
        const removeBtn = event.target.closest('[data-remove]');
        if (removeBtn) {
            window.Store.removeFromCart(removeBtn.dataset.remove);
            return;
        }

        const qtyBtn = event.target.closest('[data-qty]');
        if (qtyBtn) {
            const id = qtyBtn.dataset.qty;
            const delta = Number(qtyBtn.dataset.delta || 0);
            const item = window.Store.getCart().find(entry => entry.id === id);
            if (item) window.Store.updateQuantity(id, item.quantity + delta);
        }
    });

    document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
    backdrop.addEventListener('click', () => toggleCart(false));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') toggleCart(false);
    });

    // Open the cart from every nav cart button. Different pages use either the
    // shopping_cart or shopping_bag icon, so match both (and data attributes).
    const findCartButtons = () => {
        const buttons = new Set();
        document.querySelectorAll('[data-cart-toggle], #cart-count-badge, [data-cart-count]').forEach(el => {
            if (el.closest('#cart-drawer')) return;
            const btn = el.closest('button, a');
            if (btn) buttons.add(btn);
        });

        document.querySelectorAll('.material-symbols-outlined').forEach(icon => {
            if (icon.closest('#cart-drawer')) return;
            if (!['shopping_cart', 'shopping_bag'].includes(icon.textContent.trim())) return;
            const btn = icon.closest('button, a');
            if (btn) buttons.add(btn);
        });

        return Array.from(buttons);
    };

    findCartButtons().forEach(cartBtn => {
        if (cartBtn.dataset.cartDrawerBound === 'true') return;
        cartBtn.dataset.cartDrawerBound = 'true';
        cartBtn.setAttribute('aria-label', cartBtn.getAttribute('aria-label') || 'Open cart');
        cartBtn.addEventListener('click', event => {
            // The inline onclick already handles it on some pages.
            if (cartBtn.getAttribute('onclick')?.includes('toggleCart')) return;
            event.preventDefault();
            toggleCart(true);
        });
    });

    window.addEventListener('cartUpdated', renderCart);

    checkoutBtn.addEventListener('click', () => {
        if (window.Store.getCart().length === 0) {
            renderCart();
            return;
        }
        if (window.Store.getUser()) {
            window.location.href = 'checkout.html';
        } else {
            sessionStorage.setItem('kw_redirect_after_login', 'checkout.html');
            toggleCart(false);
            if (window.toggleProfile) window.toggleProfile(true, true);
        }
    });

    renderCart();
});
