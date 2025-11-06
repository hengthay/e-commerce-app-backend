const handleResponse = require('../utils/handleResponse');
const dotenv = require('dotenv');
dotenv.config();
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const { computeCartTotalForUserService, findOrderByPaymentService, updateOrderPaymentService } = require('../model/paypalModel');
const { placeOrderService } = require('../model/orderModel');
const { getAccessToken, PAYPAL_BASE } = require('../middlewares/paypalAuth');
const { default: axios } = require('axios');
const { buildPaypalClient } = require('../utils/paypalClient');
const createOrder = async (req, res, next) => {
  console.log('--- createOrder INCOMING REQUEST ---');
  console.log('USER:', JSON.stringify(req.user, null, 2));
  console.log('BODY:', JSON.stringify(req.body, null, 2));

  try {
    const userId = req.user.id;
    const { shipping_address } = req.body;

    if (!userId) return handleResponse(res, 401, 'Unauthorized.');

    if (
      !shipping_address ||
      !shipping_address.street ||
      !shipping_address.city ||
      !shipping_address.country ||
      !shipping_address.postal_code
    ) {
      return handleResponse(res, 400, 'Incomplete shipping address provided.');
    }

    const totals = await computeCartTotalForUserService(userId);

    if (!totals || typeof totals.totalDecimal !== 'number') {
      console.error('createOrder: totals malformed', { userId, totals });
      return handleResponse(res, 500, 'Server error computing cart total.');
    }
    if (totals.totalDecimal <= 0) {
      console.log(`User ${userId} cart is empty. Total: ${totals.totalDecimal}`);
      return handleResponse(res, 400, 'Cart is empty');
    }

    const value = Number(totals.totalDecimal).toFixed(2);

    // --- NEW AXIOS-BASED LOGIC ---
    
    // 1. Build the same payload that was in requestBody
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value },
          custom_id: String(userId),
          shipping: {
            name: {
              full_name: shipping_address.fullname || req.user.name || 'Valued Customer',
            },
            address: {
              address_line_1: shipping_address.street,
              admin_area_2: shipping_address.city,
              postal_code: shipping_address.postal_code,
              country_code: shipping_address.country,
            },
          },
        },
      ],
      application_context: {
        user_action: 'PAY_NOW',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        brand_name: 'T-Shop',
      },
    };

    // 2. Get the access token (like you do in finalizeOrder)
    const accessToken = await getAccessToken();
    const url = `${PAYPAL_BASE}/v2/checkout/orders`;

    console.log('Sending to PayPal API with axios:', JSON.stringify(payload, null, 2));

    // 3. Send the request with Axios
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${userId}-${Date.now()}`, // for idempotency
      },
    });

    const order = response.data; // The order object from PayPal

    console.log('[PP][CREATE] orderId=', order.id);

    return handleResponse(res, 200, 'Create Order with Paypal Success', {
      id: order.id,
      amount: totals.formatted,
    });
    
    // --- END OF NEW AXIOS-BASED LOGIC ---

  } catch (error) {
    // Axios errors are different, so we log them slightly differently
    console.error('createOrder error:', error.response ? error.response.data : (error.message || error));
    if (error.response && error.response.data && error.response.data.details) {
      console.error('PayPal API Error Details:', error.response.data.details);
    }
    return handleResponse(res, 400, error.message || 'Failed to create PayPal order');
  }
};


// const createOrder = async (req, res, next) => {
//   try {
//     // Get the userId from token
//     const userId = req.user.id;
//     console.log(`Order User ID: ${userId}`);
//     if(!userId) return handleResponse(res, 401, 'Unauthorized.');

//     const totals = await computeCartTotalForUserService(userId);
//     // Defensive checks
//     if (!totals || typeof totals.totalDecimal !== 'number') {
//       console.error('createOrder: totals malformed', { userId, totals });
//       return handleResponse(res, 500, 'Server error computing cart total.');
//     }
//     if(totals.totalDecimal <= 0) return handleResponse(res, 400, 'Cart is empty');
//      // Format to a string with 2 decimals and validate it is numeric
//     console.log('createOrder totals=', totals, 'amountString=', Number(totals.totalDecimal).toFixed(2));
//     const value = Number(totals.totalDecimal).toFixed(2);

//     const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
//     request.prefer('return=representation');
//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [{
//         amount: { currency_code: 'USD', value },
//         custom_id: String(userId),
//       }],
//       application_context: { 
//         user_action: 'PAY_NOW',
//         shipping_preference: 'NO_SHIPPING',
//         brand_name: "T-Shop"
//       }
//     });

//     const client = buildPaypalClient();
//     const order = await client.execute(request);
//     // after: const order = await client.execute(request);
//     const debugId =
//       order?.headers?.['paypal-debug-id'] ||
//       order?.headers?.['PayPal-Debug-Id'] ||
//       order?.headers?.['paypal-debugid'];
//     console.log('[PP][CREATE] orderId=', order.result.id, 'debugId=', debugId, 'env=', process.env.PAYPAL_ENVIRONMENT);

//     return handleResponse(res, 200, 'Create Order with Paypal Success', {
//       id: order.result.id,
//       amount: totals.formatted
//     });

//   } catch (error) {
//     console.log('createOrder error:', error);
//   }
// }

// Create captureOrder
// Authenticated. Capture server-side and return captureId.
// src/controller/paypalController.js

// REPLACE the entire createOrder function with this:

// const createOrder = async (req, res, next) => {
//   try {
//     // Get the userId from token
//     const userId = req.user.id;
//     // Get the shipping address from the request body
//     const { shipping_address } = req.body;

//     console.log('--- createOrder INCOMING REQUEST ---');
//   console.log('USER:', JSON.stringify(req.user, null, 2));
//   console.log('BODY:', JSON.stringify(req.body, null, 2));


//     console.log(`Order User ID: ${userId}`);
//     if (!userId) return handleResponse(res, 401, 'Unauthorized.');

//     // --- VALIDATION ---
//     if (
//       !shipping_address ||
//       !shipping_address.street ||
//       !shipping_address.city ||
//       !shipping_address.country ||
//       !shipping_address.postal_code
//     ) {
//       return handleResponse(res, 400, 'Incomplete shipping address provided.');
//     }
//     // --- END VALIDATION ---

//     const totals = await computeCartTotalForUserService(userId);
    
//     if (!totals || typeof totals.totalDecimal !== 'number') {
//       console.error('createOrder: totals malformed', { userId, totals });
//       return handleResponse(res, 500, 'Server error computing cart total.');
//     }
//     if (totals.totalDecimal <= 0)
//       return handleResponse(res, 400, 'Cart is empty');
    
//     const value = Number(totals.totalDecimal).toFixed(2);

//     const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
//     request.prefer('return=representation');

//     // request.requestBody({
//     //   intent: 'CAPTURE',
//     //   purchase_units: [
//     //     {
//     //       amount: { currency_code: 'USD', value },
//     //       custom_id: String(userId),
          
//     //       shipping: {
//     //         name: {
//     //           // --- THIS IS THE CORRECTED LINE ---
//     //           // Use the form's fullname. Fallback to login name, then to generic.
//     //           full_name: shipping_address.fullname || req.user.name || 'Valued Customer',
//     //         },
//     //         address: {
//     //           address_line_1: shipping_address.street,
//     //           admin_area_2: shipping_address.city, // City
//     //           postal_code: shipping_address.postal_code,
//     //           country_code: shipping_address.country, // This is now "KH", "US", etc.
//     //         },
//     //       },
//     //     },
//     //   ],
//     //   application_context: {
//     //     user_action: 'PAY_NOW',
//     //     shipping_preference: 'SET_PROVIDED_ADDRESS', // Correct
//     //     brand_name: 'T-Shop',
//     //   },
//     // });

//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [
//         {
//           amount: { currency_code: 'USD', value },
//           custom_id: String(userId),
          
//           shipping: {
//             name: {
//               full_name: shipping_address.fullname || req.user.name || 'Valued Customer',
//             },
//             address: {
//               address_line_1: shipping_address.street,
//               admin_area_2: shipping_address.city, // City
//               postal_code: shipping_address.postal_code,
//               country_code: shipping_address.country, // This is "KH", "US", etc.
//             },
//           },
//         },
//       ],
//       application_context: {
//         user_action: 'PAY_NOW',
//         shipping_preference: 'SET_PROVIDED_ADDRESS', 
//         brand_name: 'T-Shop',
//       },
//     });


//     console.log("Sending to PayPal API: ", JSON.stringify(request.requestBody(), null), 2)
//     // --- END MODIFIED REQUEST BODY ---

//     const client = buildPaypalClient();
//     const order = await client.execute(request);
    
//     const debugId =
//       order?.headers?.['paypal-debug-id'] ||
//       order?.headers?.['PayPal-Debug-Id'] ||
//       order?.headers?.['paypal-debugid'];
//     console.log(
//       '[PP][CREATE] orderId=',
//       order.result.id,
//       'debugId=',
//       debugId,
//       'env=',
//       process.env.PAYPAL_ENVIRONMENT
//     );

//     return handleResponse(res, 200, 'Create Order with Paypal Success', {
//       id: order.result.id,
//       amount: totals.formatted,
//     });
//   } catch (error) {
//     console.error('createOrder error:', error.message || error);
//     if (error.response) {
//       console.error('PayPal API Error Response:', error.response.data);
//     }
//     next(error); 
//   }
// };


const captureOrder = async (req, res, next) => {
  try {
    // Get user id from token
    const userId = req.user.id;
    // Get orderId
    const { orderId } = req.params;
    console.log(`Order User ID: ${userId} And Order ID: ${orderId}`)
    if(!userId) return handleResponse(res, 401, 'Unauthorized.'); 

    if(!orderId) return handleResponse(res, 400, 'OrderId is required');

    const client = buildPaypalClient();
    const captureRequest = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    captureRequest.requestBody({});

    let capture;
    try {
      capture = await client.execute(captureRequest);
    } catch (error) {
      // Handle idempotent replays (ORDER_ALREADY_CAPTURED)
      const message = error?.message || '';
      const already =
        error?.statusCode === 422 && /ORDER_ALREADY_(CAPTURED|COMPLETED)/i.test(message);
      if (!already) throw e;

      const accessToken = await getAccessToken();
      const r = await axios.get(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
      });
      capture = { result: r.data };
    }
    const pu = capture?.result?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    const status = cap?.status || capture?.result?.status;

    if(status !== 'COMPLETED') {
      return handleResponse(res, 400, 'Capture not completed', { status, orderId });
    }
    
    const captureId = cap?.id || capture?.result?.id;

    return handleResponse(res, 200, 'Capture success', {
      status: 'COMPLETED',
      orderId,
      captureId,
      payerEmail: capture.result?.payer?.email_address,
      raw: capture.result,
    });
  } catch (error) {
    console.error('captureOrder error:', error);
    next(error);
  }
}

/**
 * POST /orders/finalize
 * Body: { street, city, country, postal_code, phone_number, payment_provider, payment_reference }
 * Authenticated. Calls placeOrderService and attaches payment info (idempotent).
 */

const finalizeOrder = async (req, res, next) => {

  try {
    // Get user id from token
    const userId = req.user.id;
    const { 
      street, 
      city, 
      country, 
      postal_code, 
      phone_number, 
      payment_provider, 
      payment_reference } = req.body;

    if(!userId) return handleResponse(res, 401, 'Unauthorized.'); 
    
    console.log(`Order User ID: ${userId}, street: ${street}, city: ${city}, country: ${country}, postal_code: ${postal_code}, phone_number: ${phone_number}, payment_provider: ${payment_provider}, payment_ref: ${payment_reference}`);
    
    if (!street || !city || !country || !postal_code || !phone_number) {
      return handleResponse(res, 400, 'Missing address fields');
    }
    // idempotency: if payment_reference already used, return existing order
    if (payment_provider && payment_reference) {
      const existing = await findOrderByPaymentService(payment_provider, payment_reference);

      if(existing) {
        return handleResponse(res, 200, 'Order is already created', {
          ok: true,
          order_id: existing.id
        })
      }
    };
    // Verify Paypal capture
    if (payment_provider === 'paypal' && payment_reference) {
      const accessToken = await getAccessToken();
      const r = await axios.get(`${PAYPAL_BASE}/v2/payments/captures/${payment_reference}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
      });

      const capStatus = r.data?.status;
      const capturedAmount = Number(r.data?.amount?.value || 0);
      if (capStatus !== 'COMPLETED') {
        return handleResponse(res, 400, 'Payment not completed', { status: capStatus });
      }

      const { totalDecimal } = await computeCartTotalForUserService(userId);
      if (Math.abs(capturedAmount - totalDecimal) > 0.01) {
        return handleResponse(res, 400, 'Payment amount mismatch', {
          expected: totalDecimal.toFixed(2),
          captured: capturedAmount.toFixed(2),
        });
      }
    }
    // Call the existing transactional service
    const result = await placeOrderService(
      userId, 
      street, 
      city, 
      country, 
      postal_code, 
      phone_number
    );
    // result expected shape: { order_id, total_amount, ... }
    if (payment_provider && payment_reference) {
      await updateOrderPaymentService(
        result.order_id, 
        payment_provider, 
        payment_reference, 
        'completed'
      );
    }

    return handleResponse(res, 200, 'finalize order is successful', {
      ok: true,
      order: result
    })
  } catch (error) {
    console.log('finalizeOrder error:', error);
    next(error);
  }
}

// inside an async handler
const getOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return handleResponse(res, 400, 'orderId required');

    const accessToken = await getAccessToken();
    const r = await axios.get(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });

    return handleResponse(res, 200, 'OK', r.data);
  } catch (err) {
    console.error('getOrderDetails error:', err.response?.data ?? err.message ?? err);
    const status = err.response?.status || 500;
    const body = err.response?.data || { error: err.message };
    return res.status(status).json(body);
  }
};


module.exports = {
  createOrder,
  captureOrder,
  finalizeOrder,
  getOrderDetails
}