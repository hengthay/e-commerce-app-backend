const pool = require('../config/db');

const createOrderItemsTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT REFERENCES orders(id),
      product_id INT REFERENCES products(id),
      quantity INT NOT NULL CHECK (quantity > 0),
      price_at_purchase NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  ;

  try {
    await pool.query(queryText);
    console.log("Orders table created successfully");
  } catch (error) {
    console.log("Error creating orders table: ", error)
  }
};

module.exports = createOrderItemsTable;
