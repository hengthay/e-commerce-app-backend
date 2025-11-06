const pool = require('../config/db');

// Compute the total for a user from carts
const computeCartTotalForUserService = async (userId) => {
  const client = await pool.connect();
  try {
    // Query to get the quantity and price from db
    const cartResult = await client.query(
      `
        SELECT
        ci.quantity,
        p.price AS product_price
        FROM carts AS c
        JOIN cart_items AS ci ON c.id = ci.cart_id
        JOIN products AS p ON ci.product_id = p.id
        WHERE c.user_id = $1 AND c.is_active = TRUE
        ORDER BY p.id ASC
      `,
      [userId]
    );
    // If no carts found
    if(!cartResult.rows.length) return {totalDecimal: 0, formatted: "0.00"};
    // core reduce logic (ensure product_price used and parsed safely)
    const totalDecimal = cartResult.rows.reduce((acc, item) => {
      const price = Number(item.product_price); // coerce; invalid -> NaN
      const qty   = Number(item.quantity);
      const p = isNaN(price) ? 0 : price;
      const q = isNaN(qty)   ? 0 : qty;
      return acc + (p * q);
    }, 0);
    if (isNaN(totalDecimal)) {
      console.error('computeCartTotalForUserService: NaN total', { userId, rows: cartResult.rows });
    }
    // Return totalDecimal price and formatted
    return { totalDecimal, formatted: totalDecimal.toFixed(2)};
  } catch (error) {
    console.log('Error to computeCart');
    throw error;
  }finally {
    client.release();
  }
}

// Check to find if an order is exists
const findOrderByPaymentService = async (provider, paymentRef) => {
  const client = await pool.connect();
  try {
    // Query to get payment_provider and payment_ref from db
    const result = await client.query(
      `
        SELECT *
        FROM orders 
        WHERE payment_provider = $1 AND payment_ref = $2
      `,
      [provider, paymentRef]
    )
    // If not found the payment_provider or payment_ref
    if(!result) return new Error('Not found any payment provider or ref');
    // Return first rows of it.
    return result.rows[0] || null;
  } catch (error) {
    console.log('Error to find an order by payment')
    throw error;
  } finally {
    client.release();
  }
}

// Update an orders payments field
const updateOrderPaymentService = async (orderId, provider, paymentRef, paymentStatus = 'completed') => {
  const client = await pool.connect();
  try {
    // Query to update the payment
    await client.query(
      `
        UPDATE orders 
        SET payment_provider = $1, 
            payment_ref = $2, 
            payment_status = $3 
        WHERE id = $4`,
      [provider, paymentRef, paymentStatus, orderId]
    );
    return true;
  } finally {
    client.release();
  }
}

module.exports = {
  computeCartTotalForUserService,
  findOrderByPaymentService,
  updateOrderPaymentService
}