'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Canvas starfield
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      o: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.3 + 0.05,
    }));
    let t = 0;
    let animId: number;

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      t += 0.008;
      for (const s of stars) {
        const pulse = s.o + Math.sin(t * s.speed + s.x) * 0.15;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(232,228,218,${pulse})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    function onResize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }
    window.addEventListener('resize', onResize);

    // Nav scroll show/hide
    const nav = document.getElementById('landingNav');
    function onNavScroll() {
      if (!nav) return;
      if (window.scrollY > 20) {
        nav.classList.add('visible', 'scrolled');
      } else {
        nav.classList.remove('visible', 'scrolled');
      }
    }
    onNavScroll();
    window.addEventListener('scroll', onNavScroll, { passive: true });

    // Mobile drawer
    let menuOpen = false;
    const backdrop = document.getElementById('navBackdrop');
    const drawer = document.getElementById('navDrawer');
    const burger = document.getElementById('navBurger');

    function openMenu() {
      menuOpen = true;
      backdrop?.classList.add('visible');
      drawer?.classList.add('open');
      drawer?.setAttribute('aria-hidden', 'false');
      burger?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      menuOpen = false;
      backdrop?.classList.remove('visible');
      drawer?.classList.remove('open');
      drawer?.setAttribute('aria-hidden', 'true');
      burger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    burger?.addEventListener('click', () => { if (menuOpen) closeMenu(); else openMenu(); });
    backdrop?.addEventListener('click', closeMenu);

    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && menuOpen) closeMenu(); };
    document.addEventListener('keydown', onEsc);

    // Close drawer on drawer link click
    drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    const faqHandlers: Array<[Element, () => void]> = [];
    faqItems.forEach(item => {
      const btn = item.querySelector('.faq-q');
      if (!btn) return;
      const handler = () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      };
      btn.addEventListener('click', handler);
      faqHandlers.push([btn, handler]);
    });

    // Scroll reveal
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(el => {
          if (el.isIntersecting) {
            (el.target as HTMLElement).style.opacity = '1';
            (el.target as HTMLElement).style.transform = 'none';
          }
        }),
      { threshold: 0.1 }
    );
    document
      .querySelectorAll('.problem-item, .how-step, .testi-card, .agitate-item')
      .forEach(el => {
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.transform = 'translateY(20px)';
        (el as HTMLElement).style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
      });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onNavScroll);
      document.removeEventListener('keydown', onEsc);
      faqHandlers.forEach(([btn, handler]) => btn.removeEventListener('click', handler));
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style>{landingCSS}</style>
      <canvas ref={canvasRef} className="stars-canvas" />
      <div className="aurora" />

      {/* Mobile nav backdrop */}
      <div className="drawer-backdrop" id="navBackdrop" />

      {/* Mobile nav drawer */}
      <div className="nav-drawer drawer" id="navDrawer" aria-hidden="true">
        <div className="nav-drawer-header">
          <div className="nav-drawer-logo"><span>✦</span> SERAPHOVA</div>
        </div>
        <a href="#problem" className="nav-drawer-item">The problem</a>
        <a href="#how" className="nav-drawer-item">How it works</a>
        <a href="#features" className="nav-drawer-item">What you get</a>
        <a href="#pricing" className="nav-drawer-item">Pricing</a>
        <a href="#faq" className="nav-drawer-item">FAQ</a>
        <div className="nav-drawer-divider" />
        <Link href="/start" className="nav-drawer-item">Start my reading →</Link>
      </div>

      {/* Fixed navbar — hidden until scroll */}
      <nav className="landing-nav" id="landingNav">
        <Link href="/" className="landing-nav-logo">
          <span className="landing-nav-mark">✦</span> SERAPHOVA
        </Link>
        <div className="landing-nav-links">
          <a href="#problem">The problem</a>
          <a href="#how">How it works</a>
          <a href="#features">What you get</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="landing-nav-ctas">
          <button
            type="button"
            className="landing-nav-burger"
            id="navBurger"
            aria-label="Open menu"
            aria-expanded="false"
          >
            <span className="burger-icon" aria-hidden="true">
              <span /><span /><span />
            </span>
          </button>
          <Link href="/start" className="btn btn-gold">Start my reading</Link>
        </div>
      </nav>

      <div className="page">

        {/* HERO */}
        <section className="hero">
          <div className="hero-orbit">
            <div className="hero-orbit-dot" />
            <div className="hero-center">✦</div>
          </div>
          
          <h1 className="hero-title">
          Daily personalized horoscope.<br /><em>Delivered every morning.</em>
          </h1>
          <p className="hero-desc">
            Answer a short quiz. We read your full natal chart (every planet, every house, every
            transit) and send you a personalized horoscope before you start your day.
          </p>
          <div className="hero-ctas">
            <Link href="/start" className="btn btn-gold btn-xl">Start your reading →</Link>
          </div>
          <p className="hero-trust">Written for your unique birth chart</p>
          <div className="scroll-hint">
            <div className="scroll-hint-line" />
            <span>Scroll</span>
          </div>
        </section>

        {/* EMAIL PREVIEW */}
        <div className="email-preview-wrap">
          <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="email-preview">
              <div className="email-header">
                <div className="email-avatar">✦</div>
                <div className="email-meta">
                  <div className="email-from">Seraphova · Your Daily Reading</div>
                  <div className="email-subject">
                    Today&apos;s transits hit your 7th house hard — here&apos;s what that means for you
                  </div>
                </div>
                <div className="email-time">7:02 AM</div>
              </div>
              <div className="email-body">
                <div className="email-date-line">Thursday · June 18 · Your chart</div>
                <div className="email-greeting">Good morning, Sofia.</div>
                <p className="email-text">
                  Venus stations direct today in your{' '}
                  <strong>7th house of relationships</strong>, opposing your natal Saturn in
                  Capricorn. For you specifically — Scorpio rising, Libra moon — this isn&apos;t
                  just a collective &ldquo;relationship energy&rdquo; moment. This is the day that
                  unresolved conversation you&apos;ve been circling actually becomes speakable.
                </p>
                <p className="email-text">
                  Your Mercury is activated too, which means words come easier than usual. Use that.
                  The window closes by the weekend.
                </p>
                <div className="email-divider" />
                <div className="email-planet-row">
                  <span className="email-planet-tag">♀ Venus direct</span>
                  <span className="email-planet-tag">☿ Mercury active</span>
                  <span className="email-planet-tag">7th House</span>
                  <span className="email-planet-tag">Scorpio Rising</span>
                </div>
                <p className="email-footer-note">Based on your natal chart — not your sun sign.</p>
              </div>
            </div>
          </div>
        </div>

        {/* PROBLEM */}
        <section className="section-problem" id="problem">
          <div className="container">
            <p className="section-eyebrow">The problem</p>
            <h2 className="section-title">
              You&apos;ve been reading<br /><em>someone else&apos;s</em> horoscope.
            </h2>
            <p className="section-body">
              Every daily horoscope you&apos;ve ever read was written for 1 in 12 people. It has
              never once known your rising sign, your moon, your Venus placement, or what the sky is
              actually doing to your chart right now.
            </p>
            <ol className="problem-list">
              <li className="problem-item">
                <div className="problem-left">
                  <span className="problem-num">01</span>
                  <span className="problem-label">♊ Sun sign only</span>
                </div>
                <div className="problem-right">
                  <p>
                    Gemini season, Scorpio energy, Mercury retrograde. Generic advice written for
                    every person with your sun sign — which is around{' '}
                    <strong>700 million people</strong>.
                  </p>
                </div>
              </li>
              <li className="problem-item">
                <div className="problem-left">
                  <span className="problem-num">02</span>
                  <span className="problem-label">📋 Same script, every day</span>
                </div>
                <div className="problem-right">
                  <p>
                    Today&apos;s &ldquo;focus on relationships&rdquo; is tomorrow&apos;s &ldquo;trust
                    your intuition.&rdquo; <strong>Templated copy that cycles</strong> regardless of
                    what&apos;s actually moving in the sky.
                  </p>
                </div>
              </li>
              <li className="problem-item">
                <div className="problem-left">
                  <span className="problem-num">03</span>
                  <span className="problem-label">📱 Another app to open</span>
                </div>
                <div className="problem-right">
                  <p>
                    You already have seven apps fighting for your morning. Co-Star notifications you
                    ignore. <strong>A Pattern you forgot you downloaded.</strong>
                  </p>
                </div>
              </li>
              <li className="problem-item">
                <div className="problem-left">
                  <span className="problem-num">04</span>
                  <span className="problem-label">🌫 Vague enough to be anything</span>
                </div>
                <div className="problem-right">
                  <p>
                    &ldquo;A significant connection may appear.&rdquo; Does that apply to you today?
                    It&apos;s designed to feel like it might —{' '}
                    <strong>which means it never actually does.</strong>
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* AGITATE */}
        <section className="agitate">
          <div className="container">
            <p className="section-eyebrow">The real cost</p>
            <blockquote className="agitate-quote">
              I&apos;ve been into astrology for years. I know my chart. I just can&apos;t figure out
              how to apply it to my actual life, every actual day.
            </blockquote>
            <p className="agitate-author">— What every astrology-curious person says eventually</p>
            <div className="agitate-list">
              {[
                {
                  icon: '⚡',
                  text: (
                    <>
                      You know your Scorpio rising means you feel things more intensely than you
                      show. You know your Libra moon means you avoid conflict. But{' '}
                      <strong>nobody tells you what to do with that information today</strong>, when
                      Venus is squaring your natal Mars.
                    </>
                  ),
                },
                {
                  icon: '🔁',
                  text: (
                    <>
                      You open Co-Star. It says something cryptic about &ldquo;your shadow.&rdquo;
                      You open your daily horoscope. It says{' '}
                      <strong>this is a good day for creativity</strong>. You close both apps and go
                      about your day.
                    </>
                  ),
                },
                {
                  icon: '💭',
                  text: (
                    <>
                      The astrology tools you have treat you like a sun sign. Your birth chart, the
                      actual map of who you are,{' '}
                      <strong>just sits there, unread</strong>.
                    </>
                  ),
                },
              ].map((item, i) => (
                <div className="agitate-item" key={i}>
                  <span className="agitate-item-icon">{item.icon}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="solution">
          <div className="container">
            <div className="solution-intro">
              <div>
                <p className="section-eyebrow">The solution</p>
                <h2 className="section-title">A daily letter that actually <em>knows you.</em></h2>
              </div>
              <div>
                <p className="section-body">Seraphova reads your complete natal chart — sun, moon, rising, Venus, Mars, every house — synthesizes it with today&apos;s real planetary transits, and writes you a personalized reading that lands in your inbox before you start your day.</p>
                <p className="section-body" style={{ marginTop: 16 }}>Not generic. Not templated. Written for the exact configuration of the sky at the moment you were born.</p>
              </div>
            </div>
            <div className="solution-steps">
              {[
                { n: '1', title: 'Answer a short quiz', desc: "Tell us your birth date, time, and place. Add a few details about what's on your mind — love, work, decisions, transitions. Takes 3 minutes." },
                { n: '2', title: 'We build your complete chart', desc: 'Every planet. Every house. Every transit happening today. Your chart becomes the permanent lens through which your readings are written.' },
                { n: '3', title: 'Your reading arrives at 7am', desc: "Every morning, before your day starts. A specific, personal reading that connects today's planetary weather to your actual chart. Nothing generic. Nothing recycled." },
              ].map(s => (
                <div className="solution-step" key={s.n}>
                  <div className="step-number">{s.n}</div>
                  <div className="step-content">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="section-features" id="features">
          <div className="container">
            <p className="section-eyebrow">What&apos;s inside every reading</p>
            <h2 className="section-title">
              Everything that&apos;s <em>actually</em> relevant.
            </h2>
            <ol className="problem-list">
              {[
                {
                  n: '01',
                  icon: '🌙',
                  title: 'Full natal chart analysis',
                  desc: 'Sun, moon, rising, Venus, Mars, Jupiter, Saturn — your complete placements shape every reading you receive.',
                },
                {
                  n: '02',
                  icon: '🌍',
                  title: 'Real-time transits',
                  desc: 'Today\'s planetary movements mapped to your specific chart. Not "Mercury retrograde affects Gemini" — "Mercury retrograde hits your 3rd house of communication."',
                },
                {
                  n: '03',
                  icon: '💫',
                  title: 'Your personal focus areas',
                  desc: "Love, career, decisions, health — your reading is weighted toward what you're actually navigating in your life right now.",
                },
                {
                  n: '04',
                  icon: '📬',
                  title: 'Delivered before you start',
                  desc: "7am, every morning, in your inbox. No app to open. No notification to ignore. It's just there when you need it.",
                },
                {
                  n: '05',
                  icon: '✦',
                  title: 'One clear, actionable insight',
                  desc: "Not a wall of cosmic theory. A specific, concrete thing to know — or do — based on what the sky is doing to your chart today.",
                },
                {
                  n: '06',
                  icon: '🔮',
                  title: 'Weekly & lunar event callouts',
                  desc: 'New moons, full moons, and major planetary events flagged in advance — and always in the context of what they mean for your specific placements.',
                },
              ].map(f => (
                <li className="problem-item" key={f.n}>
                  <div className="problem-left">
                    <span className="problem-num">{f.n}</span>
                    <span className="problem-label">
                      {f.icon} {f.title}
                    </span>
                  </div>
                  <div className="problem-right">
                    <p>{f.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="testimonials">
          <div className="container">
            <p className="section-eyebrow">What readers say</p>
            <h2 className="section-title">
              Finally, an astrology<br />that <em>fits.</em>
            </h2>
            <div className="testimonials-grid">
              {[
                {
                  initial: 'L',
                  name: 'Léa M.',
                  sign: 'Capricorn Sun · Scorpio Rising',
                  text: "I've used Co-Star for three years. This is the first reading I've received that made me stop mid-morning and think — yes, that is exactly what I'm dealing with.",
                },
                {
                  initial: 'S',
                  name: 'Sara K.',
                  sign: 'Pisces Sun · Aquarius Moon',
                  text: "The first morning it landed in my inbox, it mentioned my 8th house and a pattern I'd been circling for months. I cried a little. I'm not embarrassed to admit that.",
                },
                {
                  initial: 'A',
                  name: 'Amara D.',
                  sign: 'Virgo Sun · Cancer Rising',
                  text: "I read it with my coffee every morning now. It's become the one ritual I actually keep. I didn't expect to care about it this much.",
                },
              ].map(t => (
                <div className="testi-card" key={t.name}>
                  <div className="testi-stars">★★★★★</div>
                  <p className="testi-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="testi-author">
                    <div className="testi-avatar">{t.initial}</div>
                    <div>
                      <div className="testi-name">{t.name}</div>
                      <div className="testi-sign">{t.sign}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing" id="pricing">
          <div className="container">
            <p className="section-eyebrow">Start your reading</p>
            <h2 className="section-title">
              One price.<br /><em>Every morning.</em>
            </h2>
            <p className="section-body" style={{ margin: '0 auto' }}>
              No free plan with locked features. No confusing tiers. One payment — your full chart,
              your daily reading, every day for a year.
            </p>
            <div className="pricing-wrap">
              <div className="pricing-card featured">
                <div className="pricing-label-sm">Daily personalized horoscope</div>
                <div className="pricing-price">
                  <sup>$</sup>47
                </div>
                <div className="pricing-period">one-time payment · 365 daily readings</div>
                <div className="pricing-divider" />
                <div className="pricing-features">
                  {[
                    'Full natal chart reading (every planet, every house)',
                    '365 daily emails — one every morning at 7am',
                    'Real-time planetary transits mapped to your chart',
                    'Personalized focus areas from your quiz answers',
                    'New moon & full moon callouts in advance',
                    'No subscription, no recurring charge — ever',
                  ].map(feat => (
                    <div className="pricing-feat" key={feat}>
                      <span className="pricing-feat-check">✦</span>
                      {feat}
                    </div>
                  ))}
                </div>
                <Link href="/start" className="btn btn-gold pricing-btn">
                  Begin your reading →
                </Link>
              </div>
            </div>
            <p className="trial-note">
              Takes 3 minutes to set up · Your first reading arrives tomorrow morning
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq">
          <div className="container">
            <p className="section-eyebrow">Questions</p>
            <h2 className="section-title">
              Everything you<br />might be wondering.
            </h2>
            <div className="faq-list">
              {[
                {
                  q: 'How is this different from Co-Star or a regular horoscope?',
                  a: "Co-Star uses your chart for notifications but the copy is templated and cryptic. Regular horoscopes only use your sun sign. Seraphova reads your complete natal chart — every planet, every house — and synthesizes it with today's specific planetary transits to write a reading that's genuinely about you. The difference is immediately obvious in the first email you receive.",
                },
                {
                  q: "Do I need to know my exact birth time?",
                  a: "Your birth time lets us calculate your rising sign and house placements accurately, which makes the readings significantly more specific. If you don't have it, we can still work with your sun, moon, and planetary positions — just leave it blank in the quiz and we'll calibrate accordingly.",
                },
                {
                  q: 'What time does the email arrive?',
                  a: "7am in your local timezone, every morning. The idea is that it's there before your day starts — a quiet, personal moment before the noise begins.",
                },
                {
                  q: 'Is the reading different every day?',
                  a: "Yes — every reading is generated fresh based on the actual planetary transits of that day, mapped to your specific chart. Some days will be quieter cosmically; those readings reflect that. On significant transit days — a full moon hitting your 1st house, Venus stationing direct — the readings go deeper.",
                },
                {
                  q: 'Can I cancel whenever I want?',
                  a: "Yes, anytime. No cancellation fees, no guilt-trip emails. Click the link in any email and you're done.",
                },
              ].map(f => (
                <div className="faq-item" key={f.q}>
                  <div className="faq-q">
                    {f.q}
                    <span className="faq-q-icon">+</span>
                  </div>
                  <div className="faq-a">{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final-cta">
          <div className="container">
            <p className="section-eyebrow">Your chart is waiting</p>
            <h2 className="section-title">
              Stop reading for<br /><em>everyone.</em>
            </h2>
            <p className="section-body">
              You&apos;ve always suspected that your chart contains something more specific than what
              generic horoscopes give you. You were right. Start tomorrow morning.
            </p>
            <Link href="/start" className="btn btn-gold btn-xl">
              Begin your reading →
            </Link>
            <p className="hero-trust" style={{ marginTop: 20 }}>
              Written for your unique birth chart
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-logo">✦ Seraphova</div>
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="#">Contact</a>
            <a href="#how">FAQ</a>
          </div>
          <p className="footer-copy">© 2026 Seraphova. Your chart. Your sky.</p>
        </footer>
      </div>
    </>
  );
}

const landingCSS = `
/* ── STARS CANVAS ── */
.stars-canvas {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.6;
}

/* ── ANIMATIONS ── */
@keyframes slowSpin { to { transform: rotate(360deg); } }
@keyframes counterSpin { to { transform: rotate(-360deg); } }
@keyframes bob {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(6px); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: none; }
}

/* ── LANDING NAV ── */
.landing-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 40px; height: 64px;
  backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
  background: rgba(8,9,15,0.75);
  transform: translateY(-100%); opacity: 0; pointer-events: none;
  transition: transform 0.35s cubic-bezier(.22,1,.36,1), opacity 0.35s cubic-bezier(.22,1,.36,1), background 0.2s;
}
.landing-nav.visible { transform: translateY(0); opacity: 1; pointer-events: auto; }
.landing-nav.scrolled { background: rgba(8,9,15,0.92); }
.landing-nav-logo {
  font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400;
  letter-spacing: 0.16em; color: var(--gold2);
  display: flex; align-items: center; gap: 9px; text-decoration: none;
}
.landing-nav-mark { font-size: 16px; opacity: 0.8; }
.landing-nav-links { display: flex; align-items: center; gap: 28px; }
.landing-nav-links a { font-size: 14px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
.landing-nav-links a:hover { color: var(--text); }
.landing-nav-ctas { display: flex; align-items: center; gap: 10px; }
.landing-nav-burger {
  display: none; align-items: center; justify-content: center;
  min-width: 44px; min-height: 44px; padding: 0;
  background: none; border: none; cursor: pointer;
  border-radius: var(--r); flex-shrink: 0;
}
.landing-nav-burger:hover { background: var(--void); }
.burger-icon { display: flex; flex-direction: column; gap: 5px; width: 18px; }
.burger-icon span { display: block; height: 2px; background: var(--text); border-radius: 1px; }

/* ── MOBILE DRAWER ── */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.drawer-backdrop {
  position: fixed; inset: 0; background: rgba(8,9,15,0.75);
  backdrop-filter: blur(8px); z-index: 140; display: none;
  animation: fadeIn 0.2s ease;
}
.drawer-backdrop.visible { display: block; }
.drawer {
  position: fixed; top: 0; left: 0; bottom: 0; width: min(280px,85vw);
  z-index: 150; transform: translateX(-100%);
  transition: transform 0.25s ease; overflow-y: auto;
}
.drawer.open { transform: translateX(0); }
.nav-drawer {
  background: rgba(13,15,26,0.98); border-right: 1px solid var(--border);
  padding: 20px 0; display: flex; flex-direction: column;
}
.nav-drawer-header {
  padding: 8px 20px 16px; border-bottom: 1px solid var(--border); margin-bottom: 8px;
}
.nav-drawer-logo {
  font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400;
  letter-spacing: 0.12em; color: var(--gold2); display: flex; align-items: center; gap: 8px;
}
.nav-drawer-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 20px;
  font-size: 14px; color: var(--muted); cursor: pointer; transition: all 0.15s;
  border: none; background: none; width: 100%; text-align: left;
  font-family: 'DM Sans', sans-serif; text-decoration: none;
}
.nav-drawer-item:hover { background: var(--void); color: var(--text); }
.nav-drawer-divider { height: 1px; background: var(--border); margin: 8px 16px; }

/* ── BUTTONS ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 11px 24px; border-radius: var(--r);
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; border: none;
  letter-spacing: 0.02em; text-decoration: none;
}
.btn-gold { background: linear-gradient(135deg, var(--gold), var(--gold2)); color: #0d0f1a; }
.btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(201,168,76,0.3); }
.btn-xl { padding: 16px 40px; font-size: 16px; border-radius: var(--r2); }

/* ── HERO ── */
.hero {
  min-height: 100dvh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center;
  padding: 60px 32px 80px; position: relative; z-index: 1;
}
.hero-orbit {
  width: 130px; height: 130px;
  border: 1px solid rgba(201,168,76,0.12); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  position: relative; margin: 0 auto 32px;
  animation: slowSpin 40s linear infinite;
}
.hero-orbit::before {
  content: ''; position: absolute;
  width: 92px; height: 92px;
  border: 1px solid rgba(201,168,76,0.08); border-radius: 50%;
}
.hero-orbit-dot {
  position: absolute; top: -2px; left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--gold); box-shadow: 0 0 6px var(--gold);
}
.hero-center {
  width: 38px; height: 38px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #c9a84c, #7b6fa0);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; animation: counterSpin 40s linear infinite;
  box-shadow: 0 0 18px rgba(201,168,76,0.2);
}
.hero-eyebrow {
  font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 20px;
}
.hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(40px,6.5vw,72px); font-weight: 300;
  line-height: 0.95; color: var(--text);
  margin-bottom: 24px; letter-spacing: -0.01em;
}
.hero-title em { font-style: italic; color: var(--gold2); }
.hero-sub {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(20px,3vw,28px); font-weight: 300; font-style: italic;
  color: var(--muted); margin-bottom: 16px;
}
.hero-desc {
  font-size: 17px; color: var(--muted);
  max-width: 480px; margin: 0 auto 40px; line-height: 1.8;
}
.hero-ctas {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
}
.hero-trust {
  font-size: 13px; color: var(--muted2); margin-top: 16px; letter-spacing: 0.02em;
}
.scroll-hint {
  position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: var(--muted2); font-size: 11px; letter-spacing: 0.12em;
  text-transform: uppercase; animation: bob 2s ease-in-out infinite;
}
.scroll-hint-line {
  width: 1px; height: 40px;
  background: linear-gradient(to bottom, rgba(201,168,76,0.15), transparent);
}

/* ── LAYOUT ── */
.center { text-align: center; }
.center .section-body { margin: 0 auto; }
.container-wide { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* ── SECTION LABELS ── */
.section-eyebrow {
  font-size: 10px; font-weight: 500; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--gold); margin-bottom: 16px;
}
.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(36px,6vw,56px); font-weight: 300;
  line-height: 1.15; letter-spacing: -0.01em; margin-bottom: 20px;
}
.section-title em { font-style: italic; color: var(--gold2); }
.section-body {
  font-size: 17px; color: var(--muted); line-height: 1.85; max-width: 560px;
}
.section-divider {
  width: 100%; height: 1px;
  background: linear-gradient(90deg, transparent, var(--border2), transparent);
  position: relative; z-index: 1;
}

/* ── EMAIL PREVIEW ── */
.email-preview-wrap {
  padding: 60px 0 80px; display: flex; justify-content: center; position: relative; z-index: 1;
}
.email-preview {
  width: 100%; max-width: 520px; background: var(--card);
  border: 1px solid var(--border2); border-radius: var(--r2); overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 60px rgba(201,168,76,0.06);
}
.email-header {
  background: linear-gradient(135deg,#0d0f1a 0%,#161929 100%);
  padding: 24px 28px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 14px;
}
.email-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.3);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif; font-size: 18px;
  color: var(--gold2); flex-shrink: 0;
}
.email-meta { flex: 1; min-width: 0; }
.email-from { font-size: 13px; font-weight: 500; color: var(--text); }
.email-subject {
  font-size: 12px; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.email-time { font-size: 11px; color: var(--muted2); flex-shrink: 0; }
.email-body { padding: 28px; }
.email-date-line {
  font-size: 10px; font-weight: 500; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--gold); margin-bottom: 16px;
}
.email-greeting {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 400; color: var(--text); margin-bottom: 16px;
}
.email-text { font-size: 14px; line-height: 1.8; color: var(--muted); margin-bottom: 16px; }
.email-text strong { color: var(--text); font-weight: 500; }
.email-divider { height: 1px; background: var(--border); margin: 20px 0; }
.email-planet-row { display: flex; gap: 10px; flex-wrap: wrap; }
.email-planet-tag {
  font-size: 11px; font-weight: 500; padding: 5px 12px;
  border-radius: var(--r2); border: 1px solid var(--border2);
  color: var(--accent2); background: rgba(155,142,196,0.08);
}
.email-footer-note { font-size: 11px; color: var(--muted2); margin-top: 20px; font-style: italic; }

/* ── PROBLEM SECTION ── */
.section-problem {
  padding: 100px 0; border-top: 1px solid var(--border); position: relative; z-index: 1;
}

/* ── PROBLEM LIST ── */
.problem-list { list-style: none; border-top: 1px solid var(--border); margin-top: 56px; }
.problem-item {
  position: relative;
  display: grid; grid-template-columns: minmax(9rem,15rem) 1fr;
  border-bottom: 1px solid var(--border);
}
.problem-item::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 2px;
  background: linear-gradient(to bottom, var(--gold), var(--gold2));
  transform: scaleY(0); transform-origin: top;
  transition: transform 0.22s ease-out; pointer-events: none;
}
.problem-item:hover::before { transform: scaleY(1); }
.problem-left {
  display: flex; flex-direction: column; justify-content: center; gap: 6px;
  padding: 32px 24px 32px 16px; border-right: 1px solid var(--border);
}
.problem-num {
  font-size: 11px; font-weight: 600; letter-spacing: 0.2em;
  color: var(--muted2); transition: color 0.2s;
}
.problem-item:hover .problem-num { color: var(--gold); }
.problem-label {
  font-size: 15px; font-weight: 500; color: var(--text); line-height: 1.3;
  transition: color 0.2s;
}
.problem-item:hover .problem-label { color: var(--gold2); }
.problem-right {
  display: flex; align-items: center; padding: 32px 24px 32px 36px;
}
.problem-right p { font-size: 14px; line-height: 1.8; color: var(--muted); }
.problem-right p strong { font-weight: 600; color: var(--text); }

/* ── AGITATE ── */
.agitate {
  padding: 100px 0; border-top: 1px solid var(--border);
  text-align: center; position: relative; z-index: 1;
}
.agitate-quote {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(26px,4.5vw,42px); font-weight: 300; font-style: italic;
  line-height: 1.5; max-width: 680px; margin: 0 auto 40px; position: relative;
}
.agitate-quote::before {
  content: '\u201C'; position: absolute; top: -20px; left: -10px;
  font-size: 80px; color: var(--gold-dim);
  font-family: 'Cormorant Garamond', serif; line-height: 1; pointer-events: none;
}
.agitate-author { font-size: 13px; letter-spacing: 0.1em; color: var(--muted2); }
.agitate-list {
  display: flex; flex-direction: column; gap: 16px;
  max-width: 560px; margin: 64px auto 0; text-align: left;
}
.agitate-item {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 20px 24px; background: var(--card);
  border: 1px solid var(--border); border-radius: var(--r);
}
.agitate-item-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.agitate-item p { font-size: 15px; color: var(--muted); line-height: 1.7; }
.agitate-item p strong { color: var(--text); font-weight: 500; }

/* ── SOLUTION ── */
.solution {
  padding: 100px 0; border-top: 1px solid var(--border); position: relative; z-index: 1;
}
.solution-intro {
  display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
  align-items: start; margin-bottom: 80px;
}
.solution-steps { display: flex; flex-direction: column; }
.solution-step {
  display: grid; grid-template-columns: 56px 1fr; gap: 24px;
  padding: 32px 0; border-bottom: 1px solid var(--border); align-items: start;
}
.solution-step:first-child { padding-top: 0; }
.solution-step:last-child { border-bottom: none; }
.step-number {
  font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300;
  color: rgba(201,168,76,0.25); line-height: 1; text-align: center; padding-top: 4px;
}
.step-content h3 {
  font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 400;
  margin-bottom: 8px; line-height: 1.3;
}
.step-content p { font-size: 14px; color: var(--muted); line-height: 1.75; }

@media (max-width: 768px) {
  .solution-intro { grid-template-columns: 1fr; gap: 40px; }
}

/* ── HOW IT WORKS ── */
.section-how {
  padding: 100px 0; border-top: 1px solid var(--border); position: relative; z-index: 1;
}
.section-how .container { margin-bottom: 72px; }
.how-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-top: 0;
  border: 1px solid var(--border); border-radius: var(--r2); overflow: hidden;
}
.how-step { padding: 40px; position: relative; }
.how-step:hover { background: rgba(201,168,76,0.02); }
.how-step:nth-child(odd) { border-right: 1px solid var(--border); }
.how-step:nth-child(1), .how-step:nth-child(2) { border-bottom: 1px solid var(--border); }
.how-num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 64px; font-weight: 300; color: var(--border2); line-height: 1; margin-bottom: 12px;
}
.how-icon { font-size: 28px; margin-bottom: 14px; }
.how-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px; font-weight: 500; margin-bottom: 10px;
}
.how-desc { font-size: 14px; color: var(--muted); line-height: 1.7; }

/* ── FEATURES SECTION ── */
.section-features {
  padding: 100px 0; border-top: 1px solid var(--border); position: relative; z-index: 1;
}

/* ── TESTIMONIALS ── */
.testimonials {
  padding: 100px 0; border-top: 1px solid var(--border);
  text-align: center; position: relative; z-index: 1;
}
.testimonials-grid {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 20px; margin-top: 64px; text-align: left;
}
.testi-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--r2); padding: 28px 24px; position: relative; overflow: hidden;
}
.testi-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent);
}
.testi-stars { color: var(--gold); font-size: 13px; letter-spacing: 2px; margin-bottom: 16px; }
.testi-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px; font-weight: 300; font-style: italic;
  line-height: 1.65; margin-bottom: 20px;
}
.testi-author { display: flex; align-items: center; gap: 10px; }
.testi-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.2);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif; font-size: 14px; color: var(--gold2);
}
.testi-name { font-size: 12px; font-weight: 500; }
.testi-sign { font-size: 11px; color: var(--muted2); }

/* ── PRICING ── */
.pricing {
  padding: 100px 0; border-top: 1px solid var(--border);
  text-align: center; position: relative; z-index: 1;
}
.pricing-wrap { max-width: 420px; margin: 56px auto 0; text-align: left; }
.pricing-card.featured {
  border: 1px solid rgba(201,168,76,0.3); border-radius: var(--r3);
  padding: 32px; position: relative; overflow: hidden;
  background: linear-gradient(160deg, rgba(201,168,76,0.05), var(--card));
}
.pricing-card.featured::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.pricing-label-sm {
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 20px;
}
.pricing-price {
  font-family: 'Cormorant Garamond', serif;
  font-size: 52px; font-weight: 300; line-height: 1;
  color: var(--text); margin-bottom: 4px;
}
.pricing-price sup {
  font-size: 22px; vertical-align: top; margin-top: 10px;
  margin-right: 2px; color: var(--muted);
}
.pricing-period { font-size: 14px; color: var(--muted); margin-bottom: 0; }
.pricing-divider { height: 1px; background: var(--border); margin: 24px 0; }
.pricing-features { display: flex; flex-direction: column; gap: 11px; margin-bottom: 28px; }
.pricing-feat { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--muted); }
.pricing-feat-check { color: var(--gold); font-size: 14px; flex-shrink: 0; }
.pricing-btn { width: 100%; justify-content: center; padding: 13px; border-radius: var(--r2); }
.trial-note { text-align: center; margin-top: 20px; font-size: 13px; color: var(--muted2); }

/* ── FAQ ── */
.faq {
  padding: 100px 0; border-top: 1px solid var(--border); position: relative; z-index: 1;
}
.faq-list { margin-top: 64px; display: flex; flex-direction: column; }
.faq-item { border-bottom: 1px solid var(--border); padding: 28px 0; }
.faq-item:first-child { border-top: 1px solid var(--border); }
.faq-q {
  font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400;
  cursor: pointer; display: flex; justify-content: space-between;
  align-items: center; gap: 16px; line-height: 1.4;
}
.faq-q-icon {
  color: var(--gold); font-size: 18px; flex-shrink: 0;
  font-family: 'DM Sans', sans-serif; font-weight: 300;
  transition: transform 0.2s ease;
}
.faq-a {
  font-size: 14px; color: var(--muted); line-height: 1.8;
  max-height: 0; overflow: hidden;
  transition: max-height 0.35s ease, padding 0.2s ease;
}
.faq-item.open .faq-a { max-height: 300px; padding-top: 16px; }
.faq-item.open .faq-q-icon { transform: rotate(45deg); }

/* ── FINAL CTA ── */
.final-cta {
  padding: 120px 0; text-align: center; position: relative;
  border-top: 1px solid var(--border); z-index: 1;
}
.final-cta::before {
  content: ''; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%); width: 700px; height: 400px;
  background: radial-gradient(ellipse at center, rgba(123,111,160,0.1) 0%, rgba(201,168,76,0.04) 50%, transparent 70%);
  pointer-events: none;
}
.final-cta .section-title { margin-bottom: 16px; position: relative; }
.final-cta .section-body { margin: 0 auto 48px; font-size: 18px; position: relative; }
.final-cta .btn { position: relative; }

/* ── FOOTER ── */
footer {
  border-top: 1px solid var(--border); padding: 40px 24px;
  text-align: center; position: relative; z-index: 1;
}
.footer-logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px; font-weight: 400; letter-spacing: 0.16em;
  color: var(--gold); text-transform: uppercase; margin-bottom: 16px;
}
.footer-links {
  display: flex; justify-content: center; gap: 28px; margin-bottom: 20px;
}
.footer-links a {
  font-size: 12px; color: var(--muted2); text-decoration: none;
  letter-spacing: 0.04em; transition: color 0.2s ease;
}
.footer-links a:hover { color: var(--muted); }
.footer-copy { font-size: 11px; color: var(--muted2); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .landing-nav { padding: 0 20px; }
  .landing-nav-links { display: none; }
  .landing-nav-burger { display: flex; }
  .problem-item { grid-template-columns: 1fr; }
  .problem-left { border-right: none; border-bottom: 1px solid var(--border); padding: 24px 16px 20px; }
  .problem-right { padding: 20px 16px 24px; }
  .how-grid { grid-template-columns: 1fr; }
  .how-step:nth-child(odd) { border-right: none; }
  .how-step:nth-child(1), .how-step:nth-child(2) { border-bottom: 1px solid var(--border); }
  .how-step:nth-child(3) { border-bottom: 1px solid var(--border); }
  .testimonials-grid { grid-template-columns: 1fr; }
  .pricing-wrap { max-width: 100%; }
  .container-wide { padding: 0 20px; }
  .hero { padding-left: 20px; padding-right: 20px; }
}
@media (max-width: 480px) {
  .hero-title { font-size: 44px; }
  .pricing-price { font-size: 44px; }
}
`;
