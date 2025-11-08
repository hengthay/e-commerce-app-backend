const express = require('express');
const bodyParser = require('body-parser')
const authenticateToken = require('../middlewares/authenticateToken');
const { createPaymentIntent, handleWebhook } = require('../controller/stripeController');
const router = express.Router();

// Protected route: create a PaymentIntent for an order
router.post('/stripe/create-payment-intent', authenticateToken, express.json(), createPaymentIntent);

// Webhook route: must use raw body to verify signature
router.post('/stripe/webhook', bodyParser.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;