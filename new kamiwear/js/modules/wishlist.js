// Wishlist module for KamiWear
class WishlistManager {
    constructor() {
        this.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        this.wishlistItems = document.querySelector('.wishlist-container');
        this.wishlistCount = document.querySelector('.wishlist-count');
        this.initializeWishlist();
    }

    initializeWishlist() {
        this.updateWishlistCount();
        this.renderWishlistItems();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add to wishlist buttons
        const wishlistButtons = document.querySelectorAll('.add-wishlist');
        wishlistButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const product = this.getProductData(productCard);
                    this.toggleWishlist(product);
                }
            });
        });

        // Wishlist item actions
        if (this.wishlistItems) {
            this.wishlistItems.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-wishlist-item')) {
                    const wishlistItem = e.target.closest('.wishlist-item');
                    const productId = wishlistItem.dataset.productId;
                    this.removeFromWishlist(productId);
                }

                if (e.target.classList.contains('move-to-cart')) {
                    const wishlistItem = e.target.closest('.wishlist-item');
                    const productId = wishlistItem.dataset.productId;
                    this.moveToCart(productId);
                }
            });
        }

        // Clear wishlist button
        const clearWishlistBtn = document.querySelector('.clear-wishlist-btn');
        if (clearWishlistBtn) {
            clearWishlistBtn.addEventListener('click', () => this.clearWishlist());
        }
    }

    getProductData(productCard) {
        return {
            id: productCard.dataset.productId,
            name: productCard.querySelector('.product-info h3').textContent,
            price: parseFloat(productCard.querySelector('.price').textContent.replace('$', '')),
            image: productCard.querySelector('.product-img img').src
        };
    }

    toggleWishlist(product) {
        const existingItem = this.wishlist.find(item => item.id === product.id);
        
        if (existingItem) {
            this.removeFromWishlist(product.id);
        } else {
            this.addToWishlist(product);
        }
    }

    addToWishlist(product) {
        this.wishlist.push(product);
        this.saveWishlist();
        this.updateWishlistCount();
        this.renderWishlistItems();
        this.showWishlistNotification('Added to wishlist');
    }

    removeFromWishlist(productId) {
        this.wishlist = this.wishlist.filter(item => item.id !== productId);
        this.saveWishlist();
        this.updateWishlistCount();
        this.renderWishlistItems();
        this.showWishlistNotification('Removed from wishlist');
    }

    moveToCart(productId) {
        const product = this.wishlist.find(item => item.id === productId);
        if (product) {
            cartManager.addToCart(product);
            this.removeFromWishlist(productId);
        }
    }

    clearWishlist() {
        this.wishlist = [];
        this.saveWishlist();
        this.updateWishlistCount();
        this.renderWishlistItems();
        this.showWishlistNotification('Wishlist cleared');
    }

    saveWishlist() {
        localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    }

    updateWishlistCount() {
        if (this.wishlistCount) {
            this.wishlistCount.textContent = this.wishlist.length;
        }
    }

    renderWishlistItems() {
        if (this.wishlistItems) {
            if (this.wishlist.length === 0) {
                this.wishlistItems.innerHTML = `
                    <div class="empty-wishlist">
                        <i class="fas fa-heart"></i>
                        <h3>Your wishlist is empty</h3>
                        <p>Add some products to your wishlist to see them here</p>
                    </div>
                `;
            } else {
                this.wishlistItems.innerHTML = this.wishlist.map(item => `
                    <div class="wishlist-item" data-product-id="${item.id}">
                        <div class="wishlist-item-img">
                            <img src="${item.image}" alt="${item.name}" loading="lazy">
                        </div>
                        <div class="wishlist-item-info">
                            <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
                            <div class="wishlist-item-price">$${item.price.toFixed(2)}</div>
                        </div>
                        <div class="wishlist-item-actions">
                            <button class="move-to-cart">
                                <i class="fas fa-shopping-cart"></i> Move to Cart
                            </button>
                            <button class="remove-wishlist-item">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    showWishlistNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'wishlist-notification';
        notification.innerHTML = `
            <i class="fas fa-heart"></i>
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

// Initialize wishlist manager
const wishlistManager = new WishlistManager(); 