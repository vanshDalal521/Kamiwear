const crypto = require('crypto');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

const MAX_ITEM_PRICE = 500000;
const MAX_QUANTITY = 25;

const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function loyaltyRate() {
    const rate = Number(process.env.LOYALTY_EARN_RATE);
    return Number.isFinite(rate) && rate > 0 ? rate : 10;
}

function normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Your cart is empty');
    }
    if (items.length > 100) throw new Error('Too many items in this order');

    return items.map(item => {
        const name = String(item.name || '').trim().slice(0, 120);
        const price = Number(item.price);
        const quantity = Math.floor(Number(item.quantity));

        if (!name) throw new Error('An item is missing its name');
        if (!Number.isFinite(price) || price <= 0 || price > MAX_ITEM_PRICE) {
            throw new Error(`Invalid price for "${name}"`);
        }
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
            throw new Error(`Invalid quantity for "${name}"`);
        }

        return {
            id: String(item.id || `${name}-${price}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')).slice(0, 120),
            name,
            price: round2(price),
            quantity,
            image: typeof item.image === 'string' ? item.image.slice(0, 500) : '',
            category: typeof item.category === 'string' ? item.category.slice(0, 80) : 'Apparel',
        };
    });
}

function simulateCardPayment(paymentDetails, amount) {
    const { cardNumber, expiry, cvc } = paymentDetails || {};
    const digits = String(cardNumber || '').replace(/\D/g, '');

    if (digits.length < 13 || digits.length > 19) return { success: false, msg: 'Invalid card number' };
    if (!/^\d{2}\s*\/\s*\d{2,4}$/.test(String(expiry || ''))) return { success: false, msg: 'Invalid expiry date (MM/YY)' };
    if (!/^\d{3,4}$/.test(String(cvc || ''))) return { success: false, msg: 'Invalid CVC' };

    return {
        success: true,
        transactionId: `SIM_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        method: 'Card (sandbox)',
        status: 'Processing',
    };
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Ask Razorpay for the order we created and confirm it matches this checkout.
 * This prevents a client from paying a ₹1 test order and then submitting a
 * different cart total to the API.
 */
async function verifyRazorpayOrder({ orderId, amount, userId }) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return { success: false, status: 503, msg: 'Card payments are not configured on this server' };

    try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
            headers: { Authorization: `Basic ${auth}` },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return { success: false, status: 402, msg: 'Could not verify the Razorpay order' };
        }
        if (Number(data.amount) !== Math.round(Number(amount) * 100)) {
            return { success: false, status: 402, msg: 'Payment amount does not match the order total' };
        }
        if (data.notes?.userId && String(data.notes.userId) !== String(userId)) {
            return { success: false, status: 402, msg: 'Payment does not belong to this account' };
        }
        return { success: true };
    } catch (error) {
        console.error('Razorpay order verification error:', error.message);
        return { success: false, status: 502, msg: 'Could not reach Razorpay to verify the payment' };
    }
}

async function processKamiKoin(userId, orderTotal) {
    const earned = Math.max(0, Math.floor(orderTotal / loyaltyRate()));
    if (earned <= 0) return 0;

    try {
        let user = await User.findOne({ _id: userId });
        if (!user) {
            const users = await User.getAll();
            const raw = users.find(u => String(u._id) === String(userId) || String(u.id) === String(userId));
            if (raw) user = await User.findOne({ email: raw.email });
        }
        if (!user) return 0;

        user.kamiKoins = (Number(user.kamiKoins) || 0) + earned;
        if (user.kamiKoins > 1000) user.tier = 'Kage';
        else if (user.kamiKoins > 500) user.tier = 'Jonin';
        else if (user.kamiKoins > 200) user.tier = 'Chunin';

        await user.save();
        return earned;
    } catch (error) {
        console.error('Error processing KamiKoins:', error.message);
        return 0;
    }
}

/**
 * Resolve the payment result for the selected method.
 *
 * COD + UPI are always available. Card is only accepted when the simulated
 * banking sandbox is explicitly enabled, and Razorpay is only accepted when
 * real API keys are configured and the signature verifies.
 */
