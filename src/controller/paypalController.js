const handleResponse = require('../utils/handleResponse');
const dotenv = require('dotenv');
dotenv.config();
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const { computeCartTotalForUserService, findOrderByPaymentService, updateOrderPaymentService } = require('../model/paypalModel');
const { placeOrderService } = require('../model/orderModel');
const { getAccessToken, PAYPAL_BASE, get_access_token } = require('../middlewares/paypalAuth');
const { default: axios } = require('axios');

// const createOrder = async (req, res, next) => {
//   console.log('--- createOrder INCOMING REQUEST ---');
//   console.log('USER:', JSON.stringify(req.user, null, 2));
//   console.log('BODY:', JSON.stringify(req.body, null, 2));

//   try {
//     const userId = req.user?.id;
//     const { shipping_address } = req.body;

//     if (!userId) return handleResponse(res, 401, 'Unauthorized.');

//     if (
//       !shipping_address ||
//       !shipping_address.street ||
//       !shipping_address.city ||
//       !shipping_address.country ||
//       !shipping_address.postal_code
//     ) {
//       return handleResponse(res, 400, 'Incomplete shipping address provided.');
//     }

//     const totals = await computeCartTotalForUserService(userId);
//     if (!totals || typeof totals.totalDecimal !== 'number') {
//       console.error('createOrder: totals malformed', { userId, totals });
//       return handleResponse(res, 500, 'Server error computing cart total.');
//     }
//     if (totals.totalDecimal <= 0) {
//       return handleResponse(res, 400, 'Cart is empty');
//     }

//     const value = totals.totalDecimal.toFixed(2);

//     const payload = {
//       intent: 'CAPTURE',
//       purchase_units: [
//         {
//           amount: { currency_code: 'USD', value },
//           custom_id: String(userId),
//           shipping: {
//             name: { full_name: shipping_address.fullname || req.user.name || 'Valued Customer' },
//             address: {
//               address_line_1: shipping_address.street,
//               admin_area_2: shipping_address.city,
//               postal_code: shipping_address.postal_code,
//               country_code: shipping_address.country,
//             },
//           },
//         },
//       ],
//       application_context: {
//         user_action: 'PAY_NOW',
//         shipping_preference: 'SET_PROVIDED_ADDRESS',
//         brand_name: 'T-Shop',
//       },
//     };

//     const accessToken = await getAccessToken();
//     const url = `${PAYPAL_BASE.replace(/\/$/, '')}/v2/checkout/orders`;

//     const response = await axios.post(url, payload, {
//       headers: {
//         'Content-Type': 'application/json',
//         Accept: 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//         'PayPal-Request-Id': `order-${userId}-${Date.now()}`,
//       },
//       timeout: 15000,
//     });

//     console.log('[PP][CREATE] status=', response.status);
//     console.log('[PP][CREATE] data=', JSON.stringify(response.data, null, 2));
//     const order = response.data;
//     if (!order || !order.id) {
//       return handleResponse(res, 502, 'PayPal did not return an order id');
//     }

//     // IMPORTANT: return *plain JSON* with id for frontend to read easily
//     return res.status(201).json({ id: order.id, amount: totals.formatted });
//   } catch (error) {
//     console.error(
//       'createOrder error:',
//       error.response ? JSON.stringify(error.response.data, null, 2) : (error.message || error)
//     );
//     // Expose safe message
//     return handleResponse(res, 400, error?.response?.data?.message || error.message || 'Failed to create PayPal order');
//   }
// };

// const captureOrder = async (req, res, next) => {
//   try {
//     const userId = req.user?.id;
//     const { orderId } = req.params;

//     if (!userId) return handleResponse(res, 401, 'Unauthorized.');
//     if (!orderId) return handleResponse(res, 400, 'OrderId is required');

//     // use PayPal SDK (optional) or HTTP capture. Using SDK is robust:
//     // if you installed @paypal/checkout-server-sdk you can use buildPaypalClient() helper:
//     const { buildPaypalClient } = require('../utils/paypalClient');
//     const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
//     const client = buildPaypalClient();

//     const captureRequest = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
//     captureRequest.requestBody({});

//     let capture;
//     try {
//       capture = await client.execute(captureRequest);
//     } catch (err) {
//       console.error('capture execute error:', err);
//       // fallback: fetch order details or report error
//       const accessToken = await getAccessToken();
//       const r = await axios.get(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
//         headers: { Authorization: `Bearer ${accessToken}` },
//         timeout: 8000,
//       });
//       capture = { result: r.data };
//     }

//     const pu = capture?.result?.purchase_units?.[0];
//     const cap = pu?.payments?.captures?.[0];
//     const status = cap?.status || capture?.result?.status;

