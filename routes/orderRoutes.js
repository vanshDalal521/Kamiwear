const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createOrder, getOrderHistory } = require('../controllers/orderController');

router.post('/create', auth, createOrder);
router.get('/history', auth, getOrderHistory);

module.exports = router;
