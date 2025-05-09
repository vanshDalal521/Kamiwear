// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load product data
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId && products[productId]) {
        loadProductData(products[productId]);
        loadRelatedProducts(productId);
    } else {
        // Redirect to shop page if product not found
        window.location.href = 'shop.html';
    }
    
    // Initialize cart manager
    const cartManager = new CartManager();
    cartManager.updateCartUI();
    
    // Set up event listeners
    setupEventListeners(cartManager);
});

function setupEventListeners(cartManager) {
    // Search functionality
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.search-input');
    
    searchIcon?.addEventListener('click', toggleSearch);
    
    // View cart button
    document.querySelector('.view-cart-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.cart-sidebar').classList.add('active');
        document.querySelector('.cart-overlay').classList.add('active');
    });
    
    // Add to cart button
    document.querySelector('.add-to-cart-btn')?.addEventListener('click', function() {
        const productId = new URLSearchParams(window.location.search).get('id');
        const product = products[productId];
        
        if (!product) return;
        
        const color = document.querySelector('.color-option.active')?.getAttribute('title') || 'Default';
        const size = document.querySelector('.size-option.active')?.textContent || 'M';
        const quantity = parseInt(document.querySelector('.quantity-input').value) || 1;
        
        cartManager.addItem(product, color, size, quantity);
    });
    
    // Buy now button
    document.querySelector('.buy-now-btn')?.addEventListener('click', function() {
        const productId = new URLSearchParams(window.location.search).get('id');
        const product = products[productId];
        
        if (!product) return;
        
        const color = document.querySelector('.color-option.active')?.getAttribute('title') || 'Default';
        const size = document.querySelector('.size-option.active')?.textContent || 'M';
        const quantity = parseInt(document.querySelector('.quantity-input').value) || 1;
        
        cartManager.buyNow(product, color, size, quantity);
    });
}

function toggleSearch() {
    const searchInput = document.querySelector('.search-input');
    searchInput.classList.toggle('active');
    if (searchInput.classList.contains('active')) {
        searchInput.focus();
    }
}

function loadProductData(product) {
    // Update main product details
    document.getElementById('product-title').textContent = product.title;
    
    const priceElement = document.getElementById('product-price');
    priceElement.innerHTML = `<span class="price">$${product.price.toFixed(2)}</span>`;
    if (product.oldPrice) {
        priceElement.innerHTML += `<span class="old-price">$${product.oldPrice.toFixed(2)}</span>`;
    }
    
    document.getElementById('product-description').textContent = product.description;
    
    // Update main image to show front view by default
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = product.images.front;
        mainImage.alt = product.title + " - Front View";
    }
    
    // Update thumbnails
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        
        // Create thumbnails for each view
        Object.entries(product.images).forEach(([viewType, imageUrl]) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = imageUrl;
            thumbnail.alt = `${product.title} - ${viewType} View`;
            thumbnail.className = 'thumbnail';
            thumbnail.setAttribute('data-view', viewType);
            thumbnail.onclick = function() { changeImage(this); };
            
            // Set first thumbnail as active
            if (viewType === 'front') {
                thumbnail.classList.add('active');
            }
            
            thumbnailContainer.appendChild(thumbnail);
        });
    }
    
    // Update reviews
    const reviewsContainer = document.querySelector('.reviews-section');
    if (reviewsContainer) {
        reviewsContainer.innerHTML = '<h2 class="section-title">Customer <span>Reviews</span></h2>';
        
        if (product.reviews && product.reviews.length > 0) {
            product.reviews.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card';
                reviewCard.innerHTML = `
                    <div class="review-author">${review.author}</div>
                    <div class="review-rating">
                        ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
                        ${review.rating < 5 ? '<i class="far fa-star"></i>'.repeat(5 - review.rating) : ''}
                    </div>
                    <div class="review-text">${review.text}</div>
                `;
                reviewsContainer.appendChild(reviewCard);
            });
        } else {
            const noReviews = document.createElement('div');
            noReviews.className = 'review-card';
            noReviews.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
            reviewsContainer.appendChild(noReviews);
        }
    }
}

function loadRelatedProducts(currentProductId) {
    const currentProduct = products[currentProductId];
    if (!currentProduct) return;
    
    const relatedProductsContainer = document.querySelector('.related-products .products-grid');
    if (!relatedProductsContainer) return;
    
    relatedProductsContainer.innerHTML = '';
    
    // Get products from same category (excluding current product)
    const relatedProducts = Object.values(products).filter(
        product => product.category === currentProduct.category && product.id != currentProductId
    ).slice(0, 4); // Limit to 4 related products
    
    // Display related products
    relatedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-img">
                <a href="product.html?id=${product.id}">
                    <img src="${product.images.front}" alt="${product.title}">
                </a>
                <div class="product-actions">
                    <button class="quick-view" onclick="window.location.href='product.html?id=${product.id}'"><i class="fas fa-eye"></i></button>
                    <button class="add-wishlist" data-id="${product.id}"><i class="far fa-heart"></i></button>
                </div>
            </div>
            <div class="product-info">
                <h3><a href="product.html?id=${product.id}">${product.title}</a></h3>
                <div class="product-price">
                    <span class="price">$${product.price.toFixed(2)}</span>
                    ${product.oldPrice ? `<span class="old-price">$${product.oldPrice.toFixed(2)}</span>` : ''}
                </div>
                <div class="product-buttons">
                    <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
                    <button class="buy-now-btn" data-id="${product.id}">Buy Now</button>
                </div>
            </div>
        `;
        relatedProductsContainer.appendChild(productCard);
    });
}

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