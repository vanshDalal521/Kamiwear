// Utility functions for KamiWear

// Format price with currency symbol
export const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
};

// Format date to readable string
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Generate random ID
export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle function
export const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Check if element is in viewport
export const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

// Smooth scroll to element
export const smoothScroll = (element) => {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
};

// Show notification
export const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <p>${message}</p>
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
};

// Load image with loading state
export const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

// Validate email
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validate password
export const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
};

// Format phone number
export const formatPhoneNumber = (phoneNumber) => {
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
};

// Get URL parameters
export const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
};

// Set URL parameters
export const setUrlParams = (params) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    window.history.pushState({}, '', url);
};

// Remove URL parameters
export const removeUrlParams = (params) => {
    const url = new URL(window.location.href);
    params.forEach(param => {
        url.searchParams.delete(param);
    });
    window.history.pushState({}, '', url);
};

// Copy text to clipboard
export const copyToClipboard = (text) => {
    return navigator.clipboard.writeText(text);
};

// Download file
export const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Generate star rating HTML
export const generateStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return `
        ${Array(fullStars).fill('<i class="fas fa-star"></i>').join('')}
        ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
    `;
};

// Truncate text
export const truncateText = (text, length) => {
    if (text.length <= length) return text;
    return text.substr(0, length) + '...';
};

// Generate random color
export const generateRandomColor = () => {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
};

// Check if device is mobile
export const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device is touch
export const isTouch = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Get device type
export const getDeviceType = () => {
    if (isMobile()) return 'mobile';
    if (isTouch()) return 'tablet';
    return 'desktop';
};

// Get screen size
export const getScreenSize = () => {
    const width = window.innerWidth;
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 992) return 'md';
    if (width < 1200) return 'lg';
    return 'xl';
};

// Check if browser supports feature
export const supportsFeature = (feature) => {
    return feature in window;
};

// Get browser info
export const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browserName;
    let browserVersion;

    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = 'Chrome';
        browserVersion = userAgent.match(/(?:chrome|crios|chromium)\/(\d+)/i)[1];
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = 'Firefox';
        browserVersion = userAgent.match(/(?:firefox|fxios)\/(\d+)/i)[1];
    } else if (userAgent.match(/safari/i)) {
        browserName = 'Safari';
        browserVersion = userAgent.match(/version\/(\d+)/i)[1];
    } else if (userAgent.match(/opr\//i)) {
        browserName = 'Opera';
        browserVersion = userAgent.match(/(?:opr)\/(\d+)/i)[1];
    } else if (userAgent.match(/edg/i)) {
        browserName = 'Edge';
        browserVersion = userAgent.match(/(?:edg)\/(\d+)/i)[1];
    } else {
        browserName = 'Unknown';
        browserVersion = 'Unknown';
    }

    return {
        name: browserName,
        version: browserVersion
    };
};

// Get OS info
export const getOSInfo = () => {
    const userAgent = navigator.userAgent;
    let osName;
    let osVersion;

    if (userAgent.match(/windows/i)) {
        osName = 'Windows';
        osVersion = userAgent.match(/windows nt (\d+\.\d+)/i)[1];
    } else if (userAgent.match(/macintosh|mac os x/i)) {
        osName = 'MacOS';
        osVersion = userAgent.match(/mac os x (\d+[._]\d+)/i)[1].replace('_', '.');
    } else if (userAgent.match(/linux/i)) {
        osName = 'Linux';
        osVersion = 'Unknown';
    } else if (userAgent.match(/android/i)) {
        osName = 'Android';
        osVersion = userAgent.match(/android (\d+)/i)[1];
    } else if (userAgent.match(/iphone|ipad|ipod/i)) {
        osName = 'iOS';
        osVersion = userAgent.match(/os (\d+[._]\d+)/i)[1].replace('_', '.');
    } else {
        osName = 'Unknown';
        osVersion = 'Unknown';
    }

    return {
        name: osName,
        version: osVersion
    };
}; 