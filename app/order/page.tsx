'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PreviewData {
  reading: {
    greeting:       string;
    body:           string;
    key_insight:    string;
    tags:           string[];
    dominant_theme: string;
  };
  chart: {
    rising: string | null;
    moon:   string;
    sun:    string;
  };
  firstName: string;
}

// ─── Loading screen shown while Claude generates the preview ─────────────────

function LoadingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1400),
      setTimeout(() => setStep(2), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    { label: 'Mapping your natal chart' },
    { label: 'Reading today\'s planetary transits' },
    { label: 'Writing your personal reading' },
  ];

  return (
    <div id="loadingScreen">
      <div className="loading-orb" />
      <h2 className="loading-title">Reading the sky<br /><em>for you…</em></h2>
      <p className="loading-sub">Your chart is being interpreted</p>
      <div className="loading-steps">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`loading-step ${i < step ? 'done' : i === step ? 'active' : ''}`}
          >
            <div className="step-icon">{i < step ? '✓' : '⟳'}</div>
            <p>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main order page content ──────────────────────────────────────────────────

function OrderContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const orderId      = searchParams.get('id');

  const [preview, setPreview]     = useState<PreviewData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [paying, setPaying]       = useState(false);

  // Minimal data from sessionStorage (set by /start)
  const firstName    = typeof window !== 'undefined' ? sessionStorage.getItem('sera_name') ?? '' : '';
  const email        = typeof window !== 'undefined' ? sessionStorage.getItem('sera_email') ?? '' : '';
  const deliveryTime = typeof window !== 'undefined' ? sessionStorage.getItem('sera_delivery') ?? '7am' : '7am';

  useEffect(() => {
    if (!orderId) { router.push('/start'); return; }

    const minLoadMs   = 4400; // let loading animation breathe
    const fetchStart  = Date.now();

    fetch(`/api/orders/${orderId}/preview`)
      .then(res => {
        if (!res.ok) throw new Error('Preview failed');
        return res.json();
      })
      .then((data: PreviewData) => {
        const elapsed    = Date.now() - fetchStart;
        const remaining  = Math.max(0, minLoadMs - elapsed);
        setTimeout(() => {
          setPreview(data);
          setLoading(false);
        }, remaining);
      })
      .catch(err => {
        console.error(err);
        setError('We couldn\'t generate your preview. Please try refreshing.');
        setLoading(false);
      });
  }, [orderId, router]);

  // ─── Handle checkout (Sprint 4 will replace this) ──────────────────────────
  async function handleCheckout() {
    setPaying(true);
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (json.clientSecret) {
        // Stripe Payment Element flow (wired in Sprint 4)
        sessionStorage.setItem('sera_pi_secret',  json.clientSecret);
        sessionStorage.setItem('sera_order_id',   orderId!);
        router.push('/checkout');
      } else if (json.error) {
        alert(json.error);
        setPaying(false);
      }
    } catch {
      alert('Payment setup failed. Please try again.');
      setPaying(false);
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 24 }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-order" style={{ maxWidth: 240 }}>Try again</button>
      </div>
    );
  }

  const r    = preview!.reading;
  const name = preview!.firstName || firstName;

  // Split body into paragraphs
  const paragraphs = r.body.split('\n\n').filter(Boolean);

  return (
    <div className="page" id="mainPage">
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

      <div id="orderPage" className="visible">
        <div className="order-wrap">
          <div className="two-col">

            {/* ─── LEFT COLUMN ─── */}
            <div className="col-left">

              <div className="order-header">
                <p className="order-eyebrow">Your reading is ready</p>
                <h1 className="order-title">Here&apos;s a glimpse of<br /><em>today&apos;s horoscope.</em></h1>
              </div>

              {/* Horoscope preview */}
              <div className="horoscope-preview">
                <div className="horo-top-bar">
                  <div className="horo-dots">
                    <div className="horo-dot" /><div className="horo-dot" /><div className="horo-dot" />
                  </div>
                  <span className="horo-bar-title">Seraphova · Today&apos;s Reading</span>
                  <span className="horo-bar-badge">Generated for you</span>
                </div>
                <div className="horo-body">
                  <div className="horo-date-row">
                    <span className="horo-date">{today}</span>
                    <div className="horo-divider-line" />
                  </div>
                  <div className="horo-greeting">{r.greeting}</div>
                  {paragraphs.map((p, i) => (
                    <p key={i} className="horo-text">{p}</p>
                  ))}
                  <div className="horo-insight">
                    <p className="horo-insight-label">Today&apos;s key insight</p>
                    <p className="horo-insight-text">&ldquo;{r.key_insight}&rdquo;</p>
                  </div>
                  <div className="horo-blur-wrap">
                    <div className="horo-tags">
                      {r.tags.map(tag => (
                        <span key={tag} className="horo-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ height: 48, position: 'relative' }}>
                  <div className="horo-blur-overlay">
                    <p className="horo-unlock-note">✦ &nbsp; Unlock the full reading — and every morning after</p>
                  </div>
                </div>
              </div>

              {/* What's included */}
              <p className="section-label">What you get every morning</p>
              <ul className="includes-list">
                {[
                  { icon: '🌙', text: <><strong>A reading built from your full natal chart</strong> — not your sun sign. Every planet, every house, every placement shapes what you receive.</> },
                  { icon: '🌍', text: <><strong>Real-time transits, mapped to your chart</strong> — what Venus stationing direct means for you specifically, not for Libras in general.</> },
                  { icon: '💫', text: <><strong>One clear, actionable insight</strong> — not a wall of cosmic theory. Something specific to carry into your day.</> },
                  { icon: '📬', text: <><strong>Delivered at {deliveryTime.toUpperCase()}, every morning</strong> — in your inbox before your day starts. No app to open, nothing to remember.</> },
                  { icon: '🔮', text: <><strong>New moon &amp; full moon callouts</strong> — flagged in advance, always interpreted through your personal chart.</> },
                ].map((item, i) => (
                  <li key={i}>
                    <div className="inc-icon">{item.icon}</div>
                    <div>{item.text}</div>
                  </li>
                ))}
              </ul>

              {/* Comparison */}
              <p className="section-label" style={{ marginTop: 8 }}>How Seraphova compares</p>
              <div className="comparison-block">
                <div className="comparison-header">
                  <span>Feature</span>
                  <span>Generic horoscope</span>
                  <span>Seraphova</span>
                </div>
                {[
                  'Full natal chart used',
                  'Real daily transits',
                  'Written just for you',
                  'Arrives in your inbox',
                  'No app to open',
                ].map(f => (
                  <div className="comparison-row" key={f}>
                    <span className="cr-feature">{f}</span>
                    <span className="cr-no">✕</span>
                    <span className="cr-yes">✦</span>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="mini-testi">
                <div className="mini-testi-stars">★★★★★</div>
                <blockquote>&ldquo;I&apos;ve used Co-Star for three years. The first Seraphova reading mentioned something I&apos;d only talked about in therapy. That&apos;s not a sun sign horoscope. That&apos;s something else entirely.&rdquo;</blockquote>
                <cite><strong>Léa M.</strong> · Capricorn Sun · Scorpio Rising · Paris</cite>
              </div>

            </div>

            {/* ─── RIGHT COLUMN — sticky panel ─── */}
            <div className="col-right">
              <div className="order-panel">

                <div className="panel-header">
                  <p className="panel-eyebrow">Daily Personalized Horoscope</p>
                  <div className="panel-price-row">
                    <span className="panel-currency">$</span>
                    <span className="panel-amount">47</span>
                  </div>
                  <p className="panel-period">one-time · 365 daily readings</p>
                  <div className="panel-launch-badge">
                    <span className="panel-badge-dot" />
                    Early access price
                  </div>
                </div>

                <div className="panel-body">
                  <ul className="panel-includes">
                    <li>Full natal chart reading (every planet)</li>
                    <li>365 daily emails — one every morning</li>
                    <li>Real-time transits on your chart</li>
                    <li>New moon &amp; full moon callouts</li>
                    <li>No subscription — one payment, one year</li>
                  </ul>

                  <div className="panel-divider" />

                  <button className="btn-order" onClick={handleCheckout} disabled={paying}>
                    {paying ? (
                      'Redirecting to payment…'
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" />
                          <path d="M1 10h22" />
                        </svg>
                        Get my year of readings — $47
                      </>
                    )}
                  </button>

                  <div className="card-logos">
                    <span className="card-logo visa">VISA</span>
                    <span className="card-logo mc">MC</span>
                    <span className="card-logo amex">AMEX</span>
                    <span className="card-logo apple">&#63743; Pay</span>
                  </div>

                  <div className="trust-signals">
                    <div className="trust-sig"><span className="trust-sig-icon">🔒</span> Secured by Stripe · 256-bit SSL</div>
                    <div className="trust-sig"><span className="trust-sig-icon">📧</span> First reading arrives tomorrow at {deliveryTime.toUpperCase()}</div>
                    <div className="trust-sig"><span className="trust-sig-icon">🚫</span> One payment — no recurring charges, ever</div>
                    <div className="trust-sig"><span className="trust-sig-icon">🛡</span> Your chart data is private, never shared</div>
                  </div>

                  <div className="panel-divider" />

                  <div className="order-guarantee">
                    <span className="og-icon">↩</span>
                    <div>
                      <div className="og-title">7-day money-back guarantee</div>
                      <div className="og-desc">If the readings don&apos;t feel genuinely personal to you, email us within 7 days for a full refund. No questions, no hoops.</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <footer>
        <p className="footer-note">
          <a href="#">Privacy policy</a> · <a href="#">Terms of service</a>
        </p>
      </footer>
    </div>
  );
}

export default function OrderPage() {
  return (
    <>
      <style>{orderCSS}</style>
      <div className="stars" />
      <div className="aurora" />
      <Suspense fallback={<LoadingScreen />}>
        <OrderContent />
      </Suspense>
    </>
  );
}

const orderCSS = `
#loadingScreen {
  position: fixed; inset: 0; z-index: 200;
  background: var(--night);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 40px;
}
.loading-orb {
  width: 100px; height: 100px; border-radius: 50%;
  border: 1px solid rgba(201,168,76,0.2);
  position: relative; margin-bottom: 40px;
  animation: orb-pulse 2.4s ease-in-out infinite;
}
.loading-orb::before {
  content: ''; position: absolute; inset: 8px; border-radius: 50%;
  border: 1px solid rgba(201,168,76,0.15);
  animation: orb-rotate 4s linear infinite;
}
.loading-orb::after {
  content: '✦'; position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; color: var(--gold2);
  animation: glyph-glow 2.4s ease-in-out infinite;
}
@keyframes orb-pulse { 0%,100%{box-shadow:0 0 20px rgba(201,168,76,0.15)} 50%{box-shadow:0 0 48px rgba(201,168,76,0.4)} }
@keyframes orb-rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes glyph-glow { 0%,100%{filter:drop-shadow(0 0 4px rgba(201,168,76,0.4))} 50%{filter:drop-shadow(0 0 16px rgba(201,168,76,0.9))} }
.loading-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300; color:var(--text); margin-bottom:8px; line-height:1.3; }
.loading-title em { font-style:italic; color:var(--gold2); }
.loading-sub { font-size:14px; color:var(--muted); margin-bottom:40px; }
.loading-steps { display:flex; flex-direction:column; gap:12px; max-width:320px; width:100%; }
.loading-step { display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--card); border:1px solid var(--border); border-radius:var(--r); text-align:left; opacity:0.35; transition:all 0.4s ease; }
.loading-step.active { opacity:1; border-color:rgba(201,168,76,0.3); background:var(--card2); }
.loading-step.done { opacity:0.7; border-color:rgba(90,184,138,0.2); }
.step-icon { width:28px; height:28px; border-radius:50%; border:1px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; transition:all 0.3s ease; }
.loading-step.active .step-icon { border-color:rgba(201,168,76,0.4); background:var(--gold-dim); animation:spin-icon 1s linear infinite; }
.loading-step.done .step-icon { border-color:rgba(90,184,138,0.4); background:var(--green-dim); animation:none; }
@keyframes spin-icon { to{transform:rotate(360deg)} }
.loading-step p { font-size:13px; color:var(--muted); }
.loading-step.active p { color:var(--text); }

.page { position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; }
nav { padding:20px 32px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); background:rgba(8,9,15,0.8); backdrop-filter:blur(20px); }
.nav-logo { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:400; letter-spacing:0.16em; color:var(--gold2); text-transform:uppercase; text-decoration:none; }
.nav-secure { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted2); }
.nav-secure svg { width:13px; height:13px; color:var(--green); }

#orderPage { display:none; }
#orderPage.visible { display:block; animation:fadeIn 0.6s ease both; }
@keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

.order-wrap { max-width:980px; margin:0 auto; padding:52px 32px 80px; }
.two-col { display:grid; grid-template-columns:1fr 380px; gap:40px; align-items:start; }
.col-right { position:sticky; top:24px; }

.order-header { margin-bottom:36px; }
.order-eyebrow { font-size:10px; font-weight:500; letter-spacing:0.22em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
.order-title { font-family:'Cormorant Garamond',serif; font-size:clamp(32px,5vw,48px); font-weight:300; line-height:1.15; }
.order-title em { font-style:italic; color:var(--gold2); }

.horoscope-preview { background:var(--card); border:1px solid var(--border2); border-radius:var(--r2); overflow:hidden; margin-bottom:32px; box-shadow:0 24px 60px rgba(0,0,0,0.45),0 0 40px rgba(201,168,76,0.05); }
.horo-top-bar { padding:14px 20px; background:var(--card3); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
.horo-dots { display:flex; gap:6px; }
.horo-dot { width:8px; height:8px; border-radius:50%; }
.horo-dot:nth-child(1){background:rgba(255,255,255,0.1)}
.horo-dot:nth-child(2){background:rgba(255,255,255,0.07)}
.horo-dot:nth-child(3){background:rgba(255,255,255,0.05)}
.horo-bar-title { font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted2); margin-left:4px; }
.horo-bar-badge { margin-left:auto; font-size:10px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; color:var(--green); background:var(--green-dim); border:1px solid rgba(90,184,138,0.2); padding:3px 10px; border-radius:100px; }
.horo-body { padding:28px 28px 24px; }
.horo-date-row { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
.horo-date { font-size:10px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:var(--gold); }
.horo-divider-line { flex:1; height:1px; background:var(--border); }
.horo-greeting { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:400; color:var(--text); margin-bottom:16px; line-height:1.3; }
.horo-text { font-size:14.5px; line-height:1.85; color:var(--muted); margin-bottom:16px; }
.horo-text strong { color:var(--text); font-weight:500; }
.horo-insight { background:var(--gold-glow); border:1px solid rgba(201,168,76,0.12); border-left:3px solid var(--gold); border-radius:0 var(--r) var(--r) 0; padding:14px 16px; margin-bottom:20px; }
.horo-insight-label { font-size:10px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:var(--gold); margin-bottom:6px; }
.horo-insight-text { font-family:'Cormorant Garamond',serif; font-size:18px; font-style:italic; color:var(--text); line-height:1.55; }
.horo-tags { display:flex; flex-wrap:wrap; gap:8px; }
.horo-tag { font-size:11px; font-weight:500; padding:5px 12px; border-radius:100px; border:1px solid var(--border2); color:var(--accent2); background:rgba(155,142,196,0.07); }
.horo-blur-wrap { position:relative; margin-top:0; }
.horo-blur-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 0%,var(--card) 75%); border-radius:0 0 var(--r2) var(--r2); display:flex; align-items:flex-end; justify-content:center; padding-bottom:28px; }
.horo-unlock-note { font-size:12px; color:var(--muted2); text-align:center; }

.section-label { font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:16px; }
.includes-list { list-style:none; display:flex; flex-direction:column; gap:14px; margin-bottom:32px; }
.includes-list li { display:flex; align-items:flex-start; gap:14px; font-size:15px; color:var(--muted); line-height:1.6; }
.inc-icon { width:32px; height:32px; border-radius:8px; background:var(--gold-dim); border:1px solid rgba(201,168,76,0.18); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; margin-top:1px; }
.includes-list li strong { color:var(--text); font-weight:500; }

.comparison-block { background:var(--card); border:1px solid var(--border); border-radius:var(--r2); overflow:hidden; margin-bottom:32px; }
.comparison-header { padding:16px 20px; border-bottom:1px solid var(--border); font-size:11px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:var(--muted2); display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.comparison-header span:last-child,.comparison-header span:nth-child(2){text-align:center}
.comparison-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; padding:14px 20px; border-bottom:1px solid var(--border); font-size:13.5px; align-items:center; }
.comparison-row:last-child{border-bottom:none}
.comparison-row span:nth-child(2),.comparison-row span:last-child{text-align:center;font-size:16px}
.cr-feature{color:var(--muted)}.cr-no{color:var(--muted2)}.cr-yes{color:var(--gold)}

.mini-testi { background:var(--card); border:1px solid var(--border); border-radius:var(--r2); padding:24px; margin-bottom:32px; }
.mini-testi-stars { color:var(--gold); letter-spacing:2px; font-size:13px; margin-bottom:12px; }
.mini-testi blockquote { font-family:'Cormorant Garamond',serif; font-size:18px; font-style:italic; font-weight:300; color:var(--text); line-height:1.65; margin-bottom:16px; }
.mini-testi cite { font-size:13px; color:var(--muted2); font-style:normal; }
.mini-testi cite strong { color:var(--muted); }

.order-panel { background:var(--card); border:1px solid var(--border2); border-radius:var(--r2); overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.45),0 0 40px rgba(201,168,76,0.06); }
.panel-header { background:linear-gradient(150deg,#0e1120 0%,#12162a 100%); padding:28px 28px 24px; border-bottom:1px solid var(--border); position:relative; overflow:hidden; }
.panel-header::after { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%); pointer-events:none; }
.panel-eyebrow { font-size:10px; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); margin-bottom:14px; position:relative; z-index:1; }
.panel-price-row { display:flex; align-items:flex-start; gap:2px; margin-bottom:2px; position:relative; z-index:1; }
.panel-currency { font-size:18px; color:var(--muted2); font-weight:300; margin-top:8px; }
.panel-amount { font-family:'Cormorant Garamond',serif; font-size:60px; font-weight:300; color:var(--text); line-height:1; }
.panel-period { font-size:12px; color:var(--muted2); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:14px; position:relative; z-index:1; }
.panel-launch-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:500; color:var(--gold2); background:var(--gold-dim); border:1px solid rgba(201,168,76,0.25); padding:5px 12px; border-radius:100px; position:relative; z-index:1; }
.panel-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--gold); animation:badge-pulse 1.5s ease-in-out infinite; }
@keyframes badge-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.panel-body { padding:24px 28px 28px; }
.panel-includes { list-style:none; display:flex; flex-direction:column; gap:0; margin-bottom:22px; }
.panel-includes li { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border); font-size:13.5px; color:var(--muted); }
.panel-includes li:last-child{border-bottom:none}
.panel-includes li::before { content:'✦'; color:var(--gold); font-size:9px; flex-shrink:0; }
.panel-divider { height:1px; background:var(--border); margin:18px 0; }

.btn-order { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:linear-gradient(135deg,var(--gold) 0%,var(--gold3) 100%); color:#08090f; font-weight:600; font-size:14px; letter-spacing:0.08em; text-transform:uppercase; padding:18px; border-radius:100px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.25s ease; box-shadow:0 0 32px rgba(201,168,76,0.22); }
.btn-order:hover{transform:translateY(-2px);box-shadow:0 8px 40px rgba(201,168,76,0.38)}
.btn-order:disabled{opacity:0.6;cursor:not-allowed;transform:none}
.btn-order svg{width:16px;height:16px;flex-shrink:0}

.card-logos { display:flex; align-items:center; justify-content:center; gap:8px; margin:14px 0 16px; }
.card-logo { display:inline-flex; align-items:center; justify-content:center; height:22px; padding:0 8px; border:1px solid var(--border2); border-radius:4px; font-size:10px; font-weight:700; letter-spacing:0.04em; }
.card-logo.visa{color:#1a1f71;background:#e8eaf6;border-color:#c5cae9}
.card-logo.mc{color:#eb001b;background:#fff3e0;border-color:#ffccbc}
.card-logo.amex{color:#007bc1;background:#e3f2fd;border-color:#b3e0f7}
.card-logo.apple{color:var(--muted);background:transparent;font-size:14px;padding:0 6px;border-color:var(--border)}

.trust-signals{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.trust-sig{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--muted2)}
.trust-sig-icon{font-size:14px;flex-shrink:0}

.order-guarantee { display:flex; align-items:flex-start; gap:14px; padding:16px 18px; background:var(--gold-glow); border:1px solid rgba(201,168,76,0.12); border-radius:var(--r); }
.og-icon{font-size:26px;flex-shrink:0;margin-top:2px}
.og-title{font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px}
.og-desc{font-size:12px;color:var(--muted);line-height:1.55}

footer { border-top:1px solid var(--border); padding:28px 24px; text-align:center; margin-top:auto; }
.footer-note{font-size:12px;color:var(--muted2)}
.footer-note a{color:var(--muted);text-decoration:underline;text-underline-offset:3px}

@media (max-width:800px) {
  .two-col{grid-template-columns:1fr}
  .col-right{position:static;order:-1}
  .order-wrap{padding:36px 20px 60px}
}
@media (max-width:480px) {
  .horo-body{padding:20px 18px 18px}
  .comparison-row,.comparison-header{grid-template-columns:1fr 40px 40px;gap:6px}
}
`;
