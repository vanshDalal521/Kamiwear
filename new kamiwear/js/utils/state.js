// State module for KamiWear

// State class for handling state management
export class State {
    constructor() {
        this.state = {};
        this.subscribers = new Map();
        this.initializeState();
    }

    initializeState() {
        // Load state from localStorage
        const savedState = localStorage.getItem('kamiwear_state');
        if (savedState) {
            this.state = JSON.parse(savedState);
        }

        // Initialize default state
        this.state = {
            ...this.state,
            cart: [],
            wishlist: [],
            user: null,
            theme: 'light',
            language: 'en',
            notifications: [],
            settings: {
                sound: true,
                vibration: true,
                notifications: true,
                darkMode: false,
                fontSize: 'medium',
                contrast: 'normal'
            }
        };

        // Save state to localStorage
        this.saveState();
    }

    // State getters
    getState() {
        return this.state;
    }

    getStateValue(key) {
        return this.state[key];
    }

    // State setters
    setState(newState) {
        this.state = {
            ...this.state,
            ...newState
        };
        this.saveState();
        this.notifySubscribers();
    }

    setStateValue(key, value) {
        this.state[key] = value;
        this.saveState();
        this.notifySubscribers(key);
    }

    // State subscribers
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
    }

    unsubscribe(key, callback) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).delete(callback);
        }
    }

    notifySubscribers(key) {
        if (key) {
            if (this.subscribers.has(key)) {
                this.subscribers.get(key).forEach(callback => {
                    callback(this.state[key]);
                });
            }
        } else {
            this.subscribers.forEach((callbacks, key) => {
                callbacks.forEach(callback => {
                    callback(this.state[key]);
                });
            });
        }
    }

    // State persistence
    saveState() {
        localStorage.setItem('kamiwear_state', JSON.stringify(this.state));
    }

    loadState() {
        const savedState = localStorage.getItem('kamiwear_state');
        if (savedState) {
            this.state = JSON.parse(savedState);
            this.notifySubscribers();
        }
    }

    clearState() {
        this.state = {};
        this.saveState();
        this.notifySubscribers();
    }

    // Cart state
    addToCart(item) {
        const cart = this.state.cart || [];
        const existingItem = cart.find(i => i.id === item.id);

        if (existingItem) {
            existingItem.quantity += item.quantity || 1;
        } else {
            cart.push({
                ...item,
                quantity: item.quantity || 1
            });
        }

        this.setStateValue('cart', cart);
    }

    removeFromCart(itemId) {
        const cart = this.state.cart || [];
        const newCart = cart.filter(item => item.id !== itemId);
        this.setStateValue('cart', newCart);
    }

    updateCartItemQuantity(itemId, quantity) {
        const cart = this.state.cart || [];
        const newCart = cart.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    quantity
                };
            }
            return item;
        });
        this.setStateValue('cart', newCart);
    }

    clearCart() {
        this.setStateValue('cart', []);
    }

    // Wishlist state
    addToWishlist(item) {
        const wishlist = this.state.wishlist || [];
        if (!wishlist.find(i => i.id === item.id)) {
            wishlist.push(item);
            this.setStateValue('wishlist', wishlist);
        }
    }

    removeFromWishlist(itemId) {
        const wishlist = this.state.wishlist || [];
        const newWishlist = wishlist.filter(item => item.id !== itemId);
        this.setStateValue('wishlist', newWishlist);
    }

    clearWishlist() {
        this.setStateValue('wishlist', []);
    }

    // User state
    setUser(user) {
        this.setStateValue('user', user);
    }

    clearUser() {
        this.setStateValue('user', null);
    }

    // Theme state
    setTheme(theme) {
        this.setStateValue('theme', theme);
    }

    toggleTheme() {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Language state
    setLanguage(language) {
        this.setStateValue('language', language);
    }

    // Notification state
    addNotification(notification) {
        const notifications = this.state.notifications || [];
        notifications.push({
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        });
        this.setStateValue('notifications', notifications);
    }

    removeNotification(notificationId) {
        const notifications = this.state.notifications || [];
        const newNotifications = notifications.filter(n => n.id !== notificationId);
        this.setStateValue('notifications', newNotifications);
    }

    clearNotifications() {
        this.setStateValue('notifications', []);
    }

    // Settings state
    updateSettings(settings) {
        this.setStateValue('settings', {
            ...this.state.settings,
            ...settings
        });
    }

    // State utilities
    getCartTotal() {
        const cart = this.state.cart || [];
        return cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getCartItemCount() {
        const cart = this.state.cart || [];
        return cart.reduce((count, item) => {
            return count + item.quantity;
        }, 0);
    }

    getWishlistItemCount() {
        const wishlist = this.state.wishlist || [];
        return wishlist.length;
    }

    isInCart(itemId) {
        const cart = this.state.cart || [];
        return cart.some(item => item.id === itemId);
    }

    isInWishlist(itemId) {
        const wishlist = this.state.wishlist || [];
        return wishlist.some(item => item.id === itemId);
    }

    getCartItemQuantity(itemId) {
        const cart = this.state.cart || [];
        const item = cart.find(item => item.id === itemId);
        return item ? item.quantity : 0;
    }

    // State validation
    validateState() {
        const requiredKeys = ['cart', 'wishlist', 'user', 'theme', 'language', 'notifications', 'settings'];
        const missingKeys = requiredKeys.filter(key => !(key in this.state));

        if (missingKeys.length > 0) {
            console.error('Missing required state keys:', missingKeys);
            return false;
        }

        return true;
    }

    // State migration
    migrateState(fromVersion, toVersion) {
        // Add migration logic here
        console.log(`Migrating state from version ${fromVersion} to ${toVersion}`);
    }

    // State backup
    backupState() {
        const backup = {
            state: this.state,
            timestamp: Date.now(),
            version: '1.0.0'
        };
        localStorage.setItem('kamiwear_state_backup', JSON.stringify(backup));
    }

    restoreState() {
        const backup = localStorage.getItem('kamiwear_state_backup');
        if (backup) {
            const { state, timestamp, version } = JSON.parse(backup);
            this.state = state;
            this.saveState();
            this.notifySubscribers();
            return true;
        }
        return false;
    }
}

// Create state instance
const state = new State();

// Export state instance
export default state; 