//     if (status !== 'COMPLETED') {
//       return handleResponse(res, 400, 'Capture not completed', { status, orderId });
//     }

//     const captureId = cap?.id || capture?.result?.id;
//     return handleResponse(res, 200, 'Capture success', {
//       status: 'COMPLETED',
//       orderId,
//       captureId,
//       payerEmail: capture.result?.payer?.email_address,
//       raw: capture.result,
//     });
//   } catch (err) {
//     console.error('captureOrder error:', err);
//     return next(err);
//   }
// };

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

    // ✅ Validate country code format (must be 2 letters)
    if (!/^[A-Z]{2}$/.test(shipping_address.country)) {
      return handleResponse(res, 400, 'Country code must be a valid 2-letter ISO code (e.g., US, KH, GB)');
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

    // ✅ Build PayPal order payload
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { 
            currency_code: 'USD', 
            value 
          },
          custom_id: String(userId),
          shipping: {
            name: {
              full_name: shipping_address.fullname || req.user.name || 'Valued Customer',
            },
            address: {
              address_line_1: shipping_address.street,
              admin_area_2: shipping_address.city,
              postal_code: shipping_address.postal_code,
              country_code: shipping_address.country.toUpperCase(), // ✅ Ensure uppercase
            },
          },
        },
      ],
      application_context: {
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        brand_name: 'T-Shop',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
      },
    };

    // ✅ Get access token
    const accessToken = await getAccessToken();
    const url = `${PAYPAL_BASE}/v2/checkout/orders`;

    console.log('📤 Sending to PayPal API:', JSON.stringify(payload, null, 2));

    // ✅ Send request to PayPal
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${userId}-${Date.now()}`,
      },
    });

    const order = response.data;

    console.log('✅ [PP][CREATE] orderId=', order.id);
    console.log('✅ Full PayPal Response:', JSON.stringify(order, null, 2));

    return handleResponse(res, 200, 'Create Order with PayPal Success', {
      id: order.id,
      amount: totals.formatted,
    });

  } catch (error) {
    console.error('❌ createOrder error:', error.response ? error.response.data : (error.message || error));
    
    // ✅ Better error details for debugging
    if (error.response && error.response.data && error.response.data.details) {
      console.error('PayPal API Error Details:', JSON.stringify(error.response.data.details, null, 2));
      return handleResponse(res, 400, error.response.data.message || 'PayPal API Error', {
        details: error.response.data.details
      });
    }
    
    return handleResponse(res, 500, error.message || 'Failed to create PayPal order');
  }
};

// Minimal capture endpoint
async function captureOrder(req, res, next) {
  try {
    const orderId = req.params.orderId;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const accessToken = await getAccessToken();
    const url = `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`;

    const response = await axios.post(url, {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15000
    });

    const debugId = response.headers['paypal-debug-id'];
    console.log('PayPal capture debug id:', debugId);
    return res.status(200).json({ capture: response.data });
  } catch (err) {
    console.error('captureOrder error:', err.response?.data ?? err.message);
    return res.status(400).json({ error: 'capture failed', details: err.response?.data });
  }
}
const finalizeOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { street, city, country, postal_code, phone_number, payment_provider, payment_reference } = req.body;

    if (!userId) return handleResponse(res, 401, 'Unauthorized.');
    if (!street || !city || !country || !postal_code || !phone_number) {
      return handleResponse(res, 400, 'Missing address fields');
    }

    // idempotency: if payment_reference already used
    if (payment_provider && payment_reference) {
      const existing = await findOrderByPaymentService(payment_provider, payment_reference);
      if (existing) {
        return handleResponse(res, 200, 'Order is already created', { ok: true, order_id: existing.id });
      }
    }

    if (payment_provider === 'paypal' && payment_reference) {
      const accessToken = await getAccessToken();
      const r = await axios.get(`${PAYPAL_BASE.replace(/\/$/, '')}/v2/payments/captures/${payment_reference}`, {
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

    const result = await placeOrderService(userId, street, city, country, postal_code, phone_number);
    if (payment_provider && payment_reference) {
      await updateOrderPaymentService(result.order_id || result.id || result.orderId, payment_provider, payment_reference, 'completed');
    }

    return handleResponse(res, 200, 'finalize order is successful', { ok: true, order: result });
  } catch (err) {
    console.error('finalizeOrder error:', err);
    return next(err);
  }
};

const getOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return handleResponse(res, 400, 'orderId required');

    const accessToken = await getAccessToken();
    const r = await axios.get(`${PAYPAL_BASE.replace(/\/$/, '')}/v2/checkout/orders/${orderId}`, {
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
  getOrderDetails,
};