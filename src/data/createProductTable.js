const pool = require('../config/db');

const createProductTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      stock INT not null CHECK(stock > 0),
      image_url TEXT,
      description TEXT default 'No description available',
      category_id INT REFERENCES categories(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  ;

  try {
    await pool.query(queryText);
    console.log("Products table created successfully");
  } catch (error) {
    console.log("Error creating products table: ", error)
  }
};

module.exports = createProductTable;