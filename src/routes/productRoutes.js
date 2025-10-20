const express = require('express');
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controller/productController');
const authorizeRoles = require('../middlewares/authorizeRoles');
const authenticateToken = require('../middlewares/authenticateToken');
const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authenticateToken, authorizeRoles('admin'),createProduct);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateProduct);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteProduct);

module.exports = router;