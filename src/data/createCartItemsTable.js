const pool = require('../config/db');

const createCartItemsTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      cart_id INT REFERENCES carts(id),
      product_id INT REFERENCES products(id),
      quantity INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  ;

  try {
    await pool.query(queryText);
    console.log("Cart items table created successfully");
  } catch (error) {
    console.log("Error creating cart items table: ", error)
  }
};

module.exports = createCartItemsTable;