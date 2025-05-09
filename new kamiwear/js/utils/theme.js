// Theme module for KamiWear

// Theme class for handling theme functionality
export class Theme {
    constructor() {
        this.themes = {
            light: {
                '--primary-color': '#ff2d2d',
                '--secondary-color': '#1a1a2e',
                '--accent-color': '#ff9f1c',
                '--text-color': '#333',
                '--light-text': '#f8f8f8',
                '--dark-bg': '#0f0f1a',
                '--light-bg': '#f5f5f5',
                '--border-color': '#ddd',
                '--success-color': '#28a745',
                '--warning-color': '#ffc107',
                '--danger-color': '#dc3545',
                '--info-color': '#17a2b8'
            },
            dark: {
                '--primary-color': '#ff2d2d',
                '--secondary-color': '#f8f8f8',
                '--accent-color': '#ff9f1c',
                '--text-color': '#f8f8f8',
                '--light-text': '#333',
                '--dark-bg': '#f5f5f5',
                '--light-bg': '#0f0f1a',
                '--border-color': '#444',
                '--success-color': '#28a745',
                '--warning-color': '#ffc107',
                '--danger-color': '#dc3545',
                '--info-color': '#17a2b8'
            }
        };
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.initializeTheme();
    }

    initializeTheme() {
        this.applyTheme(this.currentTheme);
        this.attachEventListeners();
    }

    attachEventListeners() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        const themeColors = this.themes[theme];

        Object.entries(themeColors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;

        // Update theme toggle button if it exists
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = `
                <i class="fas fa-${theme === 'light' ? 'moon' : 'sun'}"></i>
                <span>${theme === 'light' ? 'Dark' : 'Light'} Mode</span>
            `;
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getThemeColors(theme = this.currentTheme) {
        return this.themes[theme];
    }

    setThemeColor(property, value, theme = this.currentTheme) {
        if (this.themes[theme]) {
            this.themes[theme][property] = value;
            if (theme === this.currentTheme) {
                document.documentElement.style.setProperty(property, value);
            }
        }
    }

    addTheme(name, colors) {
        this.themes[name] = colors;
    }

    removeTheme(name) {
        if (name !== 'light' && name !== 'dark') {
            delete this.themes[name];
        }
    }

    getAvailableThemes() {
        return Object.keys(this.themes);
    }

    // Animation presets
    getAnimationPresets() {
        return {
            fadeIn: {
                opacity: [0, 1],
                duration: 300,
                easing: 'ease-in-out'
            },
            fadeOut: {
                opacity: [1, 0],
                duration: 300,
                easing: 'ease-in-out'
            },
            slideIn: {
                transform: ['translateY(20px)', 'translateY(0)'],
                opacity: [0, 1],
                duration: 300,
                easing: 'ease-out'
            },
            slideOut: {
                transform: ['translateY(0)', 'translateY(20px)'],
                opacity: [1, 0],
                duration: 300,
                easing: 'ease-in'
            },
            scaleIn: {
                transform: ['scale(0.9)', 'scale(1)'],
                opacity: [0, 1],
                duration: 300,
                easing: 'ease-out'
            },
            scaleOut: {
                transform: ['scale(1)', 'scale(0.9)'],
                opacity: [1, 0],
                duration: 300,
                easing: 'ease-in'
            },
            rotateIn: {
                transform: ['rotate(-180deg)', 'rotate(0)'],
                opacity: [0, 1],
                duration: 300,
                easing: 'ease-out'
            },
            rotateOut: {
                transform: ['rotate(0)', 'rotate(180deg)'],
                opacity: [1, 0],
                duration: 300,
                easing: 'ease-in'
            }
        };
    }

    // Apply animation to element
    animate(element, preset, options = {}) {
        const presets = this.getAnimationPresets();
        const animation = presets[preset];

        if (!animation) {
            console.error(`Animation preset "${preset}" not found`);
            return;
        }

        const {
            duration = animation.duration,
            easing = animation.easing,
            delay = 0,
            onComplete = null
        } = options;

        element.animate(animation, {
            duration,
            easing,
            delay,
            fill: 'forwards'
        }).onfinish = onComplete;
    }

    // Apply animation to multiple elements
    animateAll(elements, preset, options = {}) {
        const {
            stagger = 0,
            onComplete = null
        } = options;

        elements.forEach((element, index) => {
            this.animate(element, preset, {
                ...options,
                delay: index * stagger,
                onComplete: index === elements.length - 1 ? onComplete : null
            });
        });
    }

    // Apply animation to element with custom keyframes
    animateCustom(element, keyframes, options = {}) {
        const {
            duration = 300,
            easing = 'ease-in-out',
            delay = 0,
            onComplete = null
        } = options;

        element.animate(keyframes, {
            duration,
            easing,
            delay,
            fill: 'forwards'
        }).onfinish = onComplete;
    }

    // Apply animation to element with custom keyframes and multiple elements
    animateCustomAll(elements, keyframes, options = {}) {
        const {
            stagger = 0,
            onComplete = null
        } = options;

        elements.forEach((element, index) => {
            this.animateCustom(element, keyframes, {
                ...options,
                delay: index * stagger,
                onComplete: index === elements.length - 1 ? onComplete : null
            });
        });
    }
}

// Create theme instance
const theme = new Theme();

// Export theme instance
export default theme; 