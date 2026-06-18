'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    // FAQ accordion
    const items = document.querySelectorAll('.faq-item');
    items.forEach(item => {
      item.querySelector('.faq-q')?.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        items.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

    // Scroll reveal
    const observer = new IntersectionObserver(
      entries => entries.forEach(el => {
        if (el.isIntersecting) {
          (el.target as HTMLElement).style.opacity = '1';
          (el.target as HTMLElement).style.transform = 'none';
        }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.problem-card, .agitate-item, .solution-step, .feature-card, .testimonial').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(20px)';
      (el as HTMLElement).style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{landingCSS}</style>
      <div className="stars" />
      <div className="aurora" />

      <div className="page">
        {/* NAV */}
        <nav>
          <Link href="/" className="nav-logo">✦ Seraphova</Link>
          <Link href="/start" className="nav-cta">Begin your reading →</Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="container">
            <div className="hero-eyebrow">Daily personalized horoscope</div>
            <h1>Your chart.<br /><em>In your inbox.</em><br />Every morning.</h1>
            <p className="hero-sub">Not your sun sign. Your actual chart.</p>
            <p className="hero-desc">Answer a short quiz. We read your full natal chart — every planet, every house, every transit — and send you a personalized horoscope before you start your day.</p>
            <Link href="/start" className="btn-primary">
              Start your reading
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <p className="hero-note">Takes 3 minutes · Delivered daily at 7am · $47 one-time</p>
          </div>
        </section>

        {/* EMAIL PREVIEW */}
        <div className="email-preview-wrap">
          <div className="container">
            <div className="email-preview">
              <div className="email-header">
                <div className="email-avatar">✦</div>
                <div className="email-meta">
                  <div className="email-from">Seraphova · Your Daily Reading</div>
                  <div className="email-subject">Today's transits hit your 7th house hard — here's what that means for you</div>
                </div>
                <div className="email-time">7:02 AM</div>
              </div>
              <div className="email-body">
                <div className="email-date-line">Thursday · June 18 · Your chart</div>
                <div className="email-greeting">Good morning, Sofia.</div>
                <p className="email-text">Venus stations direct today in your <strong>7th house of relationships</strong>, opposing your natal Saturn in Capricorn. For you specifically — Scorpio rising, Libra moon — this isn't just a collective "relationship energy" moment. This is the day that unresolved conversation you've been circling actually becomes speakable.</p>
                <p className="email-text">Your Mercury is activated too, which means words come easier than usual. Use that. The window closes by the weekend.</p>
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
        <section className="problem">
          <div className="container">
            <p className="section-eyebrow">The problem</p>
            <h2 className="section-title">You&apos;ve been reading<br /><em>someone else&apos;s</em> horoscope.</h2>
            <p className="section-body">Every daily horoscope you&apos;ve ever read was written for 1 in 12 people. It has never once known your rising sign, your moon, your Venus placement, or what the sky is actually doing to your chart right now.</p>
            <div className="problem-grid">
              {[
                { icon: '♊', title: 'Sun sign only', desc: 'Gemini season, Scorpio energy, Mercury retrograde. Generic advice written for every person with your sun sign — which is around 700 million people.' },
                { icon: '📋', title: 'Same script, every day', desc: 'Today\'s "focus on relationships" is tomorrow\'s "trust your intuition." Templated copy that cycles regardless of what\'s actually moving in the sky.' },
                { icon: '📱', title: 'Another app to open', desc: 'You already have seven apps fighting for your morning. Co-Star notifications you ignore. A Pattern you forgot you downloaded.' },
                { icon: '🌫', title: 'Vague enough to be anything', desc: '"A significant connection may appear." Does that apply to you today? It\'s designed to feel like it might, which means it never actually does.' },
              ].map(c => (
                <div className="problem-card" key={c.title}>
                  <span className="problem-icon">{c.icon}</span>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AGITATE */}
        <section className="agitate">
          <div className="container">
            <p className="section-eyebrow">The real cost</p>
            <blockquote className="agitate-quote">
              I&apos;ve been into astrology for years. I know my chart. I just can&apos;t figure out how to apply it to my actual life, every actual day.
            </blockquote>
            <p className="agitate-author">— What every astrology-curious person says eventually</p>
            <div className="agitate-list">
              {[
                { icon: '⚡', text: <>You know your Scorpio rising means you feel things more intensely than you show. You know your Libra moon means you avoid conflict. But <strong>nobody tells you what to do with that information today</strong>, when Venus is squaring your natal Mars.</> },
                { icon: '🔁', text: <>You open Co-Star. It says something cryptic about &ldquo;your shadow.&rdquo; You open your daily horoscope. It says <strong>this is a good day for creativity</strong>. You close both apps and go about your day.</> },
                { icon: '💭', text: <>The astrology tools you have treat you like a sun sign. Your birth chart, the actual map of who you are, <strong>just sits there, unread</strong>.</> },
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
                { n: '1', title: 'Answer a short quiz', desc: 'Tell us your birth date, time, and place. Add a few details about what\'s on your mind — love, work, decisions, transitions. Takes 3 minutes.' },
                { n: '2', title: 'We build your complete chart', desc: 'Every planet. Every house. Every transit happening today. Your chart becomes the permanent lens through which your readings are written.' },
                { n: '3', title: 'Your reading arrives at 7am', desc: 'Every morning, before your day starts. A specific, personal reading that connects today\'s planetary weather to your actual chart. Nothing generic. Nothing recycled.' },
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
        <section className="what-you-get">
          <div className="container">
            <p className="section-eyebrow">What&apos;s inside every reading</p>
            <h2 className="section-title">Everything that&apos;s <em>actually</em> relevant.</h2>
            <div className="features-grid">
              {[
                { g: '🌙', title: 'Full natal chart analysis', desc: 'Sun, moon, rising, Venus, Mars, Jupiter, Saturn — your complete placements shape every reading you receive.' },
                { g: '🌍', title: 'Real-time transits', desc: 'Today\'s planetary movements mapped to your specific chart. Not "Mercury retrograde affects Gemini" — "Mercury retrograde hits your 3rd house of communication."' },
                { g: '💫', title: 'Your personal focus areas', desc: 'Love, career, decisions, health — your reading is weighted toward what you\'re actually navigating in your life right now.' },
                { g: '📬', title: 'Delivered before you start', desc: '7am, every morning, in your inbox. No app to open. No notification to ignore. It\'s just there when you need it.' },
                { g: '✦',  title: 'One clear, actionable insight', desc: 'Not a wall of cosmic theory. A specific, concrete thing to know — or do — based on what the sky is doing to your chart today.' },
                { g: '🔮', title: 'Weekly & lunar event callouts', desc: 'New moons, full moons, and major planetary events flagged in advance — and always in the context of what they mean for your specific placements.' },
              ].map(f => (
                <div className="feature-card" key={f.title}>
                  <div className="feature-glyph">{f.g}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="testimonials">
          <div className="container">
            <p className="section-eyebrow">What readers say</p>
            <h2 className="section-title">Finally, an astrology<br />that <em>fits.</em></h2>
            <div className="testimonials-grid">
              {[
                { initial: 'L', name: 'Léa M.', sign: 'Capricorn Sun · Scorpio Rising', text: "I've used Co-Star for three years. This is the first reading I've received that made me stop mid-morning and think — yes, that is exactly what I'm dealing with." },
                { initial: 'S', name: 'Sara K.', sign: 'Pisces Sun · Aquarius Moon', text: 'The first morning it landed in my inbox, it mentioned my 8th house and a pattern I\'d been circling for months. I cried a little. I\'m not embarrassed to admit that.' },
                { initial: 'A', name: 'Amara D.', sign: 'Virgo Sun · Cancer Rising', text: "I read it with my coffee every morning now. It's become the one ritual I actually keep. I didn't expect to care about it this much." },
              ].map(t => (
                <div className="testimonial" key={t.name}>
                  <div className="testimonial-stars">★★★★★</div>
                  <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.initial}</div>
                    <div>
                      <div className="testimonial-name">{t.name}</div>
                      <div className="testimonial-sign">{t.sign}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing" id="start">
          <div className="container">
            <p className="section-eyebrow">Start your reading</p>
            <h2 className="section-title">One price.<br /><em>Every morning.</em></h2>
            <p className="section-body" style={{ margin: '0 auto' }}>No free plan with locked features. No confusing tiers. One payment — your full chart, your daily reading, every day for a year.</p>
            <div className="pricing-card">
              <div className="pricing-card-top">
                <div className="pricing-label">Daily personalized horoscope</div>
                <div className="pricing-price"><sup>$</sup>47</div>
                <div className="pricing-period">one-time payment · 365 daily readings</div>
                <Link href="/start" className="pricing-cta">Begin your reading →</Link>
              </div>
              <div className="pricing-card-body">
                <ul className="pricing-features">
                  <li>Full natal chart reading (every planet, every house)</li>
                  <li>365 daily emails — one every morning at 7am</li>
                  <li>Real-time planetary transits mapped to your chart</li>
                  <li>Personalized focus areas from your quiz answers</li>
                  <li>New moon &amp; full moon callouts in advance</li>
                  <li>No subscription, no recurring charge — ever</li>
                </ul>
              </div>
            </div>
            <p className="pricing-note">Takes 3 minutes to set up. Your first reading arrives tomorrow morning.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq">
          <div className="container">
            <p className="section-eyebrow">Questions</p>
            <h2 className="section-title">Everything you<br />might be wondering.</h2>
            <div className="faq-list">
              {[
                { q: 'How is this different from Co-Star or a regular horoscope?', a: 'Co-Star uses your chart for notifications but the copy is templated and cryptic. Regular horoscopes only use your sun sign. Seraphova reads your complete natal chart — every planet, every house — and synthesizes it with today\'s specific planetary transits to write a reading that\'s genuinely about you. The difference is immediately obvious in the first email you receive.' },
                { q: 'Do I need to know my exact birth time?', a: 'Your birth time lets us calculate your rising sign and house placements accurately, which makes the readings significantly more specific. If you don\'t have it, we can still work with your sun, moon, and planetary positions — just leave it blank in the quiz and we\'ll calibrate accordingly.' },
                { q: 'What time does the email arrive?', a: '7am in your local timezone, every morning. The idea is that it\'s there before your day starts — a quiet, personal moment before the noise begins. You can also request a different delivery time in your quiz answers.' },
                { q: 'Is the reading different every day?', a: "Yes — every reading is generated fresh based on the actual planetary transits of that day, mapped to your specific chart. Some days will be quieter cosmically; those readings reflect that. On significant transit days — a full moon hitting your 1st house, Venus stationing direct — the readings go deeper." },
                { q: 'Can I cancel whenever I want?', a: "Yes, anytime. No cancellation fees, no guilt-trip emails. Click the link in any email and you're done." },
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
            <h2 className="section-title">Stop reading for<br /><em>everyone.</em></h2>
            <p className="section-body">You&apos;ve always suspected that your chart contains something more specific than what generic horoscopes give you. You were right. Start tomorrow morning.</p>
            <Link href="/start" className="btn-primary">
              Begin your reading
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <p className="hero-note" style={{ marginTop: 20 }}>Takes 3 minutes · $47 one-time · 365 daily readings</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-logo">✦ Seraphova</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
            <a href="#">FAQ</a>
          </div>
          <p className="footer-copy">© 2026 Seraphova. Your chart. Your sky.</p>
        </footer>
      </div>
    </>
  );
}

const landingCSS = `
nav {
  position: sticky; top: 0; z-index: 100;
  padding: 20px 24px;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(8,9,15,0.8); backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border);
}
.nav-logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px; font-weight: 400; letter-spacing: 0.16em;
  color: var(--gold2); text-transform: uppercase; text-decoration: none;
}
.nav-cta {
  font-size: 13px; font-weight: 500; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--gold2); text-decoration: none;
  border: 1px solid rgba(201,168,76,0.3); padding: 8px 20px;
  border-radius: 100px; transition: all 0.2s ease;
}
.nav-cta:hover { background: var(--gold-dim); border-color: rgba(201,168,76,0.6); }

.hero { padding: 100px 0 80px; text-align: center; }
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 500; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--gold); margin-bottom: 36px;
}
.hero-eyebrow::before, .hero-eyebrow::after {
  content: ''; display: block; width: 24px; height: 1px;
  background: var(--gold); opacity: 0.5;
}
.hero h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(52px,9vw,88px); font-weight: 300;
  line-height: 1.05; letter-spacing: -0.01em; margin-bottom: 10px;
}
.hero h1 em { font-style: italic; color: var(--gold2); }
.hero-sub {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(22px,4vw,32px); font-weight: 300; font-style: italic;
  color: var(--muted); margin-bottom: 48px; line-height: 1.4;
}
.hero-desc { font-size: 17px; color: var(--muted); max-width: 480px; margin: 0 auto 48px; line-height: 1.8; }
.hero-note { margin-top: 20px; font-size: 13px; color: var(--muted2); }

.email-preview-wrap { padding: 60px 0 80px; display: flex; justify-content: center; }
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
.email-subject { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.email-time { font-size: 11px; color: var(--muted2); flex-shrink: 0; }
.email-body { padding: 28px; }
.email-date-line { font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; }
.email-greeting { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; color: var(--text); margin-bottom: 16px; }
.email-text { font-size: 14px; line-height: 1.8; color: var(--muted); margin-bottom: 16px; }
.email-text strong { color: var(--text); font-weight: 500; }
.email-divider { height: 1px; background: var(--border); margin: 20px 0; }
.email-planet-row { display: flex; gap: 10px; flex-wrap: wrap; }
.email-planet-tag { font-size: 11px; font-weight: 500; padding: 5px 12px; border-radius: 100px; border: 1px solid var(--border2); color: var(--accent2); background: rgba(155,142,196,0.08); }
.email-footer-note { font-size: 11px; color: var(--muted2); margin-top: 20px; font-style: italic; }

section { position: relative; }
.section-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; }
.section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px,6vw,56px); font-weight: 300; line-height: 1.15; letter-spacing: -0.01em; margin-bottom: 20px; }
.section-title em { font-style: italic; color: var(--gold2); }
.section-body { font-size: 17px; color: var(--muted); line-height: 1.85; max-width: 560px; }

.problem { padding: 100px 0; border-top: 1px solid var(--border); }
.problem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--r2); overflow: hidden; margin-top: 64px; }
.problem-card { background: var(--card); padding: 36px 32px; transition: background 0.2s ease; }
.problem-card:hover { background: var(--card2); }
.problem-icon { font-size: 28px; margin-bottom: 16px; display: block; }
.problem-card h3 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; margin-bottom: 10px; line-height: 1.3; }
.problem-card p { font-size: 14px; color: var(--muted); line-height: 1.75; }

.agitate { padding: 100px 0; border-top: 1px solid var(--border); text-align: center; }
.agitate-quote { font-family: 'Cormorant Garamond', serif; font-size: clamp(26px,4.5vw,42px); font-weight: 300; font-style: italic; line-height: 1.5; max-width: 680px; margin: 0 auto 40px; position: relative; }
.agitate-quote::before { content: '\\201C'; position: absolute; top: -20px; left: -10px; font-size: 80px; color: var(--gold-dim); font-family: 'Cormorant Garamond', serif; line-height: 1; pointer-events: none; }
.agitate-author { font-size: 13px; letter-spacing: 0.1em; color: var(--muted2); }
.agitate-list { display: flex; flex-direction: column; gap: 16px; max-width: 560px; margin: 64px auto 0; text-align: left; }
.agitate-item { display: flex; align-items: flex-start; gap: 16px; padding: 20px 24px; background: var(--card); border: 1px solid var(--border); border-radius: var(--r); }
.agitate-item-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.agitate-item p { font-size: 15px; color: var(--muted); line-height: 1.7; }
.agitate-item p strong { color: var(--text); font-weight: 500; }

.solution { padding: 100px 0; border-top: 1px solid var(--border); }
.solution-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; margin-bottom: 80px; }
.solution-steps { display: flex; flex-direction: column; gap: 0; margin-top: 64px; }
.solution-step { display: grid; grid-template-columns: 56px 1fr; gap: 24px; padding: 32px 0; border-bottom: 1px solid var(--border); align-items: start; }
.solution-step:first-child { padding-top: 0; }
.solution-step:last-child { border-bottom: none; }
.step-number { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; color: rgba(201,168,76,0.25); line-height: 1; text-align: center; padding-top: 4px; }
.step-content h3 { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 400; margin-bottom: 8px; line-height: 1.3; }
.step-content p { font-size: 14px; color: var(--muted); line-height: 1.75; }

.what-you-get { padding: 100px 0; border-top: 1px solid var(--border); }
.features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--r2); overflow: hidden; margin-top: 64px; }
.feature-card { background: var(--card); padding: 32px 28px; transition: background 0.2s ease; }
.feature-card:hover { background: var(--card2); }
.feature-glyph { width: 40px; height: 40px; border-radius: 10px; background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 18px; }
.feature-card h3 { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; margin-bottom: 8px; line-height: 1.3; }
.feature-card p { font-size: 13.5px; color: var(--muted); line-height: 1.75; }

.testimonials { padding: 100px 0; border-top: 1px solid var(--border); text-align: center; }
.testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 64px; text-align: left; }
.testimonial { background: var(--card); border: 1px solid var(--border); border-radius: var(--r2); padding: 28px 24px; }
.testimonial-stars { color: var(--gold); font-size: 13px; letter-spacing: 2px; margin-bottom: 16px; }
.testimonial-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; font-style: italic; line-height: 1.65; margin-bottom: 20px; }
.testimonial-author { display: flex; align-items: center; gap: 10px; }
.testimonial-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--gold-dim); border: 1px solid rgba(201,168,76,0.2); display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 14px; color: var(--gold2); }
.testimonial-name { font-size: 12px; font-weight: 500; }
.testimonial-sign { font-size: 11px; color: var(--muted2); }

.pricing { padding: 100px 0; border-top: 1px solid var(--border); text-align: center; }
.pricing-card { max-width: 440px; margin: 64px auto 0; background: var(--card); border: 1px solid var(--border2); border-radius: var(--r2); overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 60px rgba(201,168,76,0.06); }
.pricing-card-top { padding: 40px 36px 32px; border-bottom: 1px solid var(--border); }
.pricing-label { font-size: 10px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
.pricing-price { font-family: 'Cormorant Garamond', serif; font-size: 72px; font-weight: 300; line-height: 1; margin-bottom: 4px; }
.pricing-price sup { font-size: 28px; vertical-align: super; margin-right: 2px; }
.pricing-period { font-size: 14px; color: var(--muted); margin-bottom: 24px; }
.pricing-card-body { padding: 32px 36px 40px; }
.pricing-features { list-style: none; text-align: left; margin-bottom: 32px; }
.pricing-features li { display: flex; align-items: center; gap: 12px; padding: 10px 0; font-size: 14px; color: var(--muted); border-bottom: 1px solid var(--border); }
.pricing-features li:last-child { border-bottom: none; }
.pricing-features li::before { content: '✦'; color: var(--gold); font-size: 10px; flex-shrink: 0; }
.pricing-cta { display: block; width: 100%; text-align: center; background: linear-gradient(135deg,var(--gold) 0%,var(--gold3) 100%); color: #08090f; font-weight: 600; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; padding: 18px; border-radius: 100px; transition: all 0.25s ease; box-shadow: 0 0 40px rgba(201,168,76,0.2); }
.pricing-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 48px rgba(201,168,76,0.35); }
.pricing-note { margin-top: 20px; font-size: 12px; color: var(--muted2); }

.faq { padding: 100px 0; border-top: 1px solid var(--border); }
.faq-list { margin-top: 64px; display: flex; flex-direction: column; gap: 0; }
.faq-item { border-bottom: 1px solid var(--border); padding: 28px 0; }
.faq-item:first-child { border-top: 1px solid var(--border); }
.faq-q { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; line-height: 1.4; }
.faq-q-icon { color: var(--gold); font-size: 18px; flex-shrink: 0; font-family: 'DM Sans', sans-serif; font-weight: 300; transition: transform 0.2s ease; }
.faq-a { font-size: 14px; color: var(--muted); line-height: 1.8; max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.2s ease; }
.faq-item.open .faq-a { max-height: 200px; padding-top: 16px; }
.faq-item.open .faq-q-icon { transform: rotate(45deg); }

.final-cta { padding: 120px 0; text-align: center; position: relative; border-top: 1px solid var(--border); }
.final-cta::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 600px; height: 400px; background: radial-gradient(ellipse at center, rgba(201,168,76,0.07) 0%, transparent 70%); pointer-events: none; }
.final-cta .section-title { margin-bottom: 16px; }
.final-cta .section-body { margin: 0 auto 48px; font-size: 18px; }

footer { border-top: 1px solid var(--border); padding: 40px 24px; text-align: center; }
.footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; letter-spacing: 0.16em; color: var(--gold); text-transform: uppercase; margin-bottom: 16px; }
.footer-links { display: flex; justify-content: center; gap: 28px; margin-bottom: 20px; }
.footer-links a { font-size: 12px; color: var(--muted2); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s ease; }
.footer-links a:hover { color: var(--muted); }
.footer-copy { font-size: 11px; color: var(--muted2); }

@media (max-width: 720px) {
  .problem-grid, .features-grid, .testimonials-grid { grid-template-columns: 1fr; }
  .solution-intro { grid-template-columns: 1fr; gap: 40px; }
  .hero { padding: 72px 0 60px; }
  section { padding: 72px 0; }
}
@media (max-width: 480px) {
  .hero h1 { font-size: 44px; }
  .pricing-price { font-size: 56px; }
}
`;
