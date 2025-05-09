// Cart Management System
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        this.initCartEvents();
        this.updateCartUI();
        this.updateCartCount();
        this.updateWishlistCount();
    }

    initCartEvents() {
        // Cart sidebar toggle
        const cartIcon = document.querySelector('.cart-icon');
        const cartSidebar = document.querySelector('.cart-sidebar');
        const cartOverlay = document.querySelector('.cart-overlay');
        const closeCart = document.querySelector('.close-cart');

        if (cartIcon && cartSidebar && cartOverlay && closeCart) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
            });

            closeCart.addEventListener('click', () => {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
            });

            cartOverlay.addEventListener('click', () => {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
            });
        }
    }

    addItem(item) {
        const existingItem = this.cart.find(cartItem => 
            cartItem.id === item.id && 
            cartItem.color === item.color && 
            cartItem.size === item.size
        );

        if (existingItem) {
            existingItem.quantity += item.quantity || 1;
        } else {
            this.cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity || 1,
                color: item.color,
                size: item.size
            });
        }

        this.saveCart();
        this.showNotification();
        this.updateCartUI();
        this.updateCartCount();
    }

    removeItem(itemId) {
        // Convert itemId to number for comparison
        const numericId = Number(itemId);
        this.cart = this.cart.filter(item => Number(item.id) !== numericId);
        this.saveCart();
        this.updateCartUI();
        this.updateCartCount();
    }

    updateQuantity(itemId, quantity) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
        this.saveCart();
        this.updateCartUI();
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        const cartItems = document.querySelector('.cart-items');
        const totalPrice = document.querySelector('.total-price');
        
        if (cartItems) {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-img">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" value="${item.quantity}" min="1" max="10">
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-id="${item.id}">&times;</button>
                </div>
            `).join('');

            // Add event listeners for quantity buttons
            cartItems.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const input = e.target.parentElement.querySelector('input');
                    const currentValue = parseInt(input.value);
                    if (e.target.classList.contains('plus')) {
                        input.value = Math.min(currentValue + 1, 10);
                    } else {
                        input.value = Math.max(currentValue - 1, 1);
                    }
                    this.updateQuantity(btn.closest('.cart-item').dataset.id, parseInt(input.value));
                });
            });

            // Add event listeners for remove buttons
            cartItems.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemId = btn.dataset.id;
                    this.removeItem(itemId);
                });
            });
        }

        if (totalPrice) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            totalPrice.textContent = `$${total.toFixed(2)}`;
        }
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = totalItems;
        });
    }

    addToWishlist(product) {
        const existingItem = this.wishlist.find(item => item.id === product.id);
        
        if (!existingItem) {
            // Ensure we have the complete product data
            const productData = {
                id: product.id,
                name: product.name || product.title,
                price: product.price,
                image: product.image || product.images?.front,
                category: product.category,
                collection: product.collection,
                description: product.description
            };
            
            this.wishlist.push(productData);
            this.saveWishlist();
            this.showWishlistNotification();
            this.updateWishlistCount();
            return true;
        }
        return false;
    }

    removeFromWishlist(productId) {
        this.wishlist = this.wishlist.filter(item => item.id !== productId);
        this.saveWishlist();
        this.updateWishlistCount();
    }

    saveWishlist() {
        localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    }

    updateWishlistCount() {
        const totalItems = this.wishlist.length;
        document.querySelectorAll('.wishlist-count').forEach(el => {
            el.textContent = totalItems;
        });
    }

    showWishlistNotification() {
        const notification = document.createElement('div');
        notification.className = 'wishlist-notification';
        notification.innerHTML = `
            <span>Item added to wishlist!</span>
        `;
        document.body.appendChild(notification);
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    showNotification() {
        const notification = document.querySelector('.cart-notification');
        if (notification) {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    buyNow(product) {
        this.addItem(product);
        window.location.href = 'checkout.html';
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// UI Components
class UIComponents {
    static initMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const nav = document.querySelector('nav');

        if (hamburger && nav) {
            hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
                nav.classList.toggle('active');
            });
        }
    }

    static initSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchResults = document.querySelector('.search-results');
        
        if (searchInput && searchResults) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                if (query.length < 2) {
                    searchResults.innerHTML = '';
                    searchResults.classList.remove('active');
                    return;
                }

                const results = Object.values(products).filter(product => 
                    product.name.toLowerCase().includes(query) ||
                    product.description.toLowerCase().includes(query)
                ).slice(0, 5);

                if (results.length > 0) {
                    searchResults.innerHTML = results.map(product => `
                        <a href="product.html?id=${product.id}" class="search-result-item">
                            <img src="${product.images.front}" alt="${product.name}">
                            <div class="search-result-info">
                                <h4>${product.name}</h4>
                                <p>$${product.price.toFixed(2)}</p>
                            </div>
                        </a>
                    `).join('');
                    searchResults.classList.add('active');
                } else {
                    searchResults.innerHTML = '<div class="no-results">No products found</div>';
                    searchResults.classList.add('active');
                }
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    searchResults.classList.remove('active');
            }
        });
    }
    }

    static initWishlistButtons(cartManager) {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-wishlist')) {
                const productId = e.target.closest('.add-wishlist').dataset.id || 
                                 e.target.closest('.product-card')?.querySelector('.add-to-cart')?.dataset.id;
                
                // Find the product in the products object
                const product = Object.values(products).find(p => p.id === productId);
                
                if (product) {
                    const added = cartManager.addToWishlist(product);
                    if (added) {
                        const heartIcon = e.target.closest('.add-wishlist').querySelector('i');
                        if (heartIcon) {
                            heartIcon.className = 'fas fa-heart';
                            heartIcon.style.color = 'var(--primary-color)';
                        }
                    }
                }
            }
        });
    }
}

// Initialize UI components
document.addEventListener('DOMContentLoaded', () => {
    UIComponents.initMobileMenu();
    UIComponents.initSearch();
    UIComponents.initWishlistButtons(cartManager);
});

// Global functions for product page
window.changeImage = function(element) {
    const mainImage = document.getElementById('main-image');
    const viewType = element.getAttribute('data-view');
    const productId = new URLSearchParams(window.location.search).get('id');
    const product = products[productId];
    
    if (product && product.images[viewType]) {
        mainImage.src = product.images[viewType];
        mainImage.alt = product.title + " - " + viewType.charAt(0).toUpperCase() + viewType.slice(1) + " View";
    } else {
        mainImage.src = element.src;
        mainImage.alt = element.alt;
    }
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    element.classList.add('active');
};

window.selectOption = function(element, type) {
    const options = document.querySelectorAll(`.${type}-option`);
    options.forEach(option => {
        option.classList.remove('active');
    });
    element.classList.add('active');
};

window.changeQuantity = function(change) {
    const input = document.querySelector('.quantity-input');
    let value = parseInt(input.value) + change;
    if (value < 1) value = 1;
    input.value = value;
};

window.addToCart = function() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (!addToCartBtn) return;
    
    // Show loading state
    addToCartBtn.classList.add('loading');
    addToCartBtn.disabled = true;
    addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    // Get product details
    const productId = new URLSearchParams(window.location.search).get('id');
    const product = products[productId];
    
    if (!product) return;
    
    const color = document.querySelector('.color-option.active')?.getAttribute('title') || 'Default';
    const size = document.querySelector('.size-option.active')?.textContent || 'M';
    const quantity = parseInt(document.querySelector('.quantity-input').value) || 1;
    
    // Get cart manager instance
    const cartManager = new CartManager();
    
    // Simulate API call delay
    setTimeout(() => {
        cartManager.addItem({
            id: product.id,
            name: product.title,
            price: product.price,
            image: product.images.front,
            quantity: quantity,
            color: color,
            size: size
        });
        
        // Show success state
        addToCartBtn.classList.remove('loading');
        addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            addToCartBtn.disabled = false;
        }, 2000);
    }, 500);
};

window.buyNow = function() {
    const buyNowBtn = document.querySelector('.buy-now-btn');
    if (!buyNowBtn) return;
    
    // Show loading state
    buyNowBtn.classList.add('loading');
    buyNowBtn.disabled = true;
    buyNowBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Get product details
    const productId = new URLSearchParams(window.location.search).get('id');
    const product = products[productId];
    
    if (!product) return;
    
    const color = document.querySelector('.color-option.active')?.getAttribute('title') || 'Default';
    const size = document.querySelector('.size-option.active')?.textContent || 'M';
    const quantity = parseInt(document.querySelector('.quantity-input').value) || 1;
    
    // Get cart manager instance
    const cartManager = new CartManager();
    
    // Simulate API call delay
    setTimeout(() => {
        cartManager.buyNow({
            id: product.id,
            name: product.title,
            price: product.price,
            image: product.images.front,
            quantity: quantity,
            color: color,
            size: size
        });
    }, 500);
};

window.addToWishlist = function() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (!wishlistBtn) return;
    
    // Show loading state
    wishlistBtn.classList.add('loading');
    wishlistBtn.disabled = true;
    wishlistBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Get product details
    const productId = new URLSearchParams(window.location.search).get('id');
    const product = products[productId];
    
    if (!product) return;
    
    // Get cart manager instance
    const cartManager = new CartManager();
    
    // Simulate API call delay
    setTimeout(() => {
        const added = cartManager.addToWishlist(product);
        
        if (added) {
            // Show success state
            wishlistBtn.classList.remove('loading');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> In Wishlist';
            wishlistBtn.classList.add('active');
            
            // Change heart color
            const heartIcon = wishlistBtn.querySelector('i');
            if (heartIcon) {
                heartIcon.style.color = 'var(--primary-color)';
            }
        } else {
            // Show already in wishlist
            wishlistBtn.classList.remove('loading');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> In Wishlist';
            wishlistBtn.disabled = false;
            wishlistBtn.classList.add('active');
        }
    }, 500);
};