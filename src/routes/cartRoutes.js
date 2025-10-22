const express = require('express');
const { getCartsByUserId, addProductToCart, updateCartItemQuantity } = require('../controller/cartController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRoles = require('../middlewares/authorizeRoles');

const router = express.Router();

router.get('/', authenticateToken, getCartsByUserId);

router.post('/add', authenticateToken, authorizeRoles('user', 'admin'), addProductToCart);

router.put('/update/:productId', authenticateToken, authorizeRoles('user', 'admin'), updateCartItemQuantity)

router.delete('/remove/:itemId', (req, res) => {
  res.send(`Remove cart item with ID: ${req.params.itemId}`);
});

module.exports = router;