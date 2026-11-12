const mongoose = require('mongoose');
const { isMongoReady } = require('../config/db');
const { createJsonStore } = require('./jsonStore');

const store = createJsonStore('orders.json');

const orderSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        items: { type: [mongoose.Schema.Types.Mixed], default: [] },
        totalAmount: { type: Number, required: true, min: 0 },

        // Globally unique client-generated key. Retries of the same checkout
        // return the original order instead of charging/creating twice. Sparse
        // so legacy orders created before idempotency keys do not block index
        // creation on a production database.
        idempotencyKey: { type: String, required: true, index: { unique: true, sparse: true } },

        // UPI reference number (UTR). Unique + sparse so one real payment can
        // never be attached to two orders.
        utr: { type: String, index: { unique: true, sparse: true } },
        upiId: { type: String, default: '' },

        transactionId: { type: String, required: true, unique: true },
        status: { type: String, default: 'Processing' },
        paymentStatus: {
            type: String,
            enum: ['cod_pending', 'pending_verification', 'paid', 'failed', 'refunded'],
            default: 'cod_pending',
            index: true,
        },
        earnedPoints: { type: Number, default: 0 },
        pointsAwarded: { type: Boolean, default: false },
        paymentMethod: { type: String, default: 'Cash on Delivery' },
        shipping: { type: mongoose.Schema.Types.Mixed, default: {} },

        emailStatus: {
            type: String,
            enum: ['pending', 'sent', 'failed', 'not_configured'],
            default: 'pending',
        },
        emailProvider: { type: String, default: '' },
        emailSentAt: { type: Date, default: null },
        emailLastError: { type: String, default: '' },

        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: String, default: '' },
    },
    {
        timestamps: true,
        autoIndex: process.env.NODE_ENV !== 'production',
    }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

function MongoOrder() {
    return mongoose.models.KamiOrder || mongoose.model('KamiOrder', orderSchema);
}

function duplicateError(field) {
    const error = new Error(`Duplicate value for ${field}`);
    error.code = 11000;
    error.keyPattern = { [field]: 1 };
    return error;
}

function serialize(order) {
    if (!order) return null;
    return typeof order.toObject === 'function' ? order.toObject() : { ...order };
}

const Order = {
    async getAll() {
        if (isMongoReady()) return MongoOrder().find({}).lean();
        return store.read();
    },

    async findByUser(userId, limit = 100) {
        const safeLimit = Math.max(1, Math.min(100, Number(limit) || 100));
        if (isMongoReady()) {
            return MongoOrder()
                .find({ userId: String(userId) })
                .sort({ createdAt: -1 })
                .limit(safeLimit)
                .lean();
        }
        const orders = await store.read();
        return orders
            .filter(o => String(o.userId) === String(userId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, safeLimit);
    },

    async findByIdempotencyKey(idempotencyKey, userId) {
        if (isMongoReady()) {
            return MongoOrder().findOne({
                idempotencyKey: String(idempotencyKey),
                userId: String(userId),
            }).lean();
        }
        const orders = await store.read();
        return orders.find(
            o => o.idempotencyKey === idempotencyKey && String(o.userId) === String(userId)
        ) || null;
    },

    async findByUtr(utr) {
        if (!utr) return null;
        if (isMongoReady()) return MongoOrder().findOne({ utr: String(utr) }).lean();
        const orders = await store.read();
        return orders.find(o => o.utr === utr) || null;
    },

    async findById(orderId) {
        if (isMongoReady()) {
            try {
                return await MongoOrder().findById(orderId).lean();
            } catch (error) {
                if (error.name === 'CastError') return null;
                throw error;
            }
        }
        const orders = await store.read();
        return orders.find(o => String(o._id) === String(orderId)) || null;
    },

    async create(orderData) {
        if (isMongoReady()) {
            return MongoOrder().create(orderData);
        }

        const orders = await store.read();
        if (orders.some(o => o.idempotencyKey === orderData.idempotencyKey)) {
            throw duplicateError('idempotencyKey');
        }
        if (orderData.utr && orders.some(o => o.utr === orderData.utr)) {
            throw duplicateError('utr');
        }
        if (orders.some(o => o.transactionId === orderData.transactionId)) {
            throw duplicateError('transactionId');
        }

        const newOrder = {
            _id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            ...orderData,
            userId: String(orderData.userId),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        orders.push(newOrder);
        await store.write(orders);
        return newOrder;
    },

    async updateById(orderId, updates) {
        if (isMongoReady()) {
            try {
                return await MongoOrder().findByIdAndUpdate(
                    orderId,
                    { $set: updates },
                    { new: true }
                );
            } catch (error) {
                if (error.name === 'CastError') return null;
                throw error;
            }
        }

        const orders = await store.read();
        const index = orders.findIndex(o => String(o._id) === String(orderId));
        if (index === -1) return null;
        orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
        await store.write(orders);
        return orders[index];
    },

    async ensureIndexes() {
        if (!isMongoReady()) return false;
        await MongoOrder().createIndexes();
        return true;
    },

    serialize,
};

module.exports = Order;
