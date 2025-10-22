const pool = require('../config/db');

const createCartsTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS carts (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  ;

  try {
    await pool.query(queryText);
    console.log("Carts table created successfully");
  } catch (error) {
    console.log("Error creating carts table: ", error)
  }
};

module.exports = createCartsTable;