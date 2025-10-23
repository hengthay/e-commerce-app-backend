const pool = require('../config/db');

// Get all orders
const getAllOrdersService = async () => {

  const client = await pool.connect();

  try {
    // BEGIN the transaction
    await client.query('BEGIN');

    const result = await client.query(
      `
        SELECT 
          o.id as order_id,
          u.name as customer_name,
          u.email as customer_email,
          p.title as product_title,
          p.price as product_price,
          oi.quantity as product_quantity,
          o.total_amount,
          o.status,
          o.created_at as order_date
        FROM orders as o
        JOIN users as u
          ON o.user_id = u.id
        JOIN order_items as oi
          ON o.id = oi.order_id
        JOIN products as p
          ON oi.product_id = p.id
        ORDER BY o.created_at DESC
      `
    )
    
    if(!result.rows) {
      throw new Error('No orders found');
    }
    
    const orders = {
      orderId: result.rows[0].order_id,
      customerName: result.rows[0].customer_name,
      customerEmail: result.rows[0].customer_email,
      items: result.rows.map(row => ({
        product_title: row.product_title,
        product_price: row.product_price,
        product_quantity: row.product_quantity,
        total_amount: row.total_amount,
        status: row.status,
        order_date: row.order_date,
      }))
    }
    console.log('Admin retrived all orders ----', orders)
    // COMMIT transaction
    await client.query('COMMIT');

    return orders;
  } catch (error) {
    console.log('Error to get all orders: ', error.stack);
    throw error;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

// Get all orders by userId
const getOrdersByUserIdService = async (userId) => {
  const client = await pool.connect();
  try {
    console.log('User ID in orders: ', userId);

    if(!userId) {
      throw new Error('Invalid userId');
    };

    // BEGIN the transaction
    await client.query('BEGIN');

    const result = await client.query(
      `
        SELECT 
          o.id as order_id,
          u.name as customer_name,
          u.email as customer_email,
          p.title as product_title,
          p.price as product_price,
          oi.quantity as product_quantity,
          o.total_amount,
          o.status,
          o.created_at as order_date 
        FROM orders as o
        JOIN users as u
          ON o.user_id = u.id
        JOIN order_items as oi
          ON o.id = oi.order_id
        JOIN products as p
          ON oi.product_id = p.id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
      `,
      [userId]
    );

    if(!result.rows) {
      throw new Error('No orders found');
    }
    
    const userOrders = {
      orderId: result.rows[0].order_id,
      customerName: result.rows[0].customer_name,
      customerEmail: result.rows[0].customer_email,
      items: result.rows.map(row => ({
        product_title: row.product_title,
        product_price: row.product_price,
        product_quantity: row.product_quantity,
        total_amount: row.total_amount,
        status: row.status,
        order_date: row.order_date,
      }))
    }
    console.log('User retrived all orders ----', userOrders);
    // COMMIT transaction
    await client.query('COMMIT');

    return userOrders;
  } catch (error) {
    console.log(`Error to get orders by userId: ${userId}`, error.stack);
    throw error;
  }
}

module.exports = {
  getAllOrdersService,
  getOrdersByUserIdService
}