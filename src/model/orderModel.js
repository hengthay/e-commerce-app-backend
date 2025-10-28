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
    
    if(result.rows.length === 0) {
      return null;
    }

    // Group rows by order_id 
    const ordersMap = {};
    // loop throught all result rows
    result.rows.forEach(row => {
      const orderId = row.order_id;
      // Check if that order is already addded
      if(!ordersMap[orderId]) {
        // If it not exists we add orderId with an object of data
         ordersMap[orderId] = {
          orderId: orderId,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          totalAmount: Number(row.total_amount),
          status: row.status,
          orderDate: row.order_date,
          items: []
        };
      }

      // Push product item into this order
      ordersMap[orderId].items.push({
        product_title: row.product_title,
        product_price: Number(row.product_price),
        product_quantity: Number(row.product_quantity)
      });
    })

    // Convert grouped object into array values
    const orders = Object.values(ordersMap);
    console.log('Admin retrieved all orders ----', orders)
    // COMMIT transaction
    await client.query('COMMIT');

    return orders;
  } catch (error) {
    await client.query('ROLLBACK');
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

    if(result.rows.length === 0) {
      return null;
    }

    // Group rows by order_id for this user
    const ordersMap = new Map();
    for (const row of result.rows) {
      const orderId = Number(row.order_id);
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          orderId,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          total_amount: Number(row.total_amount),
          status: row.status,
          order_date: row.order_date,
          items: []
        });
      }
      const order = ordersMap.get(orderId);
      order.items.push({
        product_title: row.product_title,
        product_price: Number(row.product_price),
        product_quantity: Number(row.product_quantity)
      });
    }

    const userOrders = Array.from(ordersMap.values());
    console.log('User retrieved all orders ----', userOrders);
    // COMMIT transaction
    await client.query('COMMIT');

    return userOrders;
  } catch (error) {
    await client.query('ROLLBACK');
    console.log(`Error to get orders by userId: ${userId}`, error.stack);
    throw error;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

// Implement place order
const placeOrderService = async (userId, street, city, country, postal_code, phone_number) => {
  const client = await pool.connect();
  try {
    console.log('User ID in orders: ', userId);

    console.log(`Receive Address of Order St-${street}, City-${city}, Country-${country}, Postal-code-${postal_code} and Phone-number-${phone_number}`)

    if(!userId) {
      throw new Error('Invalid userId to make place order');
    };

    // BEGIN the transaction
    await client.query('BEGIN');

    // Insert Shipping Address and get ID of it
    const shippingResult = await client.query(
      `
        INSERT INTO addresses (user_id, street, city, country, postal_code, phone_number)
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `,
      [userId, street, city, country, postal_code, phone_number]
    )

    if(shippingResult.rows.length === 0) {
      throw new Error('Failed to insert address shipping address');
    };

    // Store shipping_address_id
    const shippingAddressId = shippingResult.rows[0].id;

    // Insert Billing Address to get ID of it
    const billingResult = await client.query(
      `
        INSERT INTO addresses (user_id, street, city, country, postal_code, phone_number)
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `,
      [userId, street, city, country, postal_code, phone_number]
    )

    if(billingResult.rows.length === 0) {
      throw new Error('Failed to insert address billing address');
    };

    // Store shipping_address_id
    const billingAddressId = billingResult.rows[0].id;
    
    // 1. Get cart items for the user
    const cartResult = await client.query(
      `
        SELECT 
          c.id as cart_id,
          ci.product_id,
          ci.quantity,
          p.price
        FROM carts as c
        JOIN cart_items as ci
          ON c.id = ci.cart_id
        JOIN products as p
          ON ci.product_id = p.id
        WHERE c.user_id = $1 and c.is_active = TRUE
      `,
      [userId]
    );

    if(cartResult.rows.length === 0) {
      throw new Error('No active cart or items found.');
    };

    // 2. Calculate total amount
    const totalAmount = cartResult.rows.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    console.log('Total Amount: ', totalAmount);

    // 3. Create a new order
    const orderResult = await client.query(
      `
        INSERT INTO orders (user_id, total_amount, shipping_address_id, billing_address_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [userId, totalAmount, shippingAddressId, billingAddressId]
    );

    if(orderResult.rows.length === 0) {
      throw new Error('Failed to create order.');
    }

    // Store orderId
    const orderId = orderResult.rows[0].id;
    console.log('Order ID: ', orderId);

    // 4. Insert order items
    for(const item of cartResult.rows) {
      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4)
      `,
      [orderId, item.product_id, item.quantity, item.price]
      );
    };

    // 5. Deactivate the cart
    await client.query(
      `
        UPDATE carts
        SET is_active = FALSE
        WHERE user_id = $1
      `,
      [userId]
    );

    // COMMIT transaction
    await client.query('COMMIT');

    return {order_id: orderId, total_amount: totalAmount, shippingAddressId, billingAddressId};

  } catch (error) {
    await client.query('ROLLBACK');
    console.log(`Error to place order for userId: ${userId}`, error.stack);
    throw error;
  }finally {
    // Always release the client back to the pool
    client.release();
  }
};


// Update order status by admin
const UpdateOrderStatusByAdminService = async (orderId, status) => {
  const client = await pool.connect();

  try {
    console.log(`orderId: ${orderId}, and status: ${status} is received for update`);

    if(!orderId || !status) {
      throw new Error('Invalid orderId or status to update order status');
    }
    if(!['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      throw new Error('Invalid status value. Allowed values are: pending, shipped, delivered, cancelled');
    }
    if(!Number.isInteger(orderId) || orderId <= 0) {
      throw new Error('Invalid orderId. It must be a positive integer.');
    }

    // BEGIN the transaction
    await client.query('BEGIN');

    const updateResult = await client.query(
      `
        UPDATE orders
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, status
      `,
      [status, orderId]
    );
    
    if(updateResult.rows.length === 0) {
      throw new Error(`Order with ID: ${orderId} not found.`);
    }

    console.log('Order Status is updated successfully -----', updateResult.rows[0]);
    
    // COMMIT transaction
    await client.query('COMMIT');

    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('Error to update order status: ', error.stack);
    throw error;
  } finally {
    client.release();
  }
}
module.exports = {
  getAllOrdersService,
  getOrdersByUserIdService,
  placeOrderService,
  UpdateOrderStatusByAdminService
}