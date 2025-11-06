// lib/paypalClient.js
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * Builds a PayPal client using env:
 *  - PAYPAL_ENVIRONMENT = 'sandbox' | 'live'
 *  - PAYPAL_CLIENT_ID
 *  - PAYPAL_CLIENT_SECRET
 */
function buildPaypalClient() {
  const { PAYPAL_ENVIRONMENT, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  const env =
    PAYPAL_ENVIRONMENT === 'live'
      ? new checkoutNodeJssdk.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
      : new checkoutNodeJssdk.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);

  return new checkoutNodeJssdk.core.PayPalHttpClient(env);
}

module.exports = { buildPaypalClient };
