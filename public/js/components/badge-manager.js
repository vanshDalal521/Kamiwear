// UI components communication and overall badge management
window.addEventListener('DOMContentLoaded', () => {
    // Update all badges across the site
    const updateBadges = () => {
        const cart = window.Store.getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);

        document.querySelectorAll('#cart-count-badge').forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    };

    // Initial check
    updateBadges();

    // Listen for changes
    window.addEventListener('cartUpdated', updateBadges);
});
