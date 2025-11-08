const handleResponse = require('../utils/handleResponse');
const dotenv = require('dotenv');
dotenv.config();
const { computeCartTotalForUserService, findOrderByPaymentService, updateOrderPaymentService } = require('../model/paypalModel');
const { placeOrderService } = require('../model/orderModel');
const { getAccessToken, PAYPAL_BASE, get_access_token } = require('../middlewares/paypalAuth');
const { default: axios } = require('axios');

// create a PayPal order for the current user and return the PayPal order.id to the frontend.
const createOrder = async (req, res, next) => {
  console.log('--- createOrder INCOMING REQUEST ---');
  console.log('USER:', JSON.stringify(req.user, null, 2));
  console.log('BODY:', JSON.stringify(req.body, null, 2));

  try {
    // Get user id from token
    const userId = req.user.id;
    // Get shipping_address from req.body frontend data
    const { shipping_address } = req.body;
    // If userId not presents.
    if (!userId) return handleResponse(res, 401, 'Unauthorized.');
    // Validation data
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
    // Calculate total price in cart
    const totals = await computeCartTotalForUserService(userId);
    // Validation totals
    if (!totals || typeof totals.totalDecimal !== 'number') {
      console.error('createOrder: totals malformed', { userId, totals });
      return handleResponse(res, 500, 'Server error computing cart total.');
    }
    if (totals.totalDecimal <= 0) {
      console.log(`User ${userId} cart is empty. Total: ${totals.totalDecimal}`);
      return handleResponse(res, 400, 'Cart is empty');
    }
    // Format values to number
    const value = Number(totals.totalDecimal).toFixed(2);

    // ✅ ULTRA-SIMPLIFIED PAYLOAD - Remove shipping to test
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { 
            currency_code: 'USD', 
            value 
          },
          description: 'T-Shop Purchase',
          custom_id: String(userId),
        },
      ],
      application_context: {
        brand_name: 'T-Shop',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?success=true`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?canceled=true`,
      },
    };

    // ✅ Get access token
    const accessToken = await getAccessToken();
    // Endpoint paypal checkout
    const url = `${PAYPAL_BASE}/v2/checkout/orders`;
    // Sending data to paypal
    console.log('📤 Sending SIMPLIFIED to PayPal API:', JSON.stringify(payload, null, 2));

    // ✅ Send request to PayPal
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${userId}-${Date.now()}`,
        'Prefer': 'return=representation'
      },
    });
    // Order data from response
    const order = response.data;
    // Log data
    console.log('✅ [PP][CREATE] orderId=', order.id);
    console.log('✅ Full PayPal Response:', JSON.stringify(order, null, 2));
    // Return success message.
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

// Enhanced capture with detailed logging
// capture (finalize charge) for a PayPal order server-side.
const captureOrder = async (req, res, next) => {
  try {
    // Get orderId from req.params
    const orderId = req.params.orderId;
    // If orderId is not present.
    if (!orderId) return res.status(400).json({ error: 'orderId required' });
    // Log the capture order id
    console.log('🔄 Attempting to capture order:', orderId);
    // Get access token
    const accessToken = await getAccessToken();
    // Endpoint paypal checkout
    const url = `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`;
    // Send request
    const response = await axios.post(url, {}, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000
    });
    // log success capture data
    console.log('✅ Capture successful:', JSON.stringify(response.data, null, 2));
    // Get debugId
    const debugId = response.headers['paypal-debug-id'];
    console.log('PayPal capture debug id:', debugId);
    // Return success message
    return res.status(200).json({ 
      success: true,
      capture: response.data,
      debugId 
    });
  } catch (err) {
    console.error('❌ captureOrder error:', err.response?.data ?? err.message);
    console.error('❌ Full error:', JSON.stringify(err.response?.data, null, 2));
    
    return res.status(400).json({ 
      error: 'capture failed', 
      details: err.response?.data,
      debugId: err.response?.headers?.['paypal-debug-id']
    });
  }
}

// verify payment, ensure idempotency, create order in your DB, and attach payment info.
const finalizeOrder = async (req, res, next) => {
  try {
    // Get userId from token
    const userId = req.user?.id;
    // Get address from req.body and provider, payment_ref
    const { street, city, country, postal_code, phone_number, payment_provider, payment_reference } = req.body;
    // log the received data
    console.log('📥 finalizeOrder received:', {
      userId,
      street,
      city,
      country,
      postal_code,
      phone_number,
      payment_provider,
      payment_reference
    });
    // If userId is not present
    if (!userId) return handleResponse(res, 401, 'Unauthorized.');
    // Validation address
    if (!street || !city || !country || !postal_code || !phone_number) {
      return handleResponse(res, 400, 'Missing address fields');
    }

    // ✅ Check for idempotency: if payment_reference already used
    if (payment_provider && payment_reference) {
      // Find order in orders table
      const existing = await findOrderByPaymentService(payment_provider, payment_reference);
      if (existing) {
        console.log('⚠️ Order already exists for payment reference:', payment_reference);
        return handleResponse(res, 200, 'Order already created', { 
          ok: true, 
          order_id: existing.id 
        });
      }
    }

    // ✅ Verify PayPal payment if payment_reference provided
    if (payment_provider === 'paypal' && payment_reference) {
      try {
        // Get accessToken
        const accessToken = await getAccessToken();
        
        // Try to get capture details first
        let captureRes;

        try {
          // Get the captureRes
          captureRes = await axios.get(
            `${PAYPAL_BASE}/v2/payments/captures/${payment_reference}`,
            {
              headers: { 
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 8000,
            }
          );
        } catch (captureErr) {
          // If capture not found, try getting order details instead
          console.log('⚠️ Could not fetch capture, trying order details...');
          // Get orderRes details
          const orderRes = await axios.get(
            `${PAYPAL_BASE}/v2/checkout/orders/${payment_reference}`,
            {
              headers: { 
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 8000,
            }
          );
          
          // Extract capture from order
          const captures = orderRes.data?.purchase_units?.[0]?.payments?.captures;
          if (captures && captures.length > 0) {
            captureRes = { data: captures[0] };
          } else {
            throw new Error('No capture found in order');
          }
        }
        // Get status of orders
        const capStatus = captureRes.data?.status;
        // Get amount of orders
        const capturedAmount = Number(captureRes.data?.amount?.value || 0);
        
        console.log('✅ PayPal verification:', { capStatus, capturedAmount });
        // If not completed
        if (capStatus !== 'COMPLETED') {
          return handleResponse(res, 400, 'Payment not completed', { status: capStatus });
        }

        // Verify amount matches cart total
        const { totalDecimal } = await computeCartTotalForUserService(userId);
        // Validation
        if (Math.abs(capturedAmount - totalDecimal) > 0.01) {
          return handleResponse(res, 400, 'Payment amount mismatch', {
            expected: totalDecimal.toFixed(2),
            captured: capturedAmount.toFixed(2),
          });
        }
        
        console.log('✅ Amount verified:', { expected: totalDecimal, captured: capturedAmount });
      } catch (verifyErr) {
        console.error('❌ PayPal verification error:', verifyErr.response?.data || verifyErr.message);
        return handleResponse(res, 400, 'Failed to verify PayPal payment', {
          error: verifyErr.message
        });
      }
    }

    // ✅ Create order in database
    console.log('🔄 Creating order in database...');
    // Added user address to db
    const result = await placeOrderService(userId, street, city, country, postal_code, phone_number);
    
    if (!result || !result.order_id) {
      return handleResponse(res, 500, 'Failed to create order in database');
    }

    console.log('✅ Order created:', result);

    // ✅ Update payment information
    if (payment_provider && payment_reference) {
      // Call updateOrderPaymentService to update payment_provider, payment_ref and status in db
      await updateOrderPaymentService(
        result.order_id, 
        payment_provider, 
        payment_reference, 
        'completed'
      );
      console.log('✅ Payment info updated');
    }
    // Return success message.
    return handleResponse(res, 200, 'Order finalized successfully', { 
      ok: true, 
      order: result 
    });
  } catch (err) {
    console.error('❌ finalizeOrder error:', err);
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