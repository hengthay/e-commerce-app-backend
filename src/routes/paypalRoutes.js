const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');
const { createOrder, captureOrder, finalizeOrder, getOrderDetails } = require('../controller/paypalController');

router.post('/paypal/create-order', authenticateToken, createOrder);
router.post('/paypal/capture-order/:orderId', authenticateToken , captureOrder);
router.post('/paypal/orders/finalize', authenticateToken, finalizeOrder);
router.get('/paypal/orders/:orderId', authenticateToken, getOrderDetails);

module.exports = router;