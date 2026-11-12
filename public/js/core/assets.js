/**
 * Image resilience helper.
 *
 * Static hosting (including Vercel) can occasionally miss an asset after a
 * rename or a partial deploy. Instead of showing the browser's broken-image
 * icon, swap the image for the local Kamiwear placeholder. This script must be
 * loaded before the other page scripts (it uses capture-phase event handling).
 */
(function () {
    const PLACEHOLDER = 'assets/brand/placeholder.jpg';

    function isUsableImage(img) {
        return img && img.tagName === 'IMG' && img.getAttribute('src') && !img.getAttribute('src').includes('placeholder.');
    }

    function swap(img) {
        if (!isUsableImage(img) || img.dataset.kwFallback === 'true') return;
        img.dataset.kwFallback = 'true';
        img.src = PLACEHOLDER;
    }

    document.addEventListener(
        'error',
        event => {
            const target = event.target;
            if (target && target.tagName === 'IMG') swap(target);
        },
        true
    );

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img').forEach(img => {
            if (img.complete && img.naturalWidth === 0) swap(img);
        });
    });
})();
