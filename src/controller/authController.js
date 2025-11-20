const { registerUserService, loginUserService, getAllUsersService, findOrCreateGoogleUserService } = require("../model/authModel");
const jwt = require('jsonwebtoken');
const handleResponse = require('../utils/handleResponse');
const verifyIdToken = require("../middlewares/authenticateGoogle");
// Handle API responses

const getAllAuthUsers = async (req, res, next) => {
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
  const { name, email, password} = req.body;

  try {
    const newUser = await registerUserService(name, email, password);

    if(!newUser) handleResponse(res, 400, 'User registration failed');
    
    console.log('New User---', newUser);
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
    console.log('User role: ',loggedInUser.role);
    console.log(loggedInUser)
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

// Google signin 
const findOrCreateGoogleUser = async (req, res, next) => {
  try {
    // client send idtoken from req.body
    const { idToken } = req.body;
    // console.log('Frontend idToken: ', idToken);
     // Add validation
    if (!idToken) {
      return handleResponse(res, 400, 'idToken is missing');
    }
    // Verify token
    const payload = await verifyIdToken(idToken);
    console.log('Payload google', payload);
    const { sub, email, name, picture } = payload;

    // Find or create user
    const user = await findOrCreateGoogleUserService(sub, email, name, picture);

    if(!user) return handleResponse(res, 400, 'Google Login failed');

    // Sign JWT Token
    const token = jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    console.log('User Google: ' ,user);
    return handleResponse(res, 200, 'Google Login successful', 
      { user: user, 
        token 
      }
    );
  } catch (error) {
    console.error('Google login error:', error);
    return handleResponse(res, 500, 'Internal server error', { error: error.message }); 
  }
}

module.exports = {
  handleResponse,
  getAllAuthUsers,
  registerUser,
  loginUser,
  findOrCreateGoogleUser
}