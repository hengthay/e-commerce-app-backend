const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Get all user by Admin
const getAllUsersService = async () => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id');

    return result.rows;
  } catch (error) {
    console.log('Error to get all users', error);
    throw error;
  }
}

// Register user
const registerUserService = async (name, email, password) => {
  try {
    // Check if user exists by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const existingUser = result.rows[0];

    if(existingUser) {
      throw new Error('User already exists. Please use a different email.');
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database
    const insertResult = await pool.query(
      `
        INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *
      `, 
      [name, email, hashedPassword]
    );
    
    return insertResult.rows[0];
  } catch (error) {
    console.log('Unable to create user', error);
    throw error;
  }
};

// Login user
const loginUserService = async (email, password) => {
  try {
    // Check if user exists by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    const foundUser = result.rows[0];

    if(!foundUser) {
      throw new Error('User not found');
    }
    // Verify password
    const verifyPassword = await bcrypt.compare(password, foundUser.password);

    if(!verifyPassword) {
      throw new Error('Invalid password');
    }
    // Return user data without password
    const { password: _, ...userWithoutPassword } = foundUser;

    return userWithoutPassword;
  } catch (error) {
    console.log('Error logging in user', error.stack);
    throw error;
  }
};

module.exports = {
  getAllUsersService,
  registerUserService,
  loginUserService
};