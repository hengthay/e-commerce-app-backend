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

// Google Signin
const findOrCreateGoogleUserService = async (google_id, email, name, avatar) => {
  try {
    // Finding user by google_id
    let result = await pool.query(
      ` 
        SELECT * FROM users 
        WHERE google_id = $1
      `,
      [google_id]
    );
    
    // If found user
    if(result.rows.length) return result.rows[0];

    // If google_id not found, check if email exists (user registered earlier by email/password)
    result = await pool.query(
      `
        SELECT * FROM users 
        WHERE email = $1
      `,
      [email]
    )

    if(result.rows.length > 0) {
      const updateUser = await pool.query(
        `
          UPDATE users
          SET google_id = $1, 
              avatar = $2,
              updated_at = now()
          WHRER email = $3
          RETURNING *;
        `,
        [google_id, avatar, email]
      );

      return updateUser.rows[0];
    }

    // if not found at all, create new google user
    const insertRes = await pool.query(
      `
        INSERT INTO users (name, email, google_id, avatar, created_at)
        VALUES ($1, $2, $3, $4, now())
        RETURNING *;
      `,
      [name, email, google_id, avatar]
    );

    return insertRes.rows[0];

  } catch (error) {
    console.log('Error to find or create google user: ', error);
    throw error;
  }
}
module.exports = {
  getAllUsersService,
  registerUserService,
  loginUserService,
  findOrCreateGoogleUserService
};