const { getCartsByUserIdService, addProductToCartService } = require('../model/cartModel');
const handleResponse = require('../utils/handleResponse');

// Get cart by userId that received from jwt token.
const getCartsByUserId = async (req, res, next) => {
  try {
    // Retrieve an ID from token
    const userId = req.user.id;
    console.log('User ID: ', userId)
    const userCarts = await getCartsByUserIdService(userId);

    if(!userCarts) return handleResponse(res, 404, 'Cart is not found');

    return handleResponse(res, 200, 'Cart is successful retrieved', userCarts);
  } catch (error) {
    console.log(`Error to get cart with userId:${userId}`, error);
    next(error);
  }
}

// Performance add to cart
const addProductToCart = async (req, res, next) => {
  try {
    // Get the userID from token
    const userId = req.user.id;
    // Get the data such as product_id and quantity
    const { product_id, quantity } = req.body;

    console.log(`Product ID: ${product_id} and Quantity: ${quantity} is received`);

    const addedProduct = await addProductToCartService(userId, product_id, quantity);

    if(!addedProduct) return handleResponse(res, 400, 'Product is unable to added to cart');

    return handleResponse(res, 201, 'Product is successful added to cart');
  } catch (error) {
    console.log('Unable to add a product to cart: ', error.stack);
    next(error);
  }
}

module.exports = {
  getCartsByUserId,
  addProductToCart
};