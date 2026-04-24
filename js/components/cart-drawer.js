document.addEventListener('DOMContentLoaded', () => {
    // 1. Create the Cart Drawer HTML structure dynamically if it doesn't exist
    if (!document.getElementById('cart-drawer')) {
        const drawer = document.createElement('div');
        drawer.id = 'cart-drawer';
        drawer.className = 'fixed top-0 right-0 w-full md:w-[450px] h-full z-[100] translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] glass-panel border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col';
        drawer.innerHTML = `
            <div class="p-8 border-b border-white/10 flex items-center justify-between">
                <h3 class="font-syne text-2xl uppercase italic font-bold">Your Archive</h3>
                <button id="close-cart" class="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div id="cart-items" class="flex-grow overflow-y-auto p-8 space-y-6">
                <!-- Items injected here -->
            </div>
            <div class="p-8 border-t border-white/10 space-y-4 bg-black/20">
                <div class="flex justify-between items-end">
                    <span class="text-sm text-slate-400 uppercase tracking-widest">Subtotal</span>
                    <span id="cart-subtotal" class="font-syne text-2xl font-bold">$0.00</span>
                </div>
                <button id="checkout-btn" class="w-full bg-primary text-black font-bold py-4 rounded-full hover:bg-primary/80 transition-all flex items-center justify-center gap-2">
                    PROCESS CHECKOUT
                    <span class="material-symbols-outlined">trending_flat</span>
                </button>
                <p class="text-[10px] text-center text-slate-500 uppercase tracking-[0.2em]">Shipping & taxes calculated at checkout</p>
            </div>
        `;
        document.body.appendChild(drawer);

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'cart-backdrop';
        backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] opacity-0 pointer-events-none transition-opacity duration-500';
        document.body.appendChild(backdrop);
    }

    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    const itemsContainer = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');

    const toggleCart = (show) => {
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

    const renderCart = () => {
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
            subtotalEl.textContent = '$0.00';
            return;
        }

        let subtotal = 0;
        itemsContainer.innerHTML = cart.map(item => {
            subtotal += item.price * item.quantity;
            return `
                <div class="flex gap-4 group">
                    <div class="w-20 h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                        <img src="${item.image}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between">
                            <h4 class="text-sm font-bold uppercase tracking-tight">${item.name}</h4>
                            <button onclick="window.Store.removeFromCart('${item.id}')" class="text-slate-500 hover:text-red-500 transition-colors">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                        <div class="flex justify-between items-center mt-2">
                            <div class="flex items-center gap-3 bg-white/5 rounded-full px-3 py-1 border border-white/5 text-xs">
                                <button onclick="updateQty('${item.id}', -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQty('${item.id}', 1)">+</button>
                            </div>
                            <span class="font-bold text-sm">$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    };

    // Global qty update for the inline onclicks
    window.updateQty = (id, delta) => {
        const cart = window.Store.getCart();
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                window.Store.removeFromCart(id);
            } else {
                window.Store.saveCart(cart);
            }
        }
    };

    // Listeners
    document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
    backdrop.addEventListener('click', () => toggleCart(false));

    // Open cart when clicking nav cart icon
    const findCartBtn = () => {
        return Array.from(document.querySelectorAll('button')).find(btn =>
            btn.querySelector('.material-symbols-outlined')?.textContent.trim() === 'shopping_cart'
        );
    };

    const cartBtn = findCartBtn();
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCart(true);
        });
    }

    // Handle cart store updates
    window.addEventListener('cartUpdated', renderCart);

    // Checkout redirect with protection
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (window.Store.getUser()) {
            window.location.href = 'checkout.html';
        } else {
            toggleCart(false);
            if (window.toggleProfile) {
                window.toggleProfile(true, true); // true for showAuthMsg
            }
        }
    });
});
