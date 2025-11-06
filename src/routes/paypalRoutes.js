const express = require('express');
const router = express();
const authenticateToken = require('../middlewares/authenticateToken');
const { createOrder, captureOrder, finalizeOrder, getOrderDetails } = require('../controller/paypalController');

router.post('/payments/paypal/create-order', authenticateToken, createOrder);
router.post('/payments/paypal/capture-order/:orderId', authenticateToken , captureOrder);
router.post('/orders/finalize', authenticateToken, finalizeOrder);
router.get('/payments/paypal/orders/:orderId', authenticateToken, getOrderDetails);

module.exports = router;