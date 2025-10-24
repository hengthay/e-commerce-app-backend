const handleResponse = require('../utils/handleResponse');
const { getAllOrdersService, getOrdersByUserIdService, placeOrderService } = require('../model/orderModel');

// Get all orders (admin only)
const getAllOrders = async (req, res, next) => {
  try {
    // Get userId from token to verify admin role
    const userId = req.user.id;
    console.log('Admin User ID: ', userId);

    // Validate userId
    if(!Number.isInteger(userId) || userId <= 0) {
      return handleResponse(res, 400, 'Invalid userId. It must be a positive integer.');
    }

    // Call service to get all orders
    const getOrders = await getAllOrdersService();

    // Check if orders are found
    if(!getOrders) {
      return handleResponse(res, 404, 'No orders found');
    }

    // Return successful response
    console.log('Orders are retrieved successfully------', getOrders);

    return handleResponse(res, 200, 'Orders are successfully retrieved', getOrders);
  } catch (error) {
    console.log('Unable to get all orders', error.stack);
    next(error);
  }
}

// Get order by userId (user and admin)
const getOrdersByUserId = async (req, res, next) => {
  try {
    // Get userId from token to verify admin role
    const userId = req.user.id;
    console.log('Normal User ID: ', userId);

    // Validate userId
    if(!Number.isInteger(userId) || userId <= 0) {
      return handleResponse(res, 400, 'Invalid userId. It must be a positive integer.');
    }

    // Call service to get all orders
    const userOrders = await getOrdersByUserIdService(userId);

    // Check if orders are found
    if(!userOrders) {
      return handleResponse(res, 404, 'No orders found');
    }
    // Return successful response
    console.log('User orders are retrieved successfully------', userOrders);

    return handleResponse(res, 200, 'Orders are successfully retrieved', userOrders);
  } catch (error) {
    console.log('Unable to get all orders', error.stack);
    next(error);
  }
}

// Implement on place order
const placeOrder = async (req, res, next) => {
  try {
    // Get userId from token to verify admin role
    const userId = req.user.id;
    console.log('Normal User ID: ', userId);

    // Validate userId
    if(!Number.isInteger(userId) || userId <= 0) {
      return handleResponse(res, 400, 'Invalid userId. It must be a positive integer.');
    }
    // Call service to place order
    const placedOrder = await placeOrderService(userId);

    // Check if order is placed successfully
    if(!placedOrder) {
      return handleResponse(res, 400, 'Unable to place order');
    }
    // Return successful response
    console.log('Order is placed successfully------', placedOrder);

    return handleResponse(res, 201, 'Order is successfully placed', placedOrder);
  } catch (error) {
    console.log('Unable to make a place order', error.stack);
    next(error);
  }
};


module.exports = {
  getAllOrders,
  getOrdersByUserId,
  placeOrder
};