// UI module for KamiWear

// UI class for handling UI components
export class UI {
    constructor() {
        this.notifications = [];
        this.modals = [];
        this.tooltips = [];
        this.dropdowns = [];
        this.tabs = [];
        this.accordions = [];
        this.carousels = [];
        this.sliders = [];
        this.initializeUI();
    }

    initializeUI() {
        this.initializeNotifications();
        this.initializeModals();
        this.initializeTooltips();
        this.initializeDropdowns();
        this.initializeTabs();
        this.initializeAccordions();
        this.initializeCarousels();
        this.initializeSliders();
    }

    // Notifications
    initializeNotifications() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                const notification = e.target.closest('.notification');
                this.removeNotification(notification);
            }
        });
    }

    showNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <p>${message}</p>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(notification);
        this.notifications.push(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    // Modals
    initializeModals() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            }
            if (e.target.classList.contains('modal-overlay')) {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            }
        });
    }

    showModal(content, options = {}) {
        const {
            title = '',
            size = 'medium',
            closeable = true,
            overlay = true,
            onClose = null
        } = options;

        const modal = document.createElement('div');
        modal.className = `modal ${size}`;
        modal.innerHTML = `
            ${overlay ? '<div class="modal-overlay"></div>' : ''}
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${title}</h3>
                    ${closeable ? `
                        <button class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modals.push(modal);

        if (onClose) {
            modal.dataset.onClose = onClose.toString();
        }

        setTimeout(() => {
            modal.classList.add('show');
        }, 100);

        return modal;
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            const onClose = modal.dataset.onClose;
            if (onClose) {
                eval(onClose)();
            }
            modal.remove();
            this.modals = this.modals.filter(m => m !== modal);
        }, 300);
    }

    // Tooltips
    initializeTooltips() {
        document.addEventListener('mouseover', (e) => {
            const tooltip = e.target.closest('[data-tooltip]');
            if (tooltip) {
                this.showTooltip(tooltip);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const tooltip = e.target.closest('[data-tooltip]');
            if (tooltip) {
                this.hideTooltip(tooltip);
            }
        });
    }

    showTooltip(element) {
        const text = element.dataset.tooltip;
        const position = element.dataset.tooltipPosition || 'top';

        const tooltip = document.createElement('div');
        tooltip.className = `tooltip ${position}`;
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        this.tooltips.push(tooltip);

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 10;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 10;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 10;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 10;
                break;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.classList.add('show');
    }

    hideTooltip(element) {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => {
                tooltip.remove();
                this.tooltips = this.tooltips.filter(t => t !== tooltip);
            }, 300);
        }
    }

    // Dropdowns
    initializeDropdowns() {
        document.addEventListener('click', (e) => {
            const dropdown = e.target.closest('.dropdown');
            if (dropdown) {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                if (toggle && e.target.closest('.dropdown-toggle')) {
                    this.toggleDropdown(dropdown);
                }
            } else {
                this.closeAllDropdowns();
            }
        });
    }

    toggleDropdown(dropdown) {
        const isOpen = dropdown.classList.contains('open');
        this.closeAllDropdowns();
        if (!isOpen) {
            dropdown.classList.add('open');
            this.dropdowns.push(dropdown);
        }
    }

    closeAllDropdowns() {
        this.dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
        this.dropdowns = [];
    }

    // Tabs
    initializeTabs() {
        document.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (tab) {
                const tabs = tab.closest('.tabs');
                if (tabs) {
                    this.switchTab(tabs, tab);
                }
            }
        });
    }

    switchTab(tabs, tab) {
        const tabContent = tabs.querySelector('.tab-content');
        const tabPanels = tabContent.querySelectorAll('.tab-panel');
        const tabButtons = tabs.querySelectorAll('.tab');

        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
        });

        tab.classList.add('active');
        const panel = tabContent.querySelector(`#${tab.dataset.target}`);
        if (panel) {
            panel.classList.add('active');
        }
    }

    // Accordions
    initializeAccordions() {
        document.addEventListener('click', (e) => {
            const accordion = e.target.closest('.accordion');
            if (accordion) {
                const header = accordion.querySelector('.accordion-header');
                if (header && e.target.closest('.accordion-header')) {
                    this.toggleAccordion(accordion);
                }
            }
        });
    }

    toggleAccordion(accordion) {
        const isOpen = accordion.classList.contains('open');
        const content = accordion.querySelector('.accordion-content');
        const height = content.scrollHeight;

        if (isOpen) {
            accordion.classList.remove('open');
            content.style.height = '0px';
        } else {
            accordion.classList.add('open');
            content.style.height = `${height}px`;
        }
    }

    // Carousels
    initializeCarousels() {
        document.addEventListener('click', (e) => {
            const carousel = e.target.closest('.carousel');
            if (carousel) {
                const prev = carousel.querySelector('.carousel-prev');
                const next = carousel.querySelector('.carousel-next');
                if (prev && e.target.closest('.carousel-prev')) {
                    this.prevSlide(carousel);
                }
                if (next && e.target.closest('.carousel-next')) {
                    this.nextSlide(carousel);
                }
            }
        });
    }

    prevSlide(carousel) {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const current = carousel.querySelector('.carousel-slide.active');
        const index = Array.from(slides).indexOf(current);
        const prev = slides[(index - 1 + slides.length) % slides.length];

        current.classList.remove('active');
        prev.classList.add('active');
    }

    nextSlide(carousel) {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const current = carousel.querySelector('.carousel-slide.active');
        const index = Array.from(slides).indexOf(current);
        const next = slides[(index + 1) % slides.length];

        current.classList.remove('active');
        next.classList.add('active');
    }

    // Sliders
    initializeSliders() {
        document.addEventListener('mousedown', (e) => {
            const slider = e.target.closest('.slider');
            if (slider) {
                const handle = slider.querySelector('.slider-handle');
                if (handle && e.target.closest('.slider-handle')) {
                    this.startSliderDrag(slider, e);
                }
            }
        });
    }

    startSliderDrag(slider, e) {
        const handle = slider.querySelector('.slider-handle');
        const track = slider.querySelector('.slider-track');
        const rect = track.getBoundingClientRect();
        const startX = e.clientX;
        const startLeft = handle.offsetLeft;

        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            let newLeft = startLeft + deltaX;
            newLeft = Math.max(0, Math.min(newLeft, rect.width - handle.offsetWidth));
            handle.style.left = `${newLeft}px`;

            const value = (newLeft / (rect.width - handle.offsetWidth)) * 100;
            slider.dataset.value = value;
            this.updateSliderValue(slider, value);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    updateSliderValue(slider, value) {
        const input = slider.querySelector('input[type="range"]');
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input'));
        }
    }
}

// Create UI instance
const ui = new UI();

// Export UI instance
export default ui; 