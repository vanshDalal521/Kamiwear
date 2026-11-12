const crypto = require('crypto');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const emailService = require('../services/emailService');
const { UPI_ID } = require('../config/store');
const { getAdminKey } = require('../config/security');

const MAX_ITEM_PRICE = 500000;
const MAX_QUANTITY = 25;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// JSON storage does not have Mongo's unique-index guarantee. Serialise order
// creation in-process so local/emergency fallback mode cannot double-create.
let jsonCreateQueue = Promise.resolve();

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

function normalizeShipping(input) {
    const shipping = input && typeof input === 'object' ? input : {};
    const clean = {
        email: String(shipping.email || '').trim().toLowerCase().slice(0, 254),
        firstName: String(shipping.firstName || '').trim().slice(0, 80),
        lastName: String(shipping.lastName || '').trim().slice(0, 80),
        address: String(shipping.address || '').trim().slice(0, 200),
        apartment: String(shipping.apartment || '').trim().slice(0, 200),
        city: String(shipping.city || '').trim().slice(0, 80),
        country: String(shipping.country || '').trim().slice(0, 80),
    };

    if (!EMAIL_RE.test(clean.email)) throw new Error('Please enter a valid email address');
    if (!clean.firstName) throw new Error('Please enter your first name');
    if (!clean.address) throw new Error('Please enter your shipping address');
    if (!clean.city) throw new Error('Please enter your city');

    return clean;
}

function normalizeIdempotencyKey(req) {
    const raw = req.body.idempotencyKey || req.get('Idempotency-Key') || '';
    const key = String(raw).trim();
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) return null;
    return key;
}

/**
 * Only Cash on Delivery and UPI are accepted. Card/Razorpay support has been
 * removed deliberately: the store's payment policy is COD + UPI only.
 */
function resolvePayment(method, paymentDetails, amount) {
    const normalized = String(method || 'COD').toUpperCase();

    if (normalized === 'COD') {
        return {
            success: true,
            method: 'Cash on Delivery',
            status: 'Processing',
            paymentStatus: 'cod_pending',
            transactionId: `COD_${crypto.randomUUID()}`,
        };
    }

    if (normalized === 'UPI') {
        const details = paymentDetails && typeof paymentDetails === 'object' ? paymentDetails : {};
        const claimedUpiId = String(details.upiId || '').trim().toLowerCase();
        if (claimedUpiId && claimedUpiId !== UPI_ID.toLowerCase()) {
            return {
                success: false,
                httpStatus: 400,
                msg: `Please pay to the Kamiwear UPI ID: ${UPI_ID}`,
            };
        }

        const utr = String(details.utr || details.upiTransactionRef || details.reference || '')
            .replace(/[\s-]+/g, '')
            .toUpperCase()
            .slice(0, 30);

        if (!/^[A-Z0-9]{8,30}$/.test(utr)) {
            return {
                success: false,
                httpStatus: 400,
                msg: 'Enter the UPI reference (UTR) shown in your payment app after paying',
            };
        }

        return {
            success: true,
            method: 'UPI',
            status: 'Payment pending verification',
            paymentStatus: 'pending_verification',
            transactionId: `UPI_${utr}`,
            utr,
            upiId: UPI_ID,
            amount,
        };
    }

    return {
        success: false,
        httpStatus: 400,
        msg: 'Only Cash on Delivery and UPI are accepted at checkout.',
    };
}

function publicOrder(order) {
    const raw = Order.serialize(order) || {};
    delete raw.__v;
    delete raw.idempotencyKey;
    delete raw.emailLastError;
    delete raw.pointsAwarded;
    return {
        ...raw,
        _id: String(raw._id || raw.id),
        id: String(raw._id || raw.id),
    };
}

function duplicateField(error) {
    if (!error || error.code !== 11000) return '';
    if (error.keyPattern) return Object.keys(error.keyPattern)[0] || '';
    const match = String(error.message || '').match(/index:\s+([A-Za-z0-9_]+)/);
    return match ? match[1] : '';
}

async function findExistingOrder(idempotencyKey, userId) {
    return Order.findByIdempotencyKey(idempotencyKey, userId);
}

async function insertOrder(orderData) {
    if (!require('../config/db').isMongoReady()) {
        const previous = jsonCreateQueue;
        let release;
        jsonCreateQueue = new Promise(resolve => { release = resolve; });
        await previous;
        try {
            return await Order.create(orderData);
        } finally {
            release();
        }
    }
    return Order.create(orderData);
}

