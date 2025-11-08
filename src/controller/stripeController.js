const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { findOrderById, markOrderPaid } = require('../model/stripeModel');
const handleResponse = require('../utils/handleResponse');
const { computeCartTotalForUserService } = require('../model/cartModel');

// Create payment intent for an existing order
const createPaymentIntent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cart, address } = req.body;

    console.log('createPaymentIntent called. body:', req.body);
    if (!cart || cart.length === 0)
      return handleResponse(res, 400, "Cart is empty");

    // compute total from cart
    const totalAmount = await computeCartTotalForUserService(userId);
    const amount = Math.round(totalAmount * 100);

    // create PaymentIntent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: process.env.STRIPE_CURRENCY || "usd",
      metadata: {
        user_id: String(userId),
        address: JSON.stringify(address),
        cart: JSON.stringify(cart),
      },
      automatic_payment_methods: { enabled: true },
    });
    // Return clientSecret to frontend
    return handleResponse(res, 200, "PaymentIntent created", {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("createPaymentIntent error:", error);
    next(error);
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // handle successful payments
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const metadata = pi.metadata;
    const userId = Number(metadata.user_id);

    console.log("✅ Payment succeeded, creating order for user:", userId);

    try {
      // parse address & cart from metadata
      const address = JSON.parse(metadata.address);
      const cart = JSON.parse(metadata.cart);

      // create order now
      const newOrder = await placeOrderService(
        userId,
        address.street,
        address.city,
        address.country,
        address.postal_code,
        address.phone_number,
        cart, // optional, if you refactor to accept direct cart items
        "stripe",
        pi.id
      );

      // mark paid (or your service can mark paid immediately)
      await markOrderPaid()

      console.log(`✅ Order ${newOrder.order_id} created and marked as paid`);
    } catch (err) {
      console.error("⚠️ Failed to create order after payment:", err);
    }
  }

  res.sendStatus(200);
};

module.exports = {
  createPaymentIntent,
  handleWebhook
}