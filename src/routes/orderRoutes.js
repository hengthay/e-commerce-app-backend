const express = require('express');
const { getAllOrders, getOrdersByUserId, placeOrder } = require('../controller/orderController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRoles = require('../middlewares/authorizeRoles');
const router = express.Router();

// For admin only
router.get('/', authenticateToken, authorizeRoles('admin'), getAllOrders);

// For user who logged in only
router.get('/my', authenticateToken, authorizeRoles('user'), getOrdersByUserId);

router.post('/checkout', authenticateToken, authorizeRoles('user', 'admin'), placeOrder);

router.put('/:orderId/status', (req, res) => {
  res.send(`Update status of order with ID: ${req.params.orderId} placeholder`);
});

module.exports = router;