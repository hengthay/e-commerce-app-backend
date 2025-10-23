const express = require('express');
const { getCartsByUserId, addProductToCart, updateCartItemQuantity, removeCartItemQuantity, deleteItemInCartById } = require('../controller/cartController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRoles = require('../middlewares/authorizeRoles');

const router = express.Router();

router.get('/', authenticateToken, getCartsByUserId);

router.post('/add', authenticateToken, authorizeRoles('user', 'admin'), addProductToCart);

router.put('/update/:productId', authenticateToken, authorizeRoles('user', 'admin'), updateCartItemQuantity)

router.put('/remove/:productId', authenticateToken, authorizeRoles('user', 'admin'), removeCartItemQuantity);

router.delete('/delete/:productId', authenticateToken, authorizeRoles('user', 'admin'), deleteItemInCartById);

module.exports = router;