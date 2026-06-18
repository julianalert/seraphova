import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPaymentIntent(orderId: string, email: string) {
  const intent = await stripe.paymentIntents.create({
    amount:        100,            // $1.00 in cents (debug)
    currency:      'usd',
    metadata:      { orderId },
    receipt_email: email,
    description:   'Seraphova — Daily Personalized Horoscope (365 readings)',
    automatic_payment_methods: { enabled: true },
  });
  return intent;
}
