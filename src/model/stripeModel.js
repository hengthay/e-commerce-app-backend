const pool = require('../config/db');

// Find order by id
const findOrderById = async (orderId) => {
  try {
    // Query to get orders where id matching
    const result = await pool.query(
      `
        SELECT * 
        FROM orders 
        WHERE id = $1
      `,
      [orderId]
    );
    // If not found
    if(!result.rows[0]) {
      console.log('Order ID not found');
      throw new Error('Order ID not found');
    }
    // Return first element.
    return result.rows[0];
  } catch (error) {
    console.log('Error to find order id', error);
    throw error;
  }
}

// Mark Order Paid and update payment_status to paid if success.
const markOrderPaid = async ({ orderId, provider, providerRef, paymentStatus = 'paid' }) => {
  try {
    // Query to update payment
    const result = await pool.query(
      `
        UPDATE orders
        SET payment_provider = $1,
            payment_ref = $2,
            payment_status = $3,
            status = 'paid',
            updated_at = NOW()
        WHERE id = $4
        RETURNING *;
      `,
      [provider, providerRef, paymentStatus, orderId]
    )
    // If not found
    if(!result.rows[0]) {
      console.log('Error to make order paid');
      throw new Error(`Error to make order paid with orderId: ${orderId}`)
    }
    // Return first element.
    return result.rows[0];
  } catch (error) {
    console.log('Erorr to make order paid');
    throw error;
  }
};

module.exports = {
  findOrderById,
  markOrderPaid
}