async function resolvePayment(method, paymentDetails, amount, userId) {
    const normalized = String(method || 'COD').toUpperCase();

    if (normalized === 'COD') {
        return {
            success: true,
            method: 'Cash on Delivery',
            status: 'Processing',
            transactionId: `COD_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        };
    }

    if (normalized === 'UPI') {
        return {
            success: true,
            method: 'UPI',
            status: 'Payment pending verification',
            transactionId: `UPI_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        };
    }

    if (normalized === 'RAZORPAY') {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentDetails || {};
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return { success: false, status: 503, msg: 'Card payments are not configured on this server' };
        }
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return { success: false, status: 400, msg: 'Missing Razorpay payment confirmation' };
        }
        if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            return { success: false, status: 402, msg: 'Payment signature verification failed' };
        }

        const orderCheck = await verifyRazorpayOrder({
            orderId: razorpayOrderId,
            amount,
            userId,
        });
        if (!orderCheck.success) return orderCheck;

        return {
            success: true,
            method: 'Card (Razorpay)',
            status: 'Processing',
            transactionId: razorpayPaymentId,
        };
    }

    if (normalized === 'CARD') {
        if (String(process.env.ENABLE_BANKING_SIM || '').toLowerCase() !== 'true') {
            return { success: false, status: 503, msg: 'Card payments are not configured. Choose Cash on Delivery or UPI.' };
        }
        const simulated = simulateCardPayment(paymentDetails, amount);
        return simulated.success
            ? { ...simulated, status: simulated.status || 'Processing' }
            : { success: false, status: 402, msg: simulated.msg };
    }

    return { success: false, status: 400, msg: `Unsupported payment method: ${method}` };
}

const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = normalizeItems(req.body.items);
        const total = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

        if (!Number.isFinite(total) || total <= 0) {
            return res.status(400).json({ error: 'Invalid order total' });
        }

        const method = req.body.paymentMethod || req.body.method || (req.body.paymentDetails && req.body.paymentDetails.method) || 'COD';
        const payment = await resolvePayment(method, req.body.paymentDetails, total, userId);

        if (!payment.success) {
            return res.status(payment.status || 402).json({ error: 'Payment failed', details: payment.msg });
        }

        // Prevent the same Razorpay payment from being replayed for another order.
        if (String(method).toUpperCase() === 'RAZORPAY') {
            const existingOrders = await Order.getAll();
            if (existingOrders.some(order => order.transactionId === payment.transactionId)) {
                return res.status(409).json({ error: 'Payment failed', details: 'This payment has already been used' });
            }
        }

        const earnedPoints = await processKamiKoin(userId, total);

        const order = await Order.create({
            userId: String(userId),
            items,
            totalAmount: total,
            transactionId: payment.transactionId,
            status: payment.status,
            earnedPoints,
            paymentMethod: payment.method,
            shipping: req.body.shipping || {},
        });

        const serialized = typeof order.toObject === 'function' ? order.toObject() : order;

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: { ...serialized, _id: String(serialized._id), id: String(serialized._id) },
        });
    } catch (error) {
        const isValidation = /cart is empty|Invalid|Too many|missing/i.test(error.message);
        console.error('Create order error:', error.message);
        res.status(isValidation ? 400 : 500).json({
            error: isValidation ? error.message : 'Server error during order processing',
        });
    }
};

const getOrderHistory = async (req, res) => {
    try {
        const orders = await Order.findByUser(String(req.user.id));
        res.status(200).json({
            orders: orders.map(o => {
                const raw = typeof o.toObject === 'function' ? o.toObject() : o;
                return { ...raw, _id: String(raw._id), id: String(raw._id) };
            }),
        });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};

/**
 * Create a Razorpay order (called by checkout before opening Razorpay's UI).
 * Uses Razorpay's REST API so no extra SDK dependency is needed.
 */
const createRazorpayOrder = async (req, res) => {
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            return res.status(503).json({ error: 'Razorpay is not configured' });
        }

        const items = normalizeItems(req.body.items);
        const total = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
        if (total <= 0) return res.status(400).json({ error: 'Invalid order total' });

        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
                amount: Math.round(total * 100),
                currency: 'INR',
                receipt: `kw_${Date.now()}`,
                payment_capture: 1,
                notes: { userId: String(req.user.id) },
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Razorpay order error:', data);
            return res.status(502).json({ error: data.error?.description || 'Unable to start Razorpay payment' });
        }

        res.status(201).json({ keyId, orderId: data.id, amount: data.amount, currency: data.currency });
    } catch (error) {
        const isValidation = /cart is empty|Invalid|Too many|missing/i.test(error.message);
        console.error('Razorpay create error:', error.message);
        res.status(isValidation ? 400 : 500).json({ error: isValidation ? error.message : 'Unable to start payment' });
    }
};

module.exports = { createOrder, getOrderHistory, createRazorpayOrder };
