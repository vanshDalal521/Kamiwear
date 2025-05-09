// Product data structure
const products = [
    {
        id: 1,
        name: "Demon Slayer: Hinokami Kagura T-Shirt",
        category: "demon-slayer",
        price: 29.99,
        oldPrice: 39.99,
        image: "/assets/t-shirts/Hinokami Kagura main.png",
        description: "Premium Demon Slayer t-shirt featuring the iconic Hinokami Kagura design."
    },
    {
        id: 2,
        name: "Naruto: Nine-Tails Unleashed T-Shirt",
        category: "naruto",
        price: 27.99,
        image: "/assets/t-shirts/Nine-Tails Unleashed sec.jpeg",
        description: "Stylish Naruto t-shirt showcasing the powerful Nine-Tails transformation."
    },
    {
        id: 3,
        name: "Attack on Titan: Wings of Freedom T-Shirt",
        category: "attack-on-titan",
        price: 25.99,
        oldPrice: 34.99,
        image: "/assets/t-shirts/Wings of Freedom.png",
        description: "Striking Attack on Titan t-shirt featuring the iconic Wings of Freedom emblem."
    },
    {
        id: 4,
        name: "My Hero Academia T-Shirt",
        category: "my-hero-academia",
        price: 26.99,
        image: "/assets/t-shirts/My Hero Academia main.jpeg",
        description: "Dynamic My Hero Academia t-shirt showcasing the series' vibrant characters."
    }
];

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');

    // Toggle search input on icon click
    if (searchIcon && searchInput) {
        searchIcon.addEventListener('click', () => {
            searchInput.classList.toggle('active');
            if (searchInput.classList.contains('active')) {
                searchInput.focus();
            }
        });
    }

    // Live search
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('active');
                return;
            }

            // Use your products object (should be globally available)
            const results = Object.values(products).filter(product =>
                product.name.toLowerCase().includes(query) ||
                (product.description && product.description.toLowerCase().includes(query))
            );

            if (results.length > 0) {
                searchResults.innerHTML = results.map(product => `
                    <a href="product.html?id=${product.id}" class="search-result-item">
                        <img src="${product.image || (product.images && product.images.front) || '/assets/placeholder.jpg'}" alt="${product.name}">
                        <div class="search-result-info">
                            <h4>${product.name}</h4>
                            <div class="price">₹${product.price}</div>
                        </div>
                    </a>
                `).join('');
                searchResults.classList.add('active');
            } else {
                searchResults.innerHTML = '<div class="no-results">No products found</div>';
                searchResults.classList.add('active');
            }
        });

        // Hide results when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) {
                searchResults.classList.remove('active');
            }
        });
    }
});

function displaySearchResults(results) {
    const searchResults = document.querySelector('.search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No products found</div>';
        searchResults.style.display = 'block';
        return;
    }

    const html = results.map(product => `
        <div class="search-result-item" onclick="window.location.href='product.html?id=${product.id}'">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='/assets/placeholder.jpg'">
            <div class="search-result-info">
                <h4>${product.name}</h4>
                <p class="price">$${product.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');

    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
}

// Add CSS for search results
const style = document.createElement('style');
style.textContent = `
    .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
    }

    .search-result-item {
        display: flex;
        align-items: center;
        padding: 10px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .search-result-item:hover {
        background-color: #f5f5f5;
    }

    .search-result-item img {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 10px;
    }

    .search-result-info {
        flex: 1;
    }

    .search-result-info h4 {
        margin: 0;
        font-size: 0.9rem;
        color: #333;
    }

    .search-result-info .price {
        margin: 5px 0 0;
        color: var(--primary-color);
        font-weight: bold;
    }

    .no-results {
        padding: 20px;
        text-align: center;
        color: #666;
    }
`;
document.head.appendChild(style);