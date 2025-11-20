const dotenv = require('dotenv');
dotenv.config();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyIdToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  return ticket.getPayload(); // contains email, sub, name, picture
}

module.exports = verifyIdToken;