const express = require('express');
const { loginUser, registerUser, getAllUsers } = require('../controller/authController');
const authenticateToken = require('../middlewares/authenticateToken');
const router = express.Router();

// Only authenticated users can access this route
router.get('/', authenticateToken, getAllUsers);

router.post('/login', loginUser);

router.post('/register', registerUser);

module.exports = router;
