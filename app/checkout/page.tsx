'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Payment form ─────────────────────────────────────────────────────────────

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();

  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success?order_id=${orderId}`,
      },
    });

    // If we reach here, payment failed (successful payments redirect away)
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        }}
      />
      {error && <p className="pay-error">{error}</p>}
      <button className="btn-pay" type="submit" disabled={!stripe || paying}>
        {paying ? 'Processing…' : 'Pay $47 — Start my readings'}
      </button>
      <p className="pay-note">One-time payment. No recurring charges.</p>
    </form>
  );
}

// ─── Main checkout page ───────────────────────────────────────────────────────

function CheckoutContent() {
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId,      setOrderId]      = useState<string | null>(null);
  const [error,        setError]        = useState('');

  useEffect(() => {
    const secret = sessionStorage.getItem('sera_pi_secret');
    const id     = sessionStorage.getItem('sera_order_id');

    if (!secret || !id) {
      router.push('/start');
      return;
    }

    setClientSecret(secret);
    setOrderId(id);
  }, [router]);

  const firstName = typeof window !== 'undefined'
    ? sessionStorage.getItem('sera_name') ?? ''
    : '';

  if (error) {
    return (
      <div className="checkout-error">
        <p>{error}</p>
        <Link href="/start">← Start over</Link>
      </div>
    );
  }

  if (!clientSecret || !orderId) return null;

  return (
    <div className="page">
      <nav>
        <Link href="/" className="nav-logo">✦ Seraphova</Link>
        <span className="nav-secure">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="10" height="7" rx="1.5" />
            <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
          </svg>
          Secured by Stripe
        </span>
      </nav>

      <main className="checkout-main">
        <div className="checkout-wrap">

          {/* Left — summary */}
          <div className="checkout-summary">
            <p className="summary-eyebrow">✦ Seraphova</p>
            <h1 className="summary-title">
              {firstName ? `${firstName}'s` : 'Your'} daily reading
            </h1>
            <div className="summary-price">
              <span className="summary-amount">$47</span>
              <span className="summary-period">one-time · 365 mornings</span>
            </div>

            <ul className="summary-features">
              {[
                'Full natal chart reading, every day',
                'Real-time transits mapped to your chart',
                'Delivered at 7 AM before your day starts',
                'One payment — no subscription, ever',
              ].map(f => (
                <li key={f}>
                  <span className="summary-check">✦</span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="summary-guarantee">
              <span className="guarantee-icon">↩</span>
              <div>
                <div className="guarantee-title">7-day money-back guarantee</div>
                <div className="guarantee-desc">If it doesn&apos;t feel genuinely personal, email us within 7 days for a full refund.</div>
              </div>
            </div>
          </div>

          {/* Right — Stripe Payment Element */}
          <div className="checkout-form-wrap">
            <div className="checkout-card">
              <p className="form-label">Complete your payment</p>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary:    '#c9a84c',
                      colorBackground: '#0d0f1a',
                      colorText:       '#e8e4da',
                      colorDanger:     '#dc6450',
                      borderRadius:    '8px',
                      fontFamily:      'DM Sans, sans-serif',
                    },
                  },
                }}
              >
                <PaymentForm orderId={orderId} />
              </Elements>
            </div>
          </div>

        </div>
      </main>

      <footer>
        <p className="footer-note">
          <a href="#">Privacy policy</a> · <a href="#">Terms of service</a>
        </p>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <style>{checkoutCSS}</style>
      <div className="stars" />
      <div className="aurora" />
      <Suspense>
        <CheckoutContent />
      </Suspense>
    </>
  );
}

const checkoutCSS = `
.page { position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; }
nav { padding:20px 32px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); background:rgba(8,9,15,0.8); backdrop-filter:blur(20px); }
.nav-logo { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:400; letter-spacing:0.16em; color:var(--gold2); text-transform:uppercase; text-decoration:none; }
.nav-secure { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted2); }
.nav-secure svg { width:13px; height:13px; color:var(--green); }

.checkout-main { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:60px 24px 80px; }
.checkout-wrap { width:100%; max-width:860px; display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:start; }

.checkout-summary { padding-top:8px; }
.summary-eyebrow { font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:20px; }
.summary-title { font-family:'Cormorant Garamond',serif; font-size:clamp(28px,4vw,40px); font-weight:300; line-height:1.2; color:var(--text); margin-bottom:24px; }
.summary-price { display:flex; align-items:baseline; gap:10px; margin-bottom:32px; }
.summary-amount { font-family:'Cormorant Garamond',serif; font-size:56px; font-weight:300; color:var(--text); line-height:1; }
.summary-amount::before { content:'$'; font-size:24px; vertical-align:super; margin-right:2px; color:var(--muted); }
.summary-period { font-size:13px; color:var(--muted2); }
.summary-features { list-style:none; display:flex; flex-direction:column; gap:12px; margin-bottom:32px; }
.summary-features li { display:flex; align-items:center; gap:12px; font-size:14px; color:var(--muted); }
.summary-check { color:var(--gold); font-size:9px; flex-shrink:0; }
.summary-guarantee { display:flex; align-items:flex-start; gap:12px; padding:16px; background:var(--gold-glow); border:1px solid rgba(201,168,76,0.12); border-radius:var(--r); }
.guarantee-icon { font-size:22px; flex-shrink:0; margin-top:1px; }
.guarantee-title { font-size:13px; font-weight:600; color:var(--text); margin-bottom:4px; }
.guarantee-desc { font-size:12px; color:var(--muted); line-height:1.5; }

.checkout-form-wrap { }
.checkout-card { background:var(--card); border:1px solid var(--border2); border-radius:var(--r2); padding:32px; box-shadow:0 24px 60px rgba(0,0,0,0.4); }
.form-label { font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:24px; }

.btn-pay { width:100%; margin-top:24px; display:flex; align-items:center; justify-content:center; gap:10px; background:linear-gradient(135deg,var(--gold) 0%,var(--gold3) 100%); color:#08090f; font-weight:600; font-size:14px; letter-spacing:0.08em; text-transform:uppercase; padding:18px; border-radius:100px; border:none; cursor:pointer; transition:all 0.25s ease; box-shadow:0 0 36px rgba(201,168,76,0.2); font-family:'DM Sans',sans-serif; }
.btn-pay:hover { transform:translateY(-2px); box-shadow:0 8px 40px rgba(201,168,76,0.35); }
.btn-pay:disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }
.pay-error { font-size:13px; color:var(--error); margin-top:16px; padding:12px 16px; background:var(--error-dim); border-radius:var(--r); border:1px solid rgba(220,100,80,0.2); }
.pay-note { text-align:center; margin-top:14px; font-size:12px; color:var(--muted2); }

.checkout-error { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; text-align:center; gap:16px; padding:40px; }
.checkout-error p { color:var(--muted); font-size:16px; }
.checkout-error a { font-size:14px; color:var(--gold2); text-decoration:none; }

footer { border-top:1px solid var(--border); padding:28px 24px; text-align:center; }
.footer-note { font-size:12px; color:var(--muted2); }
.footer-note a { color:var(--muted); text-decoration:underline; text-underline-offset:3px; }

@media (max-width:720px) {
  .checkout-wrap { grid-template-columns:1fr; gap:32px; }
  .checkout-main { padding:40px 16px 60px; }
}
`;
