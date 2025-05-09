class ImageLoader {
    constructor() {
        this.placeholderImage = '/assets/placeholder.jpg';
        this.loadingSpinner = '<div class="image-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadAllImages();
        });
    }

    loadAllImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.loadImage(img));
    }

    loadImage(img) {
        // Add loading spinner
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.innerHTML = this.loadingSpinner;
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Set initial state
        img.style.opacity = '0';
        img.onerror = () => this.handleImageError(img);
        img.onload = () => this.handleImageLoad(img);

        // Load the image
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
        } else {
            this.handleImageError(img);
        }
    }

    handleImageLoad(img) {
        img.classList.add('loaded');
        img.style.opacity = '1';
        const wrapper = img.parentElement;
        if (wrapper) {
            const spinner = wrapper.querySelector('.image-loading');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    handleImageError(img) {
        img.src = this.placeholderImage;
        img.classList.add('error');
        const wrapper = img.parentElement;
        if (wrapper) {
            const spinner = wrapper.querySelector('.image-loading');
            if (spinner) {
                spinner.remove();
            }
        }
    }
}

// Initialize the image loader
const imageLoader = new ImageLoader();
imageLoader.init();

// Add CSS for image loading
const style = document.createElement('style');
style.textContent = `
    .image-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
    }

    .image-loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.1);
    }

    .image-loading i {
        color: var(--primary-color);
        font-size: 2rem;
    }

    img {
        transition: opacity 0.3s ease;
    }

    img.loaded {
        opacity: 1;
    }

    img.error {
        opacity: 0.7;
    }
`;
document.head.appendChild(style);