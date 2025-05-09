// Cart module for KamiWear
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.cartItems = document.querySelector('.cart-items');
        this.cartCount = document.querySelector('.cart-count');
        this.cartTotal = document.querySelector('.total-price');
        this.initializeCart();
    }

    initializeCart() {
        this.updateCartCount();
        this.updateCartTotal();
        this.renderCartItems();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add to cart buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const product = this.getProductData(productCard);
                    this.addToCart(product);
                }
            });
        });

        // Cart item quantity buttons
        if (this.cartItems) {
            this.cartItems.addEventListener('click', (e) => {
                if (e.target.classList.contains('quantity-btn')) {
                    const cartItem = e.target.closest('.cart-item');
                    const productId = cartItem.dataset.productId;
                    const action = e.target.dataset.action;
                    this.updateQuantity(productId, action);
                }
            });

            // Remove item buttons
            this.cartItems.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-item')) {
                    const cartItem = e.target.closest('.cart-item');
                    const productId = cartItem.dataset.productId;
                    this.removeFromCart(productId);
                }
            });
        }

        // Clear cart button
        const clearCartBtn = document.querySelector('.clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
    }

    getProductData(productCard) {
        return {
            id: productCard.dataset.productId,
            name: productCard.querySelector('.product-info h3').textContent,
            price: parseFloat(productCard.querySelector('.price').textContent.replace('$', '')),
            image: productCard.querySelector('.product-img img').src,
            quantity: 1
        };
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push(product);
        }

        this.saveCart();
        this.updateCartCount();
        this.updateCartTotal();
        this.renderCartItems();
        this.showCartNotification('Added to cart');
    }

    updateQuantity(productId, action) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (action === 'increase') {
                item.quantity += 1;
            } else if (action === 'decrease' && item.quantity > 1) {
                item.quantity -= 1;
            }
            this.saveCart();
            this.updateCartCount();
            this.updateCartTotal();
            this.renderCartItems();
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
        this.updateCartTotal();
        this.renderCartItems();
        this.showCartNotification('Removed from cart');
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        this.updateCartTotal();
        this.renderCartItems();
        this.showCartNotification('Cart cleared');
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartCount() {
        if (this.cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            this.cartCount.textContent = totalItems;
        }
    }

    updateCartTotal() {
        if (this.cartTotal) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            this.cartTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    renderCartItems() {
        if (this.cartItems) {
            if (this.cart.length === 0) {
                this.cartItems.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Your cart is empty</h3>
                        <p>Add some products to your cart to see them here</p>
                    </div>
                `;
            } else {
                this.cartItems.innerHTML = this.cart.map(item => `
                    <div class="cart-item" data-product-id="${item.id}">
                        <div class="cart-item-img">
                            <img src="${item.image}" alt="${item.name}" loading="lazy">
                        </div>
                        <div class="cart-item-details">
                            <h3 class="cart-item-title">${item.name}</h3>
                            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                            <div class="cart-item-quantity">
                                <button class="quantity-btn" data-action="decrease">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn" data-action="increase">+</button>
                            </div>
                        </div>
                        <button class="remove-item">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
            }
        }
    }

    showCartNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-shopping-cart"></i>
            <p>${message}</p>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 2000);
        }, 100);
    }
}

// Initialize cart manager
const cartManager = new CartManager(); 