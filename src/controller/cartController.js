const { getCartsByUserIdService, addProductToCartService, updateCartItemQuantityService, removeCartItemQuantityService } = require('../model/cartModel');
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
// Performance update cart item quantity
const updateCartItemQuantity = async (req, res, next) => {
  try {
    // Get user ID from token
    const userId = req.user.id;
    // Get productId from req.params
    const product_id = parseInt(req.params.productId, 10);
    // Get the data such and newQuantity from request body
    const { newQuantity } = req.body;
    const newQuantityParsed = parseInt(newQuantity, 10)
    console.log(`User ID: ${userId}, Product ID: ${product_id} and New Quantity: ${newQuantityParsed} is received for update quantity`);

    if(!Number.isInteger(product_id) || !Number.isInteger(newQuantityParsed) || !Number.isInteger(userId)) {
      return handleResponse(res, 400, 'User ID, Product ID, and Quantity must be valid numbers for update cart items');
    }

    const updatedCartItem = await updateCartItemQuantityService(Number(userId), product_id, newQuantityParsed);

    if(!updatedCartItem) return handleResponse(res, 400, 'Cart item quantity is unable to be updated');

    console.log('Cart is updated successful------', updatedCartItem);
    return handleResponse(res, 200, 'Cart item quantity is successfully updated');
  } catch (error) {
    console.log('Unable to update cart and quantity: ', error.stack);
    next(error);
  }
}
// Performance to remove cart item quantity
const removeCartItemQuantity = async (req, res, next) => {
  try {
    // Get user ID from token
    const userId = req.user.id;
    // Get productId from req.params
    const product_id = parseInt(req.params.productId, 10);
    // Get the quantity for remove
    const { quantityToRemove } = req.body;
    const quantityToRemoveParsed = parseInt(quantityToRemove, 10);

    console.log(`User ID: ${userId}, Product ID: ${product_id} and Quantity To Remove: ${quantityToRemoveParsed} is received from remove cart quantity`);

    if(!Number.isInteger(product_id) || !Number.isInteger(quantityToRemoveParsed) || !Number.isInteger(userId)) {
      return handleResponse(res, 400, 'User ID, Product ID, and Quantity must be valid numbers for remove cart items');
    }

    const removedCartItem = await removeCartItemQuantityService(Number(userId), product_id, quantityToRemoveParsed);

    if(!removedCartItem) return handleResponse(res, 404, 'Cart item is removing not successful');

    console.log('Cart is removed successful------', removedCartItem);

    return handleResponse(res, 200, 'Cart item quantity is successfully removed');
  } catch (error) {
    console.log('Unable to remove cart and quantity: ', error.stack);
    next(error);
  }
};

module.exports = {
  getCartsByUserId,
  addProductToCart,
  updateCartItemQuantity,
  removeCartItemQuantity
};