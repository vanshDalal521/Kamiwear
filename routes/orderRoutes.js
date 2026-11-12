const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createOrder, getOrderHistory, verifyUpiPayment } = require('../controllers/orderController');
const { orderLimiter, sensitiveLimiter } = require('../middleware/rateLimit');

router.post('/create', auth, orderLimiter, createOrder);
router.get('/history', auth, getOrderHistory);
router.patch('/:id/verify-payment', sensitiveLimiter, verifyUpiPayment);

module.exports = router;
