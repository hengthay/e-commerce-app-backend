const { registerUserService, loginUserService, getAllUsersService } = require("../model/authModel");
const jwt = require('jsonwebtoken');

// Handle API responses
const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({
    status,
    message,
    data
  })
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();
    console.log('Users----------', users);

    if(!users) return handleResponse(res, 404, 'No users found');

    return handleResponse(res, 200, 'Users retrieved successfully', users);

  } catch (error) {
    next(error);
  }
};

// Register a new user
const registerUser = async (req, res, next) => {
  const { name, email, password, role} = req.body;

  try {
    const newUser = await registerUserService(name, email, password, role);

    if(!newUser) handleResponse(res, 400, 'User registration failed');

    
    return handleResponse(res, 201, 'User registered successfully', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

  } catch (error) {
    console.log('Error registering user:', error);
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const loggedInUser = await loginUserService(email, password);

    if(!loggedInUser) return handleResponse(res, 400, 'Login failed');

    // Sign JWT Token
    const token = jwt.sign({
        id: loggedInUser.id,
        email: loggedInUser.email,
        name: loggedInUser.name,
        role: loggedInUser.role
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    return handleResponse(res, 200, 'Login successful', 
      { user: loggedInUser, 
        token 
      }
    );
  } catch (error) {
    console.log('Error logging in user:', error);
    next(error);
  }
};

module.exports = {
  handleResponse,
  getAllUsers,
  registerUser,
  loginUser
}