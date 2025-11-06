// src/utils/paypalAuth.js
const axios = require('axios');
require('dotenv').config();

const PAYPAL_BASE =
  (process.env.PAYPAL_ENVIRONMENT === 'live')
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('PayPal credentials missing in environment. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
}

// Simple in-memory cache for token { token, expiresAt }
let cached = null;

async function getAccessToken() {
  try {
    // return cached if still valid
    if (cached && cached.expiresAt && Date.now() < cached.expiresAt) {
      return cached.token;
    }

    const url = `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`;
    const body = 'grant_type=client_credentials';

    const res = await axios.post(url, body, {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 10_000
    });

    // response sample: { access_token, expires_in, token_type, scope }
    const data = res.data;
    if (!data || !data.access_token) {
      throw new Error('Unexpected PayPal token response: ' + JSON.stringify(data));
    }

    // cache until shortly before expiry (expires_in is seconds)
    const expiresIn = Number(data.expires_in) || 32400; // fallback
    const expiresAt = Date.now() + (expiresIn * 1000) - (60 * 1000); // subtract 60s safety

    cached = {
      token: data.access_token,
      expiresAt
    };

    // console.log('Token', data.access_token);

    return data.access_token;
  } catch (error) {
    // rethrow useful info
    console.error('getAccessToken error:', error.response?.data ?? error.message ?? error);
    throw error;
  }
}

module.exports = { getAccessToken, PAYPAL_BASE };
