const User = require('../models/userModel');
const Order = require('../models/orderModel');

// Professional "Banking" Simulation Logic
const BankingSystem = {
    verifyPayment: async (paymentDetails, amount) => {
        // Simulated professional check:
        // 1. Validate card number format (Luhn algorithm style - simplified)
        // 2. Mock communication with payment gateway
        // 3. Return success/failure based on mock logic

        console.log(`[Banking] Processing payment of ₹${amount}...`);

        // Simulate latency for professional feel
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { cardNumber, expiry, cvc } = paymentDetails;

        if (!cardNumber || cardNumber.length < 13) return { success: false, msg: 'Invalid card number' };
        if (!expiry || !expiry.includes('/')) return { success: false, msg: 'Invalid expiry date' };
        if (!cvc || cvc.length < 3) return { success: false, msg: 'Invalid CVC' };

        // Randomly fail 5% of the time for "realism" (but here we'll just succeed for the user)
        return { success: true, transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
    },

    processKamiKoin: async (userId, orderTotal) => {
        // 1 KamiKoin per ₹10 spent
        const earned = Math.floor(orderTotal / 10);
        
        try {
            const users = await User.getAll();
            const user = users.find(u => u._id === userId || u.id === userId);
            
            if (user) {
                // To save, we need to use findOne to get a UserInstance
                const userInstance = await User.findOne({ email: user.email });
                if(userInstance) {
                    userInstance.kamiKoins = (userInstance.kamiKoins || 0) + earned;
                    const totalPoints = userInstance.kamiKoins;
                    
                    if (totalPoints > 1000) userInstance.tier = 'Kage';
                    else if (totalPoints > 500) userInstance.tier = 'Jonin';
                    else if (totalPoints > 200) userInstance.tier = 'Chunin';

                    await userInstance.save();
                    return earned;
                }
            }
        } catch(e) {
            console.error("Error processing KamiKoins:", e);
        }
        return 0;
    }
};

const createOrder = async (req, res) => {
    try {
        const { items, total, paymentDetails, useKamiKoins } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0 || !total) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        // 1. Verify Payment via Banking System
        const paymentResult = await BankingSystem.verifyPayment(paymentDetails, total);

        if (!paymentResult.success) {
            return res.status(402).json({ error: 'Payment Failed', details: paymentResult.msg });
        }

        // 2. Process Loyalty Points
        const earnedPoints = await BankingSystem.processKamiKoin(userId, total);

        // 3. Generate Order and Persist
        const orderData = {
            userId,
            items,
            totalAmount: total,
            transactionId: paymentResult.transactionId,
            status: 'Processing',
            earnedPoints,
            paymentMethod: 'Card'
        };

        const newOrder = await Order.create(orderData);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully! Wearing the anime now.',
            order: newOrder
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during order processing' });
    }
};

const getOrderHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.findByUser(userId);
        res.status(200).json({ orders });
    } catch(err) {
        console.error("Failed to fetch orders", err);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
};

module.exports = { createOrder, getOrderHistory };
