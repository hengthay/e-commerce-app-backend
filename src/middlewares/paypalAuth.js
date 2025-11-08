// utils/paypalAuth.js
const axios = require('axios');
require('dotenv').config();

const PAYPAL_BASE = process.env.PAYPAL_ENVIRONMENT === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('PayPal credentials missing in environment. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
}

let cached = null;
let inFlight = null;

async function getAccessToken() {
  if (cached && cached.expiresAt && Date.now() < cached.expiresAt) {
    return cached.token;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const url = `${PAYPAL_BASE}/v1/oauth2/token`;
      const params = new URLSearchParams({ grant_type: 'client_credentials' }).toString();

      const res = await axios.post(url, params, {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const data = res.data;
      if (!data?.access_token) {
        throw new Error('Unexpected PayPal token response: ' + JSON.stringify(data));
      }

      const expiresIn = Number(data.expires_in) || 32400;
      const expiresAt = Date.now() + expiresIn * 1000 - 60 * 1000;

      cached = { token: data.access_token, expiresAt };
      return data.access_token;
    } catch (err) {
      cached = null;
      console.error('getAccessToken error:', err.response?.data ?? err.message ?? err);
      throw err;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

module.exports = { getAccessToken, PAYPAL_BASE };
