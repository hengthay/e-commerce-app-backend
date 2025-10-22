const pool = require('../config/db');

// Get cart by user ID
const getCartsByUserIdService = async (userId) => {
  try {
    const result = await pool.query(
      `
      SELECT 
      c.id as cart_id,
      c.user_id,
      c.is_active,
      c.created_at as cart_created_at,
      ci.id as cart_item_id,
      ci.quantity,
      p.id as product_id,
      p.title as product_title,
      p.price as product_price,
      p.image_url as product_image
      FROM carts as c
      JOIN cart_items as ci
        ON c.id = ci.cart_id
      JOIN products as p
        ON ci.product_id = p.id
      WHERE c.user_id = $1 AND c.is_active = TRUE
      `,
      [userId]
    );

    if(result.rows.length === 0) return null;

    const cart = {
      cart_id: result.rows[0].cart_id,
      user_id: result.rows[0].user_id,
      is_active: result.rows[0].is_active,
      created_at: result.rows[0].cart_created_at,
      items: result.rows.map((row) => ({
        cart_item_id: row.cart_item_id,
        product_id: row.product_id,
        product_title: row.product_title,
        product_price: row.product_price,
        product_image: row.product_image,
        quantity: row.quantity
      }))
    };
    console.log('Cart items-----------',cart);
    return cart;
  } catch (error) {
    console.log('Unable to get carts: ', error);
    throw error;
  }
};

// Performance add to cart
const addProductToCartService = async (userId, productId, quantity) => { 
  // Get a client from pool
  const client = await pool.connect();

  try {
    // Check the received data from user
    console.log(`User ID: ${userId}, Product ID: ${productId}, Quantity: ${quantity}`);
    // Validate the received data
    if(!productId || !quantity || quantity <= 0) {
      throw new Error("Product ID or quantity is missing or invalid (must be > 0)");
    }

    // If userId is not rec eived
    if(!userId) throw new Error("User ID is not received");
    
    // Begin the transaction
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE user_id = $1', [userId]);

    console.log(`Found user cart with ID:${userId}`, cartResult.rows);
    // Store cartId 
    let cartId;
    // Check if is not present, we add a new value to carts table and assign newCart to cartId, and if it is present we just assign those value to cartId.
    if(cartResult.rows.length === 0) {
      const newCart = await client.query('INSERT INTO carts(user_id, is_active) VALUES($1, TRUE) RETURNING *', [userId]);
      cartId = newCart.rows[0].id;
    }else {
      cartId = cartResult.rows[0].id
    };
    
    // Check if item already exists in cart
    const existingItemResult = await client.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    // If cart exists we update the quantity of that items, otherwise we insert a new one.
    if(existingItemResult.rows.length > 0) {
      // Update quantity if item exists
      await client.query(
        `
          UPDATE cart_items
          SET quantity = quantity + $1
          WHERE cart_id = $2 AND product_id = $3
        `,
        [quantity, cartId, productId]
      );
    }else {
      // Added a new value to cart_items
      await client.query(
        `
          INSERT INTO cart_items(cart_id, product_id, quantity)
          VALUES ($1, $2, $3)
        `,
        [cartId, productId, quantity]
      )
    }

    // Commit the transaction.
    await client.query('COMMIT');
    return {cartId, productId, quantityAdded: quantity};
  } catch (error) {
    console.log('Error to adding an item to cart: ', error.stack);
    throw error;
  } finally {
    // Always release cliend
    client.release();
  };
}

// Implement on update cart item quantity
const updateCartItemQuantityService = async (userId, productId, newQuantity) => {
  // Get a client from pool
  const client = await pool.connect();
  try {
    // Check the received data from user
    console.log(`User ID: ${userId}, Product ID: ${productId}, Quantity: ${newQuantity}`);
    // Validate the received data
    if(!productId || !newQuantity || newQuantity <= 0) {
      throw new Error("Product ID or quantity is missing or invalid (must be > 0)");
    }

    // If userId is not received
    if(!userId) throw new Error("User ID is not received");

    // Begin the transaction
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE user_id = $1', [userId]);

    if(cartResult.rows.length === 0) {
      throw new Error(`Cart for user ID ${userId} not found`);
    }

    const cartId = cartResult.rows[0].id;
    if(newQuantity >= 100) {
      throw new Error('Quantity cannot be higher than 100, range available (1-100)');
    }
    const updateResult = await client.query(
      `
        UPDATE cart_items
        SET quantity = quantity + $1
        WHERE cart_id = $2 AND product_id = $3
      `,
      [newQuantity, cartId, productId]
    );

    if(updateResult.rowCount === 0) {
      throw new Error(`Cart item with product ID ${productId} not found in cart ID ${cartId}`);
    }

    // Commit the transaction.
    await client.query('COMMIT');

    return {userId, productId, newQuantity};
  } catch (error) {
    console.log('Error to updating cart: ', error.stack);
    throw error;
  } finally {
    // Always release client
    client.release();
  }
};

// Implement on Remove cart item quantity
const removeCartItemQuantityService = async (userId, productId, quantityToRemove) => {
  const client = await pool.connect();
  try {
    
    console.log(`User ID: ${userId}, Product ID: ${productId} and removeQuantity: ${quantityToRemove}`);

    // Validate the received data
    if(!productId || !quantityToRemove || quantityToRemove <= 0) {
      throw new Error("Product ID or quantity to remove is missing or invalid (must be > 0)");
    }

    // If userId is not received
    if(!userId) throw new Error("User ID is not received");

    // Begin the transaction
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT * FROM carts WHERE user_id = $1', [userId]);

    if(cartResult.rows.length === 0) {
      throw new Error(`Cart for user ID ${userId} not found`);
    }

    const cartId = cartResult.rows[0].id;
    console.log('Cart ID: ', cartId);

    const existingItemResult = await client.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    if(existingItemResult.rows.length === 0) {
      throw new Error(`Cart item with product ID ${productId} not found in cart ID ${cartId}`);
    }

    const currentQuantity = existingItemResult.rows[0].quantity;

    console.log('Current Cart Quantity: ', currentQuantity);

    // Check if the current quantity is sufficient to remove
    if (currentQuantity < quantityToRemove) {
      throw new Error("Not enough quantity to remove");
    }
 
    await client.query(
      `
      UPDATE cart_items
      SET quantity = quantity - $1
      WHERE cart_id = $2 AND product_id = $3
    `,
    [quantityToRemove, cartId, productId]
    );

    if(currentQuantity - quantityToRemove === 0) {
      await client.query(
        `
        DELETE FROM cart_items
        WHERE cart_id = $1 AND product_id = $2
      `,
      [cartId, productId]
      )
    };

    // Commit the transaction.
    await client.query('COMMIT');

    return {userId, productId, quantityRemoved: quantityToRemove};
  } catch (error) {
    console.log('Error to remove cart quantity: ', error.stack);
    throw error;
  } finally {
    // Always release client
    client.release();
  }
};

// Delete cart item by item ID
const deleteCartItemByIdService = async (userId, productId) => {

}

module.exports = {
  getCartsByUserIdService,
  addProductToCartService,
  updateCartItemQuantityService,
  removeCartItemQuantityService,
  deleteCartItemByIdService
};