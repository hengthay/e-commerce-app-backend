const express = require('express');
const { loginUser, registerUser, getAllAuthUsers } = require('../controller/authController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRoles = require('../middlewares/authorizeRoles');
const router = express.Router();

// Only authenticated users and admin can access this route
router.get('/', authenticateToken, authorizeRoles("admin") , getAllAuthUsers);

router.post('/login', loginUser);

router.post('/register', registerUser);

module.exports = router;
