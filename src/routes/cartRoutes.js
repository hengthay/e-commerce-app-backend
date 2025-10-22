const express = require('express');
const { getCartsByUserId, addProductToCart } = require('../controller/cartController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRoles = require('../middlewares/authorizeRoles');

const router = express.Router();

router.get('/', authenticateToken, getCartsByUserId);

router.post('/add', authenticateToken, authorizeRoles('user', 'admin'), addProductToCart);

router.put('/update/:itemId', (req, res) => {
  res.send(`Update cart item with ID: ${req.params.itemId}`);
})

router.delete('/remove/:itemId', (req, res) => {
  res.send(`Remove cart item with ID: ${req.params.itemId}`);
});

module.exports = router;