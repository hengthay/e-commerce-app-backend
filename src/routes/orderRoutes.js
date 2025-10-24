const express = require('express');
const { getAllOrders, getOrdersByUserId, placeOrder, updateOrderStatusByAdmin } = require('../controller/orderController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRoles = require('../middlewares/authorizeRoles');
const router = express.Router();

// For admin only
router.get('/', authenticateToken, authorizeRoles('admin'), getAllOrders);

// For user who logged in only
router.get('/my', authenticateToken, authorizeRoles('user'), getOrdersByUserId);

// For placing order
router.post('/checkout', authenticateToken, authorizeRoles('user', 'admin'), placeOrder);

// Update order status (admin only)
router.patch('/:orderId/status', authenticateToken, authorizeRoles('admin'), updateOrderStatusByAdmin);

module.exports = router;