// Search module for KamiWear
class SearchManager {
    constructor() {
        this.searchIcon = document.querySelector('.search-icon');
        this.searchInput = document.querySelector('.search-input');
        this.searchResults = document.querySelector('.search-results');
        this.initializeSearch();
    }

    initializeSearch() {
        this.attachEventListeners();
    }

    attachEventListeners() {
        if (this.searchIcon && this.searchInput) {
            this.searchIcon.addEventListener('click', () => {
                this.searchInput.classList.toggle('active');
                if (this.searchInput.classList.contains('active')) {
                    this.searchInput.focus();
                }
            });

            this.searchInput.addEventListener('input', this.debounce((e) => {
                const query = e.target.value.trim();
                if (query.length > 2) {
                    this.performSearch(query);
                } else {
                    this.searchResults?.classList.remove('active');
                }
            }, 300));

            // Close search when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    this.searchInput?.classList.remove('active');
                    this.searchResults?.classList.remove('active');
                }
            });
        }
    }

    async performSearch(query) {
        try {
            const response = await fetch('/js/products.js');
            const products = await response.json();
            
            const results = products.filter(product => {
                const searchableText = `
                    ${product.name}
                    ${product.description}
                    ${product.category}
                    ${product.collection}
                    ${product.tags.join(' ')}
                `.toLowerCase();
                
                return searchableText.includes(query.toLowerCase());
            });

            this.displayResults(results);
        } catch (error) {
            console.error('Error performing search:', error);
        }
    }

    displayResults(results) {
        if (this.searchResults) {
            if (results.length === 0) {
                this.searchResults.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <p>No products found</p>
                    </div>
                `;
            } else {
                this.searchResults.innerHTML = results.map(product => `
                    <a href="product.html?id=${product.id}" class="search-result-item">
                        <div class="result-image">
                            <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                        </div>
                        <div class="result-info">
                            <h4>${product.name}</h4>
                            <div class="result-price">$${product.price.toFixed(2)}</div>
                        </div>
                    </a>
                `).join('');
            }
            
            this.searchResults.classList.add('active');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize search manager
const searchManager = new SearchManager(); 