document.addEventListener('DOMContentLoaded', () => {
    // 1. Wishlist Logic
    const initWishlist = () => {
        const hearts = document.querySelectorAll('.material-symbols-outlined[textContent="favorite"], button:has(.material-symbols-outlined[textContent="favorite"])');
        hearts.forEach(heart => {
            heart.addEventListener('click', (e) => {
                e.preventDefault();
                heart.classList.toggle('text-red-500');
                heart.style.fontVariationSettings = heart.classList.contains('text-red-500') ? "'FILL' 1" : "'FILL' 0";

                // Show toast (simple)
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-8 right-8 bg-black/80 text-white px-6 py-3 rounded-full glass-panel z-[100] animate-bounce';
                toast.textContent = heart.classList.contains('text-red-500') ? 'Added to Wishlist' : 'Removed from Wishlist';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            });
        });
    }
    initWishlist();

    // Person button logic is now handled in profile-modal.js with high-end UI

    // 3. Marquee Speed adjustment
    const marquee = document.querySelector('.marquee');
    if (marquee) {
        marquee.style.animationDuration = '20s';
    }
});
