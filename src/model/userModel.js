const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Get all user by Admin
const getAllUserService = async () => {
  try {
    const result = await pool.query('SELECT id, name, email, role, is_active FROM users ORDER BY id');

    if(!result.rows) throw new Error('No users found');

    return result.rows;
  } catch (error) {
    console.log("Error to get all users", error);
    throw error;
  }
}

// Get specific user by ID
const getUserByIdService = async (id) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1', [id]
    );

    if(!result.rows[0]) throw new Error(`User with ID ${id} not found`);

    return result.rows[0];
  } catch (error) {
    console.log("Error to get user by ID", error);
    throw error;
  }
}

// Get user profile by Id
const getUserProfileByIdService = async (id) => {
  try {
    const result = await pool.query(
      `
        SELECT 
          u.name,
          u.email,
          u.role,
          a.street,
          a.city,
          a.country,
          a.phone_number,
          a.postal_code
        FROM users as u
        LEFT JOIN addresses as a
          ON u.id = a.user_id
        WHERE u.id = $1
      `,
      [id]
    );

    if(!result.rows[0]) throw new Error(`User profile with ID ${id} not found`);

    return result.rows[0] || null;
  } catch (error) {
    console.log('Error to get user profile', error);
    throw error;
  }
}

// Update user profile and address
const updateUserProfileAddressService = async (id, name, street, city, country, postal_code, phone_number) => {

  const client = await pool.connect();

  try {
    console.log(`Received Data for update profile, userId:${id}, name:${name}, phone_number:${phone_number}, street:${street}, city:${city}, country:${country}, postal_code:${postal_code}`);

    if(!id) throw new Error('User id is required.');
    if(!name || !phone_number || !street || !city || !country || !postal_code) {
      return new Error('Invalid information! Name, Phone-number, Street, City, Country and Postal-Code is required');
    };

    // Begin the transaction
    await client.query('BEGIN');

    // Update username
    const updateUsername = await client.query(
      `
        UPDATE users
        SET name = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, name
      `,
      [name, id]
    );

    if(updateUsername.rowCount === 0) throw new Error('Failed to update username'); 
    const updateUser = updateUsername.rows[0];

    // Upadate user address of shipping
    const updateUserAddress = await client.query(
      `
        UPDATE addresses
        SET street = $1,
            city = $2,
            country = $3,
            postal_code = $4,
            phone_number = $5,
            updated_at = NOW()
        WHERE user_id = $6
        RETURNING *;
      `,
      [street, city, country, postal_code, phone_number, id]
    )
    // Store userAddress
    let address;

    if(updateUserAddress.rowCount === 0) {
      // Insert new address in case you address not exisits.
      const insertAddress = await client.query(
        `
          INSERT INTO addresses (
              user_id, 
              street, 
              city, 
              country, 
              postal_code,
              phone_number, 
              created_at, 
              updated_at
            )
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING *;
        `,
        [id, street, city, country, postal_code, phone_number]
      );

      address = insertAddress.rows[0];
    }else {
      address = updateUserAddress.rows[0];
    }

    await client.query('COMMIT');

    console.log('User Profile and Address Updated successful.');
    return {
      user: updateUser,
      address,
    }
  } catch (error) {
    await client.query('ROLLBACK')
    console.log('Error to update user profile ', error);
    throw error;
  } finally {
    client.release();
  }
}
// Update User Profile
// Allow user to update only their name, email, and password they cannot update role or timestamps
const updateUserProfileService = async (id, name, email, password) => {
  try {
    // field storings data such as name = $1, email = $2, etc.
    // value storings actual values to be updated such as 'John Doe', 'john@example.com', 'hashed_password'
    // Help to build dynamic query based on provided fields
    const field = [];
    const value = [];
    let index = 1;
    // Check if name, email, or password is provided for update  
    if(name) {
      field.push(`name = $${index}`);
      value.push(name);
      index++;
    }

    if(email) {
      field.push(`email = $${index}`);
      value.push(email);
      index++;
    }

    if(password) {
      // Hash the password before updating.
      const hashedPassword = await bcrypt.hash(password, 10);
      field.push(`password = $${index}`);
      value.push(hashedPassword);
      index++;
    }

    if(field.length === 0) {
      throw new Error('No fields provided for update');
    }

    const result = await pool.query(
      `UPDATE users
       SET ${field.join(', ')},
       updated_at = NOW()
       WHERE id = $${index}
       RETURNING *`,
      //  ...value spreads the array values into individual elements 'Jonh Doe', 'jonh@example.com', 'hashed_password'
       [...value, id]
    );

    if(!result.rows[0]) throw new Error('Failed to update profile');

    return result.rows[0];
  } catch (error) {
    console.log('Unable to updated profile', error);
    throw error;
  }
}

const deleteUserProfileService = async (id) => {
  try {
    const result = await pool.query(
      `UPDATE users
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *` ,
      [id]
    );

    if(!result.rows[0]) throw new Error('Failed to deactivate user');

    return result.rows[0];
  } catch (error) {
    console.log(`Unable to deactivate user with ID:${id}`, error);
    throw error;
  }
}

// Update profile for admin
const updateUserProfileByAdminService = async (id, name, email, password, role) => {
  try {
    // field storings data such as name = $1, email = $2, etc.
    // value storings actual values to be updated such as 'John Doe', 'john@example.com', 'hashed_password'
    // Help to build dynamic query based on provided fields
    const field = [];
    const value = [];
    let index = 1;
    // Check if name, email, or password is provided for update  
    if(name) {
      field.push(`name = $${index}`);
      value.push(name);
      index++;
    }

    if(email) {
      field.push(`email = $${index}`);
      value.push(email);
      index++;
    }

    if(password) {
      // Hash the password before updating.
      const hashedPassword = await bcrypt.hash(password, 10);
      field.push(`password = $${index}`);
      value.push(hashedPassword);
      index++;
    }

    if(role) {
      field.push(`role = $${index}`);
      value.push(role);
      index++;
    }

    if(field.length === 0) {
      throw new Error('No fields provided for update');
    }

    const result = await pool.query(
      `UPDATE users
       SET ${field.join(', ')},
       updated_at = NOW()
       WHERE id = $${index}
       RETURNING *`,
      //  ...value spreads the array values into individual elements 'Jonh Doe', 'jonh@example.com', 'hashed_password'
       [...value, id]
    );

    if(!result.rows[0]) throw new Error('Admin failed to update profile');

    return result.rows[0];
  } catch (error) {
    console.log('Admin error to updating profile', error);
    throw error;
  }
}

// Delete profile by admin
const deleteUserProfileByAdminService = async (id) => {
  try {
    const result = await pool.query(
      `UPDATE users
      SET is_active = false,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [id]
    );

    if(!result.rows[0]) throw new Error('Admin error to deleting profile');

    return result.rows[0];
  } catch (error) {
    console.log('Admin error to deleting profile', error);
    throw error;
  }
}

module.exports = { 
  getAllUserService,
  getUserByIdService,
  updateUserProfileService,
  deleteUserProfileService,
  updateUserProfileByAdminService,
  deleteUserProfileByAdminService,
  getUserProfileByIdService,
  updateUserProfileAddressService
};