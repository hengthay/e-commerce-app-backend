const { getCartsByUserIdService, addProductToCartService, updateCartItemQuantityService } = require('../model/cartModel');
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

    // Validate inputs strictly
    if (!Number.isInteger(product_id) || product_id <= 0) {
      return handleResponse(res, 400, 'Invalid product_id. It must be a positive integer.');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return handleResponse(res, 400, 'Invalid quantity. It must be a positive integer.');
    }
    if(!Number.isInteger(userId) || userId <= 0) {
      return handleResponse(res, 400, 'Invalid userId. It must be a positive integer.');
    }

    const addedProduct = await addProductToCartService(Number(userId),  Number(product_id), Number(quantity));

    if(!addedProduct) return handleResponse(res, 400, 'Product is unable to added to cart');

    console.log('Cart is added successful--------', addedProduct);
    return handleResponse(res, 201, 'Product is successful added to cart', { productId: addedProduct.productId, quantityAdded: addedProduct.quantityAdded });
  } catch (error) {
    console.log('Unable to add a product to cart: ', error.stack);
    next(error);
  }
}

const updateCartItemQuantity = async (req, res, next) => {
  try {
    // Get user ID from token
    const userId = req.user.id;
    // Get product_id from req.params
    const product_id = req.params.productId;
    // Get the data such and newQuantity from request body
    const { newQuantity } = req.body;

    console.log(`Product ID: ${product_id} and New Quantity: ${newQuantity} is received for update`);

    if(!Number.isInteger(product_id) || !Number.isInteger(newQuantity) || !Number.isInteger(userId)) {
      return handleResponse(res, 400, 'User ID, Product ID, and Quantity must be valid numbers');
    }

    const updatedCartItem = await updateCartItemQuantityService(Number(userId), Number(product_id), Number(newQuantity));

    if(!updatedCartItem) return handleResponse(res, 400, 'Cart item quantity is unable to be updated');

    console.log('Cart is updated successful------', updatedCartItem);
    return handleResponse(res, 200, 'Cart item quantity is successfully updated');
  } catch (error) {
    console.log('Unable to update cart and quantity: ', error.stack);
    next(error);
  }
}
module.exports = {
  getCartsByUserId,
  addProductToCart,
  updateCartItemQuantity
};