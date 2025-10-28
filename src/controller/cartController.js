const { getCartsByUserIdService, addProductToCartService, updateCartItemQuantityService, removeCartItemQuantityService, deleteItemInCartByIdService, syncGuestCartService } = require('../model/cartModel');
const handleResponse = require('../utils/handleResponse');

// Get cart by userId that received from jwt token.
const getCartsByUserId = async (req, res, next) => {
  try {
    // Retrieve an ID from token
    const userId = req.user.id;
    console.log('User ID: ', userId);

    // Validate userId
    if(!Number.isInteger(userId) || userId <= 0) {
      return handleResponse(res, 400, 'Invalid userId. It must be a positive integer.');
    }
    // Get cart by userId from model
    const userCarts = await getCartsByUserIdService(Number(userId));

    // Check if cart is not found
    if(!userCarts) return handleResponse(res, 404, 'Cart is not found');

    // Return successful response
    console.log('Cart is retrieved successfully------', userCarts);

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
    // Parse quantity to integer
    const quantityParsed = parseInt(quantity, 10);
    console.log(`Product ID: ${product_id} and Quantity: ${quantityParsed} is received`);

    // Validate inputs strictly
    if (!Number.isInteger(product_id) || product_id <= 0) {
      return handleResponse(res, 400, 'Invalid product_id. It must be a positive integer.');
    }
    if (!Number.isInteger(quantityParsed) || quantityParsed <= 0) {
      return handleResponse(res, 400, 'Invalid quantity. It must be a positive integer.');
    }
    if(!Number.isInteger(userId) || userId <= 0) {
      return handleResponse(res, 400, 'Invalid userId. It must be a positive integer.');
    }
    // Add product to cart service
    const addedProduct = await addProductToCartService(Number(userId),  Number(product_id), quantityParsed);
    // Check if added product is null
    if(!addedProduct) return handleResponse(res, 400, 'Product is unable to added to cart');
    // Log successful addition
    console.log('Cart is added successful--------', addedProduct);
    // Return successful response
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
    // Parse newQuantity to integer
    const newQuantityParsed = parseInt(newQuantity, 10);

    console.log(`User ID: ${userId}, Product ID: ${product_id}, New Quantity: ${newQuantityParsed} is received`);
    // Validate inputs strictly
    if(!Number.isInteger(product_id) || !Number.isInteger(newQuantityParsed) || !Number.isInteger(userId)) {
      return handleResponse(res, 400, 'User ID, Product ID, and Quantity must be valid numbers for update cart items');
    }
    // Update cart item quantity service
    const updatedCartItem = await updateCartItemQuantityService(Number(userId), product_id, newQuantityParsed);

    if(!updatedCartItem) return handleResponse(res, 400, 'Cart item quantity is unable to be updated');
    // Log successful update
    console.log('Cart is updated successful------', updatedCartItem);
    // Return successful response
    return handleResponse(res, 200, 'Cart item quantity is successfully updated', {
      productId: updatedCartItem.productId,
      newQuantity: updatedCartItem.newQuantity
    });
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
    // Parse quantityToRemove to integer
    const quantityToRemoveParsed = parseInt(quantityToRemove, 10);
    console.log(`User ID: ${userId}, Product ID: ${product_id} and Quantity To Remove: ${quantityToRemoveParsed} is received from remove cart quantity`);

    // Validate inputs strictly
    if(!Number.isInteger(product_id) || !Number.isInteger(quantityToRemoveParsed) || !Number.isInteger(userId)) {
      return handleResponse(res, 400, 'User ID, Product ID, and Quantity must be valid numbers for remove cart items');
    }
    // Remove cart item quantity service
    const removedCartItem = await removeCartItemQuantityService(Number(userId), product_id, quantityToRemoveParsed);
    // Check if removal was unsuccessful
    if(!removedCartItem) return handleResponse(res, 404, 'Cart item is removing not successful');
    
    console.log('Cart is removed successful------', removedCartItem);
    // Return successful response
    return handleResponse(res, 200, 'Cart item quantity is successfully removed', {
      productId: removedCartItem.productId,
      quantityRemoved: removedCartItem.quantityRemoved
    });
  } catch (error) {
    console.log('Unable to remove cart and quantity: ', error.stack);
    next(error);
  }
};

// Delete item in cart by product ID
const deleteItemInCartById = async (req, res, next) => {
  try {
    // Get user ID from token
    const userId = req.user.id;
    // Get productId from req.params
    const product_id = parseInt(req.params.productId, 10);
    
    console.log(`User ID: ${userId} and Product ID: ${product_id} is received`);

    if(!Number.isInteger(product_id) || !Number.isInteger(userId)) {
      return handleResponse(res, 400, 'User ID and Product ID must be valid numbers to delete item in cart');
    }

    const deletedItem = await deleteItemInCartByIdService(Number(userId), product_id);
    
    if(!deletedItem) return handleResponse(res, 404, `Item with product ID: ${product_id} is not found in cart`);

    console.log(`Item with product ID: ${product_id} is deleted successfully`);

    return handleResponse(res, 200, `Item with product ID: ${product_id} is deleted successfully`, {
      productId: deletedItem.productId,
    });

  } catch (error) {
    console.log(`Unable to delete item with id:${product_id}`, error.stack);
    next(error);
  }
}

// Performance on Sync Guest Items
const syncGuestCart = async (req, res, next) => {
  try {
    // Get the userID from token
    const userId = req.user.id;
    // Get guest items from req.body
    const guestItems = req.body.items || [];
    
    if(!guestItems) {
      return handleResponse(res, 400, 'Not received guestItems from frontend');
    }
    const syncCarts = await syncGuestCartService(userId, guestItems);

    if(!syncCarts) {
      return handleResponse(res, 400, 'Unable to sync guest cart');
    }

    // Log successful addition
    console.log('Cart is sync successful--------', syncCarts);
    // Return successful response
    return handleResponse(res, 201, 'Product is sync to cart successful', syncCarts);
  } catch (error) {
    console.log('Unable to sycn a guest product to cart: ', error.stack);
    next(error);
  }
}
module.exports = {
  getCartsByUserId,
  addProductToCart,
  updateCartItemQuantity,
  removeCartItemQuantity,
  deleteItemInCartById,
  syncGuestCart
};