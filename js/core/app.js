document.addEventListener('DOMContentLoaded', () => {
    // 1. Update Cart Count in Nav
    const updateCartCount = () => {
        const count = window.Store.getCart().reduce((sum, item) => sum + item.quantity, 0);
        const countBadge = document.querySelector('.material-symbols-outlined[textContent="shopping_cart"]')?.parentElement.querySelector('span');
        if (countBadge) {
            countBadge.textContent = count;
        } else {
            const badges = document.querySelectorAll('nav .bg-primary.text-black.rounded-full');
            badges.forEach(b => b.textContent = count);
        }
    };

    window.addEventListener('cartUpdated', updateCartCount);
    updateCartCount();

    // 2. Add to Cart Logic
    const attachCartListeners = () => {
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(btn => {
            if (btn.dataset.cartListener) return;

            const text = btn.textContent.replace(/\s+/g, ' ').trim().toUpperCase();
            if (text.includes('ADD TO CART')) {
                btn.dataset.cartListener = 'true';
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('.group') || btn.closest('.liquid-glass') || btn.closest('.glass-panel') || btn.closest('.product-card');

                    let name, price, img;

                    if (card) {
                        // Priority name extraction to avoid category labels
                        const nameEl = card.querySelector('h3, h4, h5, .product-name');
                        const fallbackNameEl = card.querySelector('.font-bold:not(.text-crimson):not(.text-accent-purple):not(.text-cyber-blue)');
                        name = (nameEl || fallbackNameEl)?.textContent.trim() || 'ITEM';

                        // Improved price extraction
                        // 1. Try data-price attribute
                        let priceValue = card.dataset.price;
                        
                        // 2. Try to find a price element specifically
                        if (!priceValue) {
                            const priceEls = card.querySelectorAll('p.font-bold, span.font-bold, .text-primary.font-bold, .text-cyber-blue.font-bold, .text-flame.font-bold, p, span');
                            for (const el of priceEls) {
                                const elText = el.textContent.trim();
                                if (elText.includes('$') || elText.includes('₹')) {
                                    priceValue = elText;
                                    break;
                                }
                            }
                        }

                        const priceText = priceValue || '$0';
                        price = parseFloat(priceText.replace('$', '').replace('₹', '').replace(/,/g, '')) || 0;

                        const imgEl = card.querySelector('img');
                        img = imgEl?.src;
                        if (!img) {
                            const bgEl = card.querySelector('[style*="background-image"]');
                            if (bgEl) {
                                img = bgEl.style.backgroundImage.replace(/url\(['"]?|['"]?\)/g, '');
                            }
                        }
                    } else if (window.location.pathname.includes('product.html') || document.querySelector('h1')) {
                        name = document.querySelector('h1')?.textContent.replace(/\n/g, ' ').trim() || 'Product';
                        const priceText = document.querySelector('.text-4xl.text-primary, .text-5xl.text-primary, .text-3xl.text-primary')?.textContent.trim() || '$0';
                        price = parseFloat(priceText.replace('$', '').replace('₹', '').replace(/,/g, '')) || 0;
                        img = document.querySelector('.aspect-\[4\/5\] img')?.src || '';
                    } else {
                        return;
                    }

                    // Add a truly unique ID if possible or at least more unique than name
                    const product = {
                        id: (name + '-' + price).toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        name,
                        price,
                        image: img
                    };

                    console.log('Adding to cart:', product);
                    window.Store.addToCart(product);
                    if (window.toggleCart) window.toggleCart(true);

                    const originalContent = btn.innerHTML;
                    btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> ADDED';
                    btn.classList.add('bg-green-500');

                    setTimeout(() => {
                        btn.innerHTML = originalContent;
                        btn.classList.remove('bg-green-500');
                    }, 1500);
                });
            }
        });
    };

    // 3. Product Card Navigation
    const initProductNavigation = () => {
        const cards = document.querySelectorAll('.group, .liquid-glass, .glass-panel, .product-card');
        cards.forEach(card => {
            if (card.dataset.navListener) return;

            // EXCLUDE nav and footer elements from being treated as product cards
            if (card.closest('nav') || card.closest('footer') || card.tagName === 'NAV' || card.tagName === 'FOOTER') {
                return;
            }

            const hasButton = card.querySelector('button');
            const hasPrice = Array.from(card.querySelectorAll('p.font-bold, span.font-bold, .text-primary.font-bold, [class*="price"], p, span'))
                              .some(el => el.textContent.includes('$') || el.textContent.includes('₹'));

            if (hasButton && hasPrice) {
                card.dataset.navListener = 'true';
                card.style.cursor = 'pointer';
                card.addEventListener('click', (e) => {
                    // Don't navigate if clicking the button itself
                    if (e.target.closest('button')) return;

                    const nameEl = card.querySelector('h3, h4, h5, .font-bold');
                    const name = nameEl?.textContent.trim() || 'Product';

                    // Improved price extraction
                    let priceValue = card.dataset.price;
                    if (!priceValue) {
                        const priceEl = Array.from(card.querySelectorAll('p.font-bold, span.font-bold, .text-primary.font-bold, p, span'))
                                        .find(el => el.textContent.includes('$') || el.textContent.includes('₹'));
                        priceValue = priceEl?.textContent.trim() || '$0';
                    }
                    
                    const price = parseFloat(priceValue.replace('$', '').replace('₹', '').replace(/,/g, '')) || 0;

                    const imgEl = card.querySelector('img');
                    let img = imgEl?.src;
                    if (!img) {
                        const bgEl = card.querySelector('[style*="background-image"]');
                        if (bgEl) {
                            img = bgEl.style.backgroundImage.replace(/url\(['"]?|['"]?\)/g, '');
                        }
                    }

                    const params = new URLSearchParams({
                        name: name,
                        price: price,
                        image: img || ''
                    });
                    window.location.href = `product.html?${params.toString()}`;
                });
            }
        });
    };

    // 4. Initialization
    attachCartListeners();
    initProductNavigation();

    // Re-run on dynamic content updates
    const observer = new MutationObserver(() => {
        attachCartListeners();
        initProductNavigation();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 5. Profile UI
    const updateProfileUI = () => {
        const user = window.Store.getUser();
        
        // Find all 'person' icons in navigation areas
        const userIcons = Array.from(document.querySelectorAll('nav .material-symbols-outlined, #profile-btn-trigger .material-symbols-outlined'))
            .filter(el => el.textContent.trim() === 'person' || el.textContent.trim() === 'account_circle');
            
        if (user && userIcons.length > 0) {
            userIcons.forEach(userIcon => {
                const parent = userIcon.parentElement;
                
                // Only replace if we haven't already replaced it to an image
                if (parent && !parent.querySelector('img.user-nav-avatar')) {
                    // Hide the icon
                    userIcon.style.display = 'none';
                    
                    // Create an Avatar Image
                    const img = document.createElement('img');
                    img.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`;
                    img.alt = 'User Avatar';
                    img.className = 'w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-primary/50 user-nav-avatar object-cover shadow-[0_0_10px_rgba(242,223,13,0.3)] hover:scale-110 transition-transform';
                    
                    parent.appendChild(img);
                }
            });
        } else if (!user) {
            // Restore icon if logged out
            const avatars = document.querySelectorAll('.user-nav-avatar');
            avatars.forEach(av => av.remove());
            userIcons.forEach(icon => {
                icon.style.display = '';
                icon.textContent = 'person';
                icon.classList.remove('text-primary');
            });
        }
    };
    updateProfileUI();

    // 6. Verify Session on Load
    if (window.Store && typeof window.Store.verifySession === 'function') {
        window.Store.verifySession().then(() => {
            updateProfileUI();
            
            // Auto-open auth if requested via URL
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('auth') === 'true' && !window.Store.getUser()) {
                if (window.toggleProfile) window.toggleProfile(true);
            }
        });
    }
});
