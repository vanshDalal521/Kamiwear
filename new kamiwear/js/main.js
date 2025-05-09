// Main JavaScript file for KamiWear
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initializeNavigation();
    initializeCart();
    initializeWishlist();
    initializeSearch();
    initializeProductGallery();
    initializeChatbot();
});

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav ul li a');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav') && !e.target.closest('.hamburger')) {
            hamburger?.classList.remove('active');
            nav?.classList.remove('active');
        }
    });

    // Active link highlighting
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Cart functionality
function initializeCart() {
    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCart = document.querySelector('.close-cart');
    const cartOverlay = document.querySelector('.cart-overlay');

    if (cartIcon && cartSidebar) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            cartSidebar.classList.add('active');
            cartOverlay?.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartSidebar?.classList.remove('active');
            cartOverlay?.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => {
            cartSidebar?.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// Wishlist functionality
function initializeWishlist() {
    const wishlistButtons = document.querySelectorAll('.add-wishlist');
    
    wishlistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            button.classList.toggle('active');
            updateWishlistCount();
            showWishlistNotification(button.classList.contains('active'));
        });
    });
}

// Search functionality
function initializeSearch() {
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');

    if (searchIcon && searchInput) {
        searchIcon.addEventListener('click', () => {
            searchInput.classList.toggle('active');
            if (searchInput.classList.contains('active')) {
                searchInput.focus();
            }
        });

        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                performSearch(query);
            } else {
                searchResults?.classList.remove('active');
            }
        }, 300));
    }
}

// Product gallery functionality
function initializeProductGallery() {
    const mainImage = document.querySelector('.main-image img');
    const thumbnails = document.querySelectorAll('.thumbnail');

    if (mainImage && thumbnails.length) {
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

// Chatbot functionality
function initializeChatbot() {
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    const chatbotWindow = document.querySelector('.chatbot-window');
    const chatbotClose = document.querySelector('.chatbot-close');
    const chatbotInput = document.querySelector('.chatbot-input input');
    const chatbotSend = document.querySelector('.chatbot-input button');

    if (chatbotToggle && chatbotWindow) {
        chatbotToggle.addEventListener('click', () => {
            chatbotWindow.classList.toggle('active');
        });
    }

    if (chatbotClose) {
        chatbotClose.addEventListener('click', () => {
            chatbotWindow?.classList.remove('active');
        });
    }

    if (chatbotInput && chatbotSend) {
        chatbotSend.addEventListener('click', () => {
            const message = chatbotInput.value.trim();
            if (message) {
                sendChatbotMessage(message);
                chatbotInput.value = '';
            }
        });

        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = chatbotInput.value.trim();
                if (message) {
                    sendChatbotMessage(message);
                    chatbotInput.value = '';
                }
            }
        });
    }
}

// Utility functions
function debounce(func, wait) {
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

function updateWishlistCount() {
    const wishlistCount = document.querySelector('.wishlist-count');
    const activeWishlistItems = document.querySelectorAll('.add-wishlist.active').length;
    if (wishlistCount) {
        wishlistCount.textContent = activeWishlistItems;
    }
}

function showWishlistNotification(added) {
    const notification = document.createElement('div');
    notification.className = 'wishlist-notification';
    notification.innerHTML = `
        <i class="fas ${added ? 'fa-heart' : 'fa-heart-broken'}"></i>
        <p>${added ? 'Added to wishlist' : 'Removed from wishlist'}</p>
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

async function performSearch(query) {
    // Implement search functionality here
    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
        searchResults.classList.add('active');
        // Add your search logic here
    }
}

async function sendChatbotMessage(message) {
    const messagesContainer = document.querySelector('.chatbot-messages');
    if (messagesContainer) {
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.textContent = message;
        messagesContainer.appendChild(userMessage);

        // Add bot response
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot-message';
        botMessage.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        messagesContainer.appendChild(botMessage);

        // Simulate bot response
        setTimeout(() => {
            botMessage.innerHTML = 'Thank you for your message! Our team will get back to you soon.';
        }, 1500);
    }
} 