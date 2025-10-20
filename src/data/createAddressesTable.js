const pool = require('../config/db');

const createAddressesTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      street VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20) NOT NULL,
      phone_number VARCHAR(30),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  ;

  try {
    await pool.query(queryText);
    console.log("Addresses table created successfully");
  } catch (error) {
    console.log("Error creating addresses table: ", error)
  }
};

module.exports = createAddressesTable;
