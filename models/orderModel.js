const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const ORDER_FILE = path.join(__dirname, '../data/orders.json');

// Ensure data folder and file exist synchronously on startup
if (!fsSync.existsSync(path.join(__dirname, '../data'))) {
    fsSync.mkdirSync(path.join(__dirname, '../data'));
}
if (!fsSync.existsSync(ORDER_FILE)) {
    fsSync.writeFileSync(ORDER_FILE, JSON.stringify([]));
}

const Order = {
    getAll: async () => {
        const data = await fs.readFile(ORDER_FILE, 'utf-8');
        return JSON.parse(data);
    },

    findByUser: async (userId) => {
        const orders = await Order.getAll();
        return orders.filter(o => o.userId === userId || o.user_id === userId); // handle possible id mismatches
    },

    create: async (orderData) => {
        const orders = await Order.getAll();
        const newOrder = {
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            ...orderData,
            createdAt: new Date().toISOString()
        };
        orders.push(newOrder);
        await fs.writeFile(ORDER_FILE, JSON.stringify(orders, null, 2));
        return newOrder;
    }
};

module.exports = Order;
