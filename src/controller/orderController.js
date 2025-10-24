const handleResponse = require('../utils/handleResponse');
const { getAllOrdersService, getOrdersByUserIdService, placeOrderService, UpdateOrderStatusByAdminService } = require('../model/orderModel');

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
    // Get userId from token
    const userId = req.user.id;
    console.log('Normal User ID: ', userId);
    // Get address of order
    const { street, city, country, postal_code, phone_number } = req.body;
    console.log(`Order Information Street:${street}, City-${city}, Country-${country}, Postal-code-${postal_code} and Phone-number-${phone_number}`);

    // Validate userId
    if(!Number.isInteger(userId) || userId <= 0) {
      return handleResponse(res, 400, 'Invalid userId. It must be a positive integer.');
    }
    if(!street || !city || !country || !postal_code || !phone_number) {
      return handleResponse(res, 400, 'Address information is missing. Please provide all information before proceed');
    }
    
    // Call service to place order, passing address info
    const placedOrder = await placeOrderService(userId, street, city, country, postal_code, phone_number);

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

// Implement on update order status by admin
const updateOrderStatusByAdmin = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`Received orderId: ${orderId}, and status: ${status} from request`);
    // Validate orderId
    const orderIdParsed = parseInt(orderId, 10);

    if(!Number.isInteger(orderIdParsed) || orderIdParsed <= 0) {
      return handleResponse(res, 400, 'Invalid orderId. It must be a positive integer.');
    }

    // Call service to update order status
    const updatedOrder = await UpdateOrderStatusByAdminService(orderIdParsed, status);

    // Check if order status is updated successfully
    if(!updatedOrder) {
      return handleResponse(res, 400, 'Unable to update order status');
    }
    // Return successful response
    console.log('Order Status is updated successfully------', updatedOrder);

    return handleResponse(res, 200, 'Order status is successfully updated', updatedOrder);
  } catch (error) {
    console.log(`Failed to make a updated on order status with orderId:${req.params.orderId}`, error.stack);
    next(error);
  }
}
module.exports = {
  getAllOrders,
  getOrdersByUserId,
  placeOrder,
  updateOrderStatusByAdmin
};