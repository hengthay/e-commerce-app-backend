const express = require('express');
const { getAllUser, getUserById, updateUserProfileByAdmin, deleteUserProfileByAdmin, updateUserProfile, deleteUserProfile } = require('../controller/userController');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRoles = require('../middlewares/authorizeRoles');
const router = express.Router();

// Normal user who get access to update and delete their profile
// Place these before '/:id' so 'profile' is not captured as an id param
router.put('/profile', authenticateToken, authorizeRoles('user'), updateUserProfile);
router.delete('/profile', authenticateToken, authorizeRoles('user'), deleteUserProfile);

// Only Admin who can performance on these routes (protected route)
router.get('/', authenticateToken, authorizeRoles("admin"), getAllUser);
router.get('/:id', authenticateToken, authorizeRoles("admin"), getUserById);
router.put('/:id', authenticateToken, authorizeRoles("admin"), updateUserProfileByAdmin);
router.delete('/:id', authenticateToken, authorizeRoles("admin"), deleteUserProfileByAdmin);

module.exports = router;