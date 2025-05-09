// Product module for KamiWear
class ProductManager {
    constructor() {
        this.products = [];
        this.currentProduct = null;
        this.initializeProduct();
    }

    async initializeProduct() {
        await this.loadProducts();
        this.setupProductPage();
        this.attachEventListeners();
    }

    async loadProducts() {
        try {
            const response = await fetch('/js/products.js');
            const data = await response.json();
            this.products = data;
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    setupProductPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (productId) {
            this.currentProduct = this.products.find(p => p.id === productId);
            if (this.currentProduct) {
                this.renderProductDetails();
            }
        }
    }

    attachEventListeners() {
        // Color selection
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Size selection
        const sizeOptions = document.querySelectorAll('.size-option');
        sizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                sizeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });

        // Quantity buttons
        const quantityBtns = document.querySelectorAll('.quantity-btn');
        const quantityInput = document.querySelector('.quantity-input');

        if (quantityBtns.length && quantityInput) {
            quantityBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    let value = parseInt(quantityInput.value);

                    if (action === 'increase') {
                        value = Math.min(value + 1, 10);
                    } else if (action === 'decrease') {
                        value = Math.max(value - 1, 1);
                    }

                    quantityInput.value = value;
                });
            });

            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value);
                if (isNaN(value) || value < 1) {
                    value = 1;
                } else if (value > 10) {
                    value = 10;
                }
                quantityInput.value = value;
            });
        }

        // Add to cart button
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        // Wishlist button
        const wishlistBtn = document.querySelector('.wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => this.toggleWishlist());
        }

        // Image gallery
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainImage = document.querySelector('.main-image img');

        if (thumbnails.length && mainImage) {
            thumbnails.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    const newSrc = thumb.getAttribute('data-src');
                    if (newSrc) {
                        mainImage.src = newSrc;
                        thumbnails.forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    }
                });
            });
        }
    }

    renderProductDetails() {
        if (!this.currentProduct) return;

        const {
            name,
            price,
            description,
            images,
            colors,
            sizes,
            rating,
            reviews
        } = this.currentProduct;

        // Update product title
        const productTitle = document.querySelector('.product-title');
        if (productTitle) {
            productTitle.textContent = name;
        }

        // Update product price
        const productPrice = document.querySelector('.product-price');
        if (productPrice) {
            productPrice.innerHTML = `
                <span class="price">$${price.toFixed(2)}</span>
                ${this.currentProduct.oldPrice ? `<span class="old-price">$${this.currentProduct.oldPrice.toFixed(2)}</span>` : ''}
            `;
        }

        // Update product description
        const productDescription = document.querySelector('.product-description');
        if (productDescription) {
            productDescription.textContent = description;
        }

        // Update product gallery
        const mainImage = document.querySelector('.main-image img');
        const thumbnailContainer = document.querySelector('.thumbnail-container');

        if (mainImage && thumbnailContainer) {
            mainImage.src = images[0];
            thumbnailContainer.innerHTML = images.map((src, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" data-src="${src}">
                    <img src="${src}" alt="${name}">
                </div>
            `).join('');
        }

        // Update color options
        const colorOptions = document.querySelector('.color-options');
        if (colorOptions) {
            colorOptions.innerHTML = `
                <h3>Color</h3>
                <div class="color-options-list">
                    ${colors.map(color => `
                        <div class="color-option" style="background-color: ${color}"></div>
                    `).join('')}
                </div>
            `;
        }

        // Update size options
        const sizeOptions = document.querySelector('.size-options');
        if (sizeOptions) {
            sizeOptions.innerHTML = `
                <h3>Size</h3>
                <div class="size-options-list">
                    ${sizes.map(size => `
                        <div class="size-option">${size}</div>
                    `).join('')}
                </div>
            `;
        }

        // Update reviews
        const reviewsSection = document.querySelector('.reviews-section');
        if (reviewsSection) {
            reviewsSection.innerHTML = `
                <h3>Customer Reviews</h3>
                <div class="product-rating">
                    ${this.generateStarRating(rating)}
                    <span>${rating.toFixed(1)} (${reviews.length} reviews)</span>
                </div>
                <div class="reviews-list">
                    ${reviews.map(review => `
                        <div class="review-card">
                            <div class="review-author">
                                <img src="${review.avatar}" alt="${review.name}">
                                <div>
                                    <h4>${review.name}</h4>
                                    <div class="review-rating">
                                        ${this.generateStarRating(review.rating)}
                                    </div>
                                </div>
                            </div>
                            <p class="review-text">${review.text}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return `
            ${Array(fullStars).fill('<i class="fas fa-star"></i>').join('')}
            ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
        `;
    }

    addToCart() {
        if (!this.currentProduct) return;

        const selectedColor = document.querySelector('.color-option.active');
        const selectedSize = document.querySelector('.size-option.active');
        const quantity = parseInt(document.querySelector('.quantity-input').value);

        if (!selectedColor || !selectedSize) {
            this.showNotification('Please select color and size', 'error');
            return;
        }

        const product = {
            ...this.currentProduct,
            selectedColor: selectedColor.style.backgroundColor,
            selectedSize: selectedSize.textContent,
            quantity
        };

        cartManager.addToCart(product);
    }

    toggleWishlist() {
        if (!this.currentProduct) return;

        const wishlistBtn = document.querySelector('.wishlist-btn');
        const isInWishlist = wishlistBtn.classList.contains('active');

        if (isInWishlist) {
            wishlistManager.removeFromWishlist(this.currentProduct.id);
            wishlistBtn.classList.remove('active');
        } else {
            wishlistManager.addToWishlist(this.currentProduct);
            wishlistBtn.classList.add('active');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
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

// Initialize product manager
const productManager = new ProductManager(); 