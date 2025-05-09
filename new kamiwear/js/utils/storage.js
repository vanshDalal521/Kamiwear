// Storage module for KamiWear

// Storage class for handling local storage operations
export class Storage {
    constructor(prefix = 'kamiwear_') {
        this.prefix = prefix;
    }

    // Set item in storage
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Get item from storage
    get(key) {
        try {
            const serializedValue = localStorage.getItem(this.prefix + key);
            return serializedValue ? JSON.parse(serializedValue) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    // Remove item from storage
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    // Clear all items with prefix
    clear() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    // Get all items with prefix
    getAll() {
        try {
            const items = {};
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    items[key.replace(this.prefix, '')] = JSON.parse(value);
                }
            });
            return items;
        } catch (error) {
            console.error('Error getting all items from localStorage:', error);
            return {};
        }
    }

    // Check if key exists
    has(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }

    // Get storage size
    getSize() {
        try {
            let size = 0;
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    size += localStorage.getItem(key).length;
                }
            });
            return size;
        } catch (error) {
            console.error('Error getting storage size:', error);
            return 0;
        }
    }

    // Get storage quota
    async getQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const {usage, quota} = await navigator.storage.estimate();
                return {
                    usage,
                    quota,
                    percentage: (usage / quota) * 100
                };
            } catch (error) {
                console.error('Error getting storage quota:', error);
                return null;
            }
        }
        return null;
    }

    // Check if storage is available
    isAvailable() {
        try {
            const testKey = this.prefix + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get storage type
    getType() {
        return 'localStorage';
    }

    // Get storage prefix
    getPrefix() {
        return this.prefix;
    }

    // Set storage prefix
    setPrefix(prefix) {
        this.prefix = prefix;
    }

    // Get storage keys
    getKeys() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
        } catch (error) {
            console.error('Error getting storage keys:', error);
            return [];
        }
    }

    // Get storage values
    getValues() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .map(key => JSON.parse(localStorage.getItem(key)));
        } catch (error) {
            console.error('Error getting storage values:', error);
            return [];
        }
    }

    // Get storage entries
    getEntries() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .map(key => ({
                    key: key.replace(this.prefix, ''),
                    value: JSON.parse(localStorage.getItem(key))
                }));
        } catch (error) {
            console.error('Error getting storage entries:', error);
            return [];
        }
    }

    // Get storage length
    getLength() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .length;
        } catch (error) {
            console.error('Error getting storage length:', error);
            return 0;
        }
    }

    // Check if storage is empty
    isEmpty() {
        return this.getLength() === 0;
    }

    // Check if storage is full
    async isFull() {
        const quota = await this.getQuota();
        if (quota) {
            return quota.percentage >= 100;
        }
        return false;
    }

    // Get storage remaining
    async getRemaining() {
        const quota = await this.getQuota();
        if (quota) {
            return quota.quota - quota.usage;
        }
        return null;
    }

    // Get storage used
    async getUsed() {
        const quota = await this.getQuota();
        if (quota) {
            return quota.usage;
        }
        return null;
    }

    // Get storage total
    async getTotal() {
        const quota = await this.getQuota();
        if (quota) {
            return quota.quota;
        }
        return null;
    }

    // Get storage percentage
    async getPercentage() {
        const quota = await this.getQuota();
        if (quota) {
            return quota.percentage;
        }
        return null;
    }

    // Get storage info
    async getInfo() {
        return {
            type: this.getType(),
            prefix: this.getPrefix(),
            keys: this.getKeys(),
            length: this.getLength(),
            size: this.getSize(),
            quota: await this.getQuota(),
            available: this.isAvailable(),
            empty: this.isEmpty(),
            full: await this.isFull(),
            remaining: await this.getRemaining(),
            used: await this.getUsed(),
            total: await this.getTotal(),
            percentage: await this.getPercentage()
        };
    }
}

// Create storage instance
const storage = new Storage();

// Export storage instance
export default storage; 