const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const idempotencyKey = normalizeIdempotencyKey(req);

        if (!idempotencyKey) {
            return res.status(400).json({
                error: 'Missing or invalid idempotency key. Please refresh checkout and try again.',
                code: 'IDEMPOTENCY_KEY_REQUIRED',
            });
        }

        // Fast path: a retry after a dropped response returns the original
        // order instead of creating a second one.
        const existing = await findExistingOrder(idempotencyKey, userId);
        if (existing) {
            return res.status(200).json({
                success: true,
                duplicate: true,
                message: 'This order was already placed.',
                order: publicOrder(existing),
                email: { status: existing.emailStatus || 'pending', to: existing.shipping?.email || '' },
            });
        }

        const items = normalizeItems(req.body.items);
        const total = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

        if (!Number.isFinite(total) || total <= 0) {
            return res.status(400).json({ error: 'Invalid order total' });
        }

        const shipping = normalizeShipping(req.body.shipping);
        const method = req.body.paymentMethod || req.body.method || (req.body.paymentDetails && req.body.paymentDetails.method) || 'COD';
        const payment = resolvePayment(method, req.body.paymentDetails, total);

        if (!payment.success) {
            return res.status(payment.httpStatus || 400).json({
                error: payment.msg || 'Payment method is not available',
                code: 'PAYMENT_UNAVAILABLE',
            });
        }

        // A UPI reference can only belong to one order, even if the client
        // retries with a new idempotency key.
        if (payment.utr) {
            const usedUtr = await Order.findByUtr(payment.utr);
            if (usedUtr) {
                return res.status(409).json({
                    error: 'This UPI reference has already been used for another order.',
                    code: 'UPI_REFERENCE_USED',
                });
            }
        }

        const earnedPoints = Math.max(0, Math.floor(total / loyaltyRate()));
        const orderData = {
            userId: String(userId),
            items,
            totalAmount: total,
            idempotencyKey,
            transactionId: payment.transactionId,
            status: payment.status,
            paymentStatus: payment.paymentStatus,
            earnedPoints,
            pointsAwarded: false,
            paymentMethod: payment.method,
            shipping,
            emailStatus: 'pending',
            ...(payment.utr ? { utr: payment.utr } : {}),
            ...(payment.upiId ? { upiId: payment.upiId } : {}),
        };

        let order;
        try {
            order = await insertOrder(orderData);
        } catch (error) {
            const field = duplicateField(error);
            if (field === 'idempotencyKey') {
                const duplicate = await findExistingOrder(idempotencyKey, userId);
                if (duplicate) {
                    return res.status(200).json({
                        success: true,
                        duplicate: true,
                        message: 'This order was already placed.',
                        order: publicOrder(duplicate),
                        email: { status: duplicate.emailStatus || 'pending', to: duplicate.shipping?.email || '' },
                    });
                }
            }
            if (field === 'utr' || field === 'transactionId') {
                return res.status(409).json({
                    error: 'This payment reference has already been used for another order.',
                    code: 'PAYMENT_REFERENCE_USED',
                });
            }
            throw error;
        }

        // Award loyalty points after the durable insert. If this step fails the
        // order still exists and can be reconciled; it is never lost.
        try {
            await User.addKamiKoins(userId, earnedPoints);
            await Order.updateById(order._id, { pointsAwarded: true });
        } catch (error) {
            console.error('Order points update failed:', error.message);
        }

        // Email is best-effort: a provider outage must never cancel a paid or
        // confirmed order. The result is stored on the order for support.
        let emailResult = {
            sent: false,
            status: 'not_configured',
            provider: '',
            to: shipping.email,
            error: 'Email provider is not configured',
        };
        try {
            emailResult = await emailService.sendOrderConfirmation(order, req.user);
        } catch (error) {
            console.error('Order email error:', error.message);
            emailResult = {
                sent: false,
                status: 'failed',
                provider: emailService.getEmailProvider(),
                to: shipping.email,
                error: error.message,
            };
        }

        try {
            await Order.updateById(order._id, {
                emailStatus: emailResult.status,
                emailProvider: emailResult.provider || '',
                emailSentAt: emailResult.sent ? new Date() : null,
                emailLastError: String(emailResult.error || '').slice(0, 300),
            });
        } catch (error) {
            console.error('Could not store email status:', error.message);
        }

        const serialized = {
            ...Order.serialize(order),
            emailStatus: emailResult.status,
            emailProvider: emailResult.provider || '',
        };

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: publicOrder(serialized),
            email: {
                status: emailResult.status,
                to: emailResult.to || shipping.email,
            },
        });
    } catch (error) {
        const isValidation = /cart is empty|Invalid|Too many|missing|Please enter|not accepted/i.test(error.message);
        console.error('Create order error:', error.message);
        res.status(isValidation ? 400 : 500).json({
            error: isValidation ? error.message : 'Server error during order processing',
        });
    }
};

const getOrderHistory = async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 100));
        const orders = await Order.findByUser(String(req.user.id), limit);
        res.status(200).json({ orders: orders.map(publicOrder) });
    } catch (error) {
        console.error('Failed to fetch orders:', error.message);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};

function safeEqual(a, b) {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Manual UPI reconciliation. Protected by ADMIN_API_KEY; disabled entirely
 * when no admin key is configured so the endpoint cannot be probed.
 */
const verifyUpiPayment = async (req, res) => {
    try {
        const configuredKey = getAdminKey();
        const suppliedKey = req.get('x-admin-key') || '';
        if (!configuredKey || !safeEqual(suppliedKey, configuredKey)) {
            return res.status(404).json({ error: 'Not found' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (!/upi/i.test(String(order.paymentMethod || ''))) {
            return res.status(400).json({ error: 'This order is not a UPI order' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(200).json({ success: true, alreadyVerified: true, order: publicOrder(order) });
        }

        const updated = await Order.updateById(order._id, {
            paymentStatus: 'paid',
            status: 'Processing',
            verifiedAt: new Date(),
            verifiedBy: 'admin',
        });

        try {
            await emailService.sendPaymentVerifiedEmail(updated || order);
        } catch (error) {
            console.error('Payment verified email failed:', error.message);
        }

        res.status(200).json({ success: true, order: publicOrder(updated || order) });
    } catch (error) {
        console.error('Verify payment error:', error.message);
        res.status(500).json({ error: 'Server error verifying payment' });
    }
};

module.exports = { createOrder, getOrderHistory, verifyUpiPayment };
