const pool = require('../config/db');

// Implement on Product Model
// Get all the products
const getAllProductsService = async () => {
  try {
    const result = await pool.query(
      `
        SELECT 
          p.id,
          p.title,
          p.price,
          p.stock,
          p.image_url,
          p.created_at,
          p.updated_at,
          p.category_id,
          c.type 
        FROM products as p
        JOIN categories as c
          ON p.category_id = c.id
      `
    );

    if(!result.rows) throw new Error('No products found');

    return result.rows;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get recommended products with only 8 items
const getRecommendedProductsService = async (type) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.price,
        p.stock,
        p.image_url,
        p.description,
        c.type
      FROM products as p
      JOIN categories as c
        ON p.category_id = c.id
      WHERE c.type = $1
      LIMIT 8`,
      [type]
    );

    if(!result.rows) throw new Error('No recommended products found');

    return result.rows;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get indiviual product by ID
const getProductByIdService = async (id) => {
  try {
    const result = await pool.query(
      `
        SELECT 
          p.id,
          p.title,
          p.price,
          p.stock,
          p.image_url,
          p.description,
          p.created_at,
          p.updated_at,
          p.category_id,
          c.type 
        FROM products as p
        JOIN categories as c
          ON p.category_id = c.id
        WHERE p.id = $1
      `
      , [id]
    );

    if(!result.rows[0]) throw new Error('Product not found');

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

const createProductService = async (title, price, stock, image_url, description, category_id) => {
  try {
    const result = await pool.query(`
      INSERT INTO products(title, price, stock, image_url, description, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, 
      [title, price, stock, image_url, description, category_id]
    );

    if(!result.rows[0]) throw new Error('Failed to create product');

    return result.rows[0];
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

const updateProductService = async (id, title, price, stock, image_url, description, category_id) => {
  try {
    const result = await pool.query(
      `UPDATE products
       SET title = $1,
           price = $2,
           stock = $3,
           image_url = $4,
           description = $5,
           category_id = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, price, stock, image_url, description, category_id, id]
    );

    if (!result.rows[0]) throw new Error('Failed to update product');

    return result.rows[0];
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

const deleteProductService = async (id) => {
  try {
    const result = await pool.query(`
      DELETE FROM products WHERE id = $1
      RETURNING *`,
      [id]
    );

    if(!result.rows[0]) throw new Error('Failed to delete product');

    return result.rows[0];
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

module.exports = {
  getAllProductsService,
  getRecommendedProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService
};