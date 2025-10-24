const pool = require('../config/db');

const createOrdersTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      total_amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      shipping_address_id INT REFERENCES addresses(id) NOT NULL,
      billing_address_id INT REFERENCES addresses(id) NOT NULL
    )`
  ;

  try {
    await pool.query(queryText);
    console.log("Orders table created successfully");
  } catch (error) {
    console.log("Error creating orders table: ", error)
  }
};

module.exports = createOrdersTable;
