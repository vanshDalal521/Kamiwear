const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createOrder, getOrderHistory, createRazorpayOrder } = require('../controllers/orderController');

router.post('/create', auth, createOrder);
router.get('/history', auth, getOrderHistory);
router.post('/razorpay/create', auth, createRazorpayOrder);

module.exports = router;
