const pool = require('../config/db');

const createCategoriesTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  ;

  try {
    await pool.query(queryText);
    console.log("Categories table created successfully");
  } catch (error) {
    console.log("Error creating categories table: ", error)
  }
};

module.exports = createCategoriesTable;
