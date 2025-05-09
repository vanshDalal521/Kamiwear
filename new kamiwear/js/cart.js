class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.products = this.loadProducts();
        this.init();
    }

    init() {
        this.updateCartUI();
        this.setupEventListeners();
    }

    loadProducts() {
        // This would typically come from your products database
        return {
            1: {
                id: 1,
                name: "Demon Slayer: Hinokami Kagura T-Shirt",
                price: 29.99,
                images: {
                    front: "/assets/t-shirts/Hinokami Kagura main.png",
                    back: "/assets/t-shirts/Hinokami Kagura back.png"
                }
            },
            2: {
                id: 2,
                name: "Naruto: Nine-Tails Unleashed T-Shirt",
                price: 27.99,
                images: {
                    front: "/assets/t-shirts/Nine-Tails Unleashed main.png",
                    back: "/assets/t-shirts/Nine-Tails Unleashed sec.jpeg"
                }
            },
            3: {
                id: 3,
                name: "Attack on Titan: Wings of Freedom T-Shirt",
                price: 25.99,
                images: {
                    front: "/assets/t-shirts/Wings of Freedom.png",
                    back: "/assets/t-shirts/Wings of Freedom back.png"
                }
            },
            4: {
                id: 4,
                name: "My Hero Academia: Plus Ultra T-Shirt",
                price: 28.99,
                images: {
                    front: "/assets/t-shirts/My Hero Academia main.jpeg"
                }
            },
            5: {
                id: 5,
                name: "Jujutsu Kaisen: Sukuna Cursed Energy T-Shirt",
                price: 30.99,
                images: {
                    front: "/assets/t-shirts/ Sukuna Cursed Energy main .jpeg"
                }
            },
            6: {
                id: 6,
                name: "Demon Slayer: Water Breathing Hoodie",
                price: 59.99,
                images: {
                    front: "/assets/hoodies/Water Breathing Hoodie main.jpeg"
                }
            },
            7: {
                id: 7,
                name: "Naruto: Akatsuki Cloud Hoodie",
                price: 54.99,
                images: {
                    front: "/assets/hoodies/Akatsuki Cloud Hoodie main.jpeg"
                }
            },
            8: {
                id: 8,
                name: "Attack on Titan: Survey Corps Hoodie",
                price: 57.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            9: {
                id: 9,
                name: "My Hero Academia: UA High School Hoodie",
                price: 59.99,
                images: {
                    front: "/assets/hoodies/UA High School Hoodie main.jpeg"
                }
            },
            10: {
                id: 10,
                name: "Jujutsu Kaisen: Cursed Energy Hoodie",
                price: 62.99,
                images: {
                    front: "/assets/hoodies/Cursed Energy Hoodie main.jpeg"
                }
            },
            11: {
                id: 11,
                name: "One Piece: Straw Hat Pirates T-Shirt",
                price: 26.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            12: {
                id: 12,
                name: "Tokyo Revengers: Manji Gang T-Shirt",
                price: 28.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            13: {
                id: 13,
                name: "Chainsaw Man: Denji & Pochita T-Shirt",
                price: 31.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            14: {
                id: 14,
                name: "Bleach: Hollow Mask T-Shirt",
                price: 27.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            15: {
                id: 15,
                name: "One Piece: Wanted Poster Hoodie",
                price: 55.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            16: {
                id: 16,
                name: "Tokyo Revengers: Tokyo Manji Gang Hoodie",
                price: 58.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            17: {
                id: 17,
                name: "Chainsaw Man: Devil Hunter Hoodie",
                price: 61.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            },
            18: {
                id: 18,
                name: "Bleach: Soul Reaper Hoodie",
                price: 56.99,
                images: {
                    front: "/assets/placeholder.jpg"
                }
            }
        };
    }

    // Update the getImageUrl method to handle image loading better
    getImageUrl(item) {
        // First try to get the image from the item itself
        if (item.image) {
            return item.image;
        }
        
        // Then try to get it from the products database
        const product = this.products[item.id];
        if (product && product.images) {
            return product.images.front;
        }
        
        // If no image is found, return placeholder
        return '/assets/placeholder.jpg';
    }

    // Add a method to preload images
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    setupEventListeners() {
        // Setup quantity input listeners
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const index = e.target.dataset.index;
                this.updateQuantity(index, 0, e.target.value);
            }
        });

        // Setup image preview
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('cart-item-img')) {
                this.showImagePreview(e.target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('cart-item-img')) {
                this.hideImagePreview();
            }
        });
    }

    showImagePreview(imgElement) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        const img = imgElement.querySelector('img');
        const imageUrl = img.src;
        
        preview.innerHTML = `
            <img src="${imageUrl}" alt="Preview" onerror="this.src='/assets/placeholder.jpg'">
        `;
        document.body.appendChild(preview);

        const rect = imgElement.getBoundingClientRect();
        preview.style.top = `${rect.top + window.scrollY}px`;
        preview.style.left = `${rect.right + 10}px`;
        
        // Add show class after a small delay for animation
        setTimeout(() => {
            preview.classList.add('show');
        }, 10);
    }

    hideImagePreview() {
        const preview = document.querySelector('.image-preview');
        if (preview) {
            preview.remove();
        }
    }

    // Update the updateCartUI method to handle image loading better
    async updateCartUI() {
        const cartItemsContainer = document.getElementById('cart-items');
        const totalPriceElement = document.querySelector('.total-price');
        const cartCountElements = document.querySelectorAll('.cart-count');

        // Update cart count
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElements.forEach(el => el.textContent = totalItems);

        // Clear cart items container
        cartItemsContainer.innerHTML = '';

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any items to your cart yet.</p>
                    <a href="index.html#shop" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            totalPriceElement.textContent = '₹0.00';
            return;
        }

        // Calculate total price
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalPriceElement.textContent = `₹${total.toFixed(2)}`;

        // Render cart items
        for (const [index, item] of this.cart.entries()) {
            const itemTotal = item.price * item.quantity;
            const imageUrl = this.getImageUrl(item);
            const product = this.products[item.id];
            const productName = product ? product.name : item.name;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-img" data-index="${index}">
                    <img src="/assets/placeholder.jpg" 
                         alt="${productName}" 
                         loading="lazy" 
                         data-src="${imageUrl}"
                         onerror="this.src='/assets/placeholder.jpg'">
                    <div class="image-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                    <div class="image-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${productName}</h3>
                    <div class="cart-item-price">${item.price.toFixed(2)}</div>
                    <div class="cart-item-options">
                        ${item.color ? `<span class="cart-item-option">Color: ${item.color}</span>` : ''}
                        ${item.size ? `<span class="cart-item-option">Size: ${item.size}</span>` : ''}
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity(${index}, -1)">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity(${index}, 1)">+</button>
                    </div>
                    <div class="cart-item-total">
                        Item Total: ${itemTotal.toFixed(2)}
                    </div>
                </div>
                <button class="remove-item" onclick="cartManager.removeItem(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            cartItemsContainer.appendChild(cartItem);

            // Load the image
            const img = cartItem.querySelector('img');
            try {
                await this.preloadImage(imageUrl);
                img.src = imageUrl;
                img.classList.add('loaded');
                cartItem.querySelector('.image-loading').style.display = 'none';
            } catch (error) {
                console.error('Failed to load image:', error);
                img.src = '/assets/placeholder.jpg';
                img.classList.add('loaded');
                cartItem.querySelector('.image-loading').style.display = 'none';
            }
        }
    }

    updateQuantity(index, change, newValue) {
        if (newValue !== undefined) {
            this.cart[index].quantity = parseInt(newValue) || 1;
        } else {
            this.cart[index].quantity += change;
            if (this.cart[index].quantity < 1) {
                this.cart[index].quantity = 1;
            }
        }
        this.saveCart();
        this.updateCartUI();
    }

    removeItem(index) {
        if (confirm('Are you sure you want to remove this item from your cart?')) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.updateCartUI();
        }
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    addItem(item) {
        const product = this.products[item.id];
        const existingItem = this.cart.find(cartItem => 
            cartItem.id === item.id && 
            cartItem.color === item.color && 
            cartItem.size === item.size
        );
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.cart.push({
                id: item.id,
                name: product ? product.name : item.name,
                price: item.price,
                image: item.image || (product?.images?.front),
                quantity: item.quantity,
                color: item.color,
                size: item.size
            });
        }
        
        this.saveCart();
        this.showNotification();
        this.updateCartUI();
    }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
}); 