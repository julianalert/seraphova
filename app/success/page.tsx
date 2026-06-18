'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId      = searchParams.get('order_id');

  const [tomorrow, setTomorrow] = useState('');

  const firstName    = typeof window !== 'undefined' ? sessionStorage.getItem('sera_name')     ?? '' : '';
  const email        = typeof window !== 'undefined' ? sessionStorage.getItem('sera_email')    ?? '' : '';
  const deliveryTime = typeof window !== 'undefined' ? sessionStorage.getItem('sera_delivery') ?? '7am' : '7am';

  useEffect(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    setTomorrow(tom.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    // Clear payment session data
    sessionStorage.removeItem('sera_pi_secret');
  }, []);

  return (
    <div className="page">
      <nav>
        <Link href="/" className="nav-logo">✦ Seraphova</Link>
      </nav>

      <main className="success-main">
        <span className="success-glyph">✦</span>
        <h1 className="success-title">
          {firstName ? `${firstName}, your` : 'Your'} chart<br />is <em>ready.</em>
        </h1>
        <p className="success-body">
          Payment confirmed. Your first personalized reading will arrive tomorrow morning at{' '}
          <strong>{deliveryTime.toUpperCase()}</strong> — written from your natal chart, just for you.
        </p>

        <div className="success-card">
          <div className="success-card-header">Your reading details</div>
          <div className="success-rows">
            {email && (
              <div className="success-row">
                <span className="s-key">Reading delivered to</span>
                <span className="s-val">{email}</span>
              </div>
            )}
            <div className="success-row">
              <span className="s-key">Daily delivery time</span>
              <span className="s-val">{deliveryTime.toUpperCase()}</span>
            </div>
            {tomorrow && (
              <div className="success-row">
                <span className="s-key">First reading</span>
                <span className="s-val">{tomorrow}</span>
              </div>
            )}
            <div className="success-row">
              <span className="s-key">Duration</span>
              <span className="s-val">365 daily readings</span>
            </div>
          </div>
        </div>

        <p className="success-note">
          Check your inbox — a welcome email is on its way. If you don&apos;t see it in a few minutes, check your spam folder.
        </p>

        <Link href="/" className="btn-home">← Back to Seraphova</Link>
      </main>

      <footer>
        <p className="footer-note">
          <a href="#">Privacy policy</a> · <a href="#">Terms of service</a>
        </p>
      </footer>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <style>{successCSS}</style>
      <div className="stars" />
      <div className="aurora" />
      <Suspense>
        <SuccessContent />
      </Suspense>
    </>
  );
}

const successCSS = `
.page { position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; }
nav { padding:20px 32px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); background:rgba(8,9,15,0.8); backdrop-filter:blur(20px); }
.nav-logo { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:400; letter-spacing:0.16em; color:var(--gold2); text-transform:uppercase; text-decoration:none; }

.success-main { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:60px 24px 80px; }
.success-glyph { font-size:56px; margin-bottom:24px; display:block; animation:glyph-pulse 2.5s ease-in-out infinite; }
@keyframes glyph-pulse { 0%,100%{filter:drop-shadow(0 0 10px rgba(201,168,76,0.3))} 50%{filter:drop-shadow(0 0 28px rgba(201,168,76,0.75))} }
.success-title { font-family:'Cormorant Garamond',serif; font-size:clamp(36px,6vw,52px); font-weight:300; line-height:1.15; color:var(--text); margin-bottom:16px; }
.success-title em { font-style:italic; color:var(--gold2); }
.success-body { font-size:17px; color:var(--muted); line-height:1.8; max-width:420px; margin:0 auto 40px; }
.success-body strong { color:var(--text); font-weight:500; }

.success-card { width:100%; max-width:420px; background:var(--card); border:1px solid var(--border2); border-radius:var(--r2); overflow:hidden; margin-bottom:24px; box-shadow:0 24px 60px rgba(0,0,0,0.45); }
.success-card-header { background:linear-gradient(150deg,#0e1120,#12162a); padding:18px 24px; border-bottom:1px solid var(--border); font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); }
.success-rows { padding:6px 0; }
.success-row { display:flex; justify-content:space-between; align-items:center; padding:14px 24px; border-bottom:1px solid var(--border); font-size:14px; }
.success-row:last-child { border-bottom:none; }
.s-key { color:var(--muted); }
.s-val { color:var(--text); font-weight:500; }

.success-note { font-size:13px; color:var(--muted2); max-width:380px; line-height:1.65; margin-bottom:32px; }
.btn-home { display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--muted2); text-decoration:none; transition:color 0.2s ease; }
.btn-home:hover { color:var(--muted); }

footer { border-top:1px solid var(--border); padding:28px 24px; text-align:center; }
.footer-note { font-size:12px; color:var(--muted2); }
.footer-note a { color:var(--muted); text-decoration:underline; text-underline-offset:3px; }
`;
