import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(
  orderId: string,
  email:   string,
  baseUrl: string,
) {
  const session = await stripe.checkout.sessions.create({
    mode:           'payment',
    customer_email: email,
    metadata:       { orderId },
    // Pass orderId to the underlying payment intent so the webhook still works
    payment_intent_data: { metadata: { orderId } },
    line_items: [
      {
        price_data: {
          currency:     'usd',
          unit_amount:  4700,          // $47.00
          product_data: {
            name:        'Seraphova — Daily Personalized Horoscope',
            description: '365 daily readings based on your full natal chart',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/success?order_id=${orderId}`,
    cancel_url:  `${baseUrl}/order?id=${orderId}`,
  });
  return session;
}
