const mongoose = require('mongoose');
const { isMongoReady } = require('../config/db');
const { createJsonStore } = require('./jsonStore');

const store = createJsonStore('orders.json');

const orderSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        items: { type: [mongoose.Schema.Types.Mixed], default: [] },
        totalAmount: { type: Number, required: true },
        transactionId: { type: String, required: true },
        status: { type: String, default: 'Processing' },
        earnedPoints: { type: Number, default: 0 },
        paymentMethod: { type: String, default: 'COD' },
        shipping: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

function MongoOrder() {
    return mongoose.models.KamiOrder || mongoose.model('KamiOrder', orderSchema);
}

const Order = {
    async getAll() {
        if (isMongoReady()) return MongoOrder().find({}).lean();
        return store.read();
    },

    async findByUser(userId) {
        if (isMongoReady()) {
            return MongoOrder().find({ userId: String(userId) }).sort({ createdAt: -1 }).lean();
        }
        const orders = await store.read();
        return orders
            .filter(o => String(o.userId) === String(userId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async create(orderData) {
        if (isMongoReady()) {
            return MongoOrder().create(orderData);
        }
        const orders = await store.read();
        const newOrder = {
            _id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            ...orderData,
            userId: String(orderData.userId),
            createdAt: new Date().toISOString(),
        };
        orders.push(newOrder);
        await store.write(orders);
        return newOrder;
    },
};

module.exports = Order;
