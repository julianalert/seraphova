'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Step1Data {
  birth_date:    string;
  birth_city:    string;
  focus_areas:   string[];
  delivery_time: string;
  timezone:      string;
}

interface Step2Data {
  first_name:   string;
  email:        string;
  free_context: string;
}

type Errors1 = Partial<Record<'birth_date' | 'birth_city' | 'focus_areas', string>>;
type Errors2 = Partial<Record<'first_name' | 'email', string>>;

const FOCUS_OPTIONS = [
  { value: 'love',        label: 'Love & relationships', glyph: '💛' },
  { value: 'career',      label: 'Career & purpose',     glyph: '🏔' },
  { value: 'self',        label: 'Self & identity',      glyph: '🌿' },
  { value: 'transitions', label: 'Change & transitions', glyph: '🌊' },
  { value: 'health',      label: 'Wellbeing & energy',   glyph: '✨' },
  { value: 'decisions',   label: 'Decisions & clarity',  glyph: '🔮' },
];

const DELIVERY_TIMES = ['6am', '7am', '8am', '9am'];

const TIMEZONES = [
  { value: 'UTC-12',  label: 'UTC−12 — Baker Island, Howland Island' },
  { value: 'UTC-11',  label: 'UTC−11 — American Samoa, Midway Island' },
  { value: 'UTC-10',  label: 'UTC−10 — Hawaii (Honolulu)' },
  { value: 'UTC-9',   label: 'UTC−9 — Alaska (Anchorage)' },
  { value: 'UTC-8',   label: 'UTC−8 — US Pacific (Los Angeles, Vancouver)' },
  { value: 'UTC-7',   label: 'UTC−7 — US Mountain (Denver, Phoenix)' },
  { value: 'UTC-6',   label: 'UTC−6 — US Central (Chicago, Mexico City)' },
  { value: 'UTC-5',   label: 'UTC−5 — US Eastern (New York, Toronto)' },
  { value: 'UTC-4',   label: 'UTC−4 — Atlantic (Caracas, Santiago)' },
  { value: 'UTC-3',   label: 'UTC−3 — Brazil (São Paulo), Argentina (Buenos Aires)' },
  { value: 'UTC-2',   label: 'UTC−2 — South Georgia, Fernando de Noronha' },
  { value: 'UTC-1',   label: 'UTC−1 — Azores (Portugal)' },
  { value: 'UTC+0',   label: 'UTC+0 — UK (London), Ireland, West Africa (Ghana)' },
  { value: 'UTC+1',   label: 'UTC+1 — Central Europe (Paris, Berlin, Rome, Madrid)' },
  { value: 'UTC+2',   label: 'UTC+2 — Eastern Europe (Athens, Helsinki), Egypt, South Africa' },
  { value: 'UTC+3',   label: 'UTC+3 — Moscow, Turkey (Istanbul), East Africa (Nairobi)' },
  { value: 'UTC+4',   label: 'UTC+4 — UAE (Dubai), Azerbaijan (Baku), Mauritius' },
  { value: 'UTC+5',   label: 'UTC+5 — Pakistan (Karachi), Uzbekistan (Tashkent)' },
  { value: 'UTC+5:30',label: 'UTC+5:30 — India (Delhi, Mumbai), Sri Lanka' },
  { value: 'UTC+6',   label: 'UTC+6 — Bangladesh (Dhaka), Kazakhstan (Almaty)' },
  { value: 'UTC+7',   label: 'UTC+7 — Thailand (Bangkok), Vietnam, Indonesia (Jakarta)' },
  { value: 'UTC+8',   label: 'UTC+8 — China (Beijing), Singapore, Philippines (Manila)' },
  { value: 'UTC+9',   label: 'UTC+9 — Japan (Tokyo), Korea (Seoul)' },
  { value: 'UTC+10',  label: 'UTC+10 — Eastern Australia (Sydney, Melbourne)' },
  { value: 'UTC+11',  label: 'UTC+11 — Solomon Islands, New Caledonia' },
  { value: 'UTC+12',  label: 'UTC+12 — New Zealand (Auckland), Fiji' },
];

export default function StartPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [animating, setAnimating] = useState(false);

  // Separate MM / DD / YYYY inputs so format is always explicit
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay,   setBirthDay]   = useState('');
  const [birthYear,  setBirthYear]  = useState('');

  const [step1, setStep1] = useState<Step1Data>({
    birth_date:    '',
    birth_city:    '',
    focus_areas:   [],
    delivery_time: '7am',
    timezone:      'UTC+0',
  });

  const [step2, setStep2] = useState<Step2Data>({
    first_name:   '',
    email:        '',
    free_context: '',
  });

  const [errors1, setErrors1] = useState<Errors1>({});
  const [errors2, setErrors2] = useState<Errors2>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  function updateBirthDate(m: string, d: string, y: string) {
    if (m && d && y && y.length === 4) {
      const mm   = m.padStart(2, '0');
      const dd   = d.padStart(2, '0');
      setStep1(p => ({ ...p, birth_date: `${y}-${mm}-${dd}` }));
    } else {
      setStep1(p => ({ ...p, birth_date: '' }));
    }
  }

  function validateStep1(): boolean {
    const e: Errors1 = {};
    if (!step1.birth_date)              e.birth_date  = 'Please enter your date of birth.';
    if (!step1.birth_city.trim())       e.birth_city  = 'Please enter your city of birth.';
    if (step1.focus_areas.length === 0) e.focus_areas = 'Please select at least one area.';
    setErrors1(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Errors2 = {};
    if (!step2.first_name.trim())                          e.first_name = 'Please enter your first name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step2.email)) e.email      = 'Please enter a valid email address.';
    setErrors2(e);
    return Object.keys(e).length === 0;
  }

  function goToStep2() {
    if (!validateStep1()) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(2);
      setAnimating(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 260);
  }

  function goToStep1() {
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(1);
      setAnimating(false);
    }, 260);
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setSubmitting(true);
    setApiError('');

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...step1, ...step2 }),
      });

      const json = await res.json();

      if (!res.ok) {
        setApiError(json.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem('sera_name',     step2.first_name);
      sessionStorage.setItem('sera_email',    step2.email);
      sessionStorage.setItem('sera_delivery', step1.delivery_time);

      router.push(`/order?id=${json.orderId}`);
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  function toggleFocus(value: string) {
    setStep1(prev => {
      const current = prev.focus_areas;
      if (current.includes(value)) {
        return { ...prev, focus_areas: current.filter(v => v !== value) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, focus_areas: [...current, value] };
    });
    if (errors1.focus_areas) setErrors1(e => ({ ...e, focus_areas: undefined }));
  }

  return (
    <>
      <div className="stars" />
      <div className="aurora" />

      <div className="start-page">
        <nav className="start-nav" aria-label="Site">
          <div className="start-nav-logo">✦ Seraphova</div>
          <p className="start-nav-tagline">
            Daily personalized horoscope, based on your natal chart.
          </p>
        </nav>

      <main className={`onboarding ${animating ? 'ob-animating' : ''}`}>
        <div className="onboarding-inner">

          {/* Progress bars */}
          <div className="ob-progress">
            <div className={`ob-step ${currentStep === 1 ? 'active' : 'done'}`} />
            <div className={`ob-step ${currentStep === 2 ? 'active' : ''}`} />
          </div>

          {/* ─── STEP 1 ─── */}
          {currentStep === 1 && (
            <div className="screen">
              <p className="ob-eyebrow">Step 1 of 2 · Your chart</p>
              <h1 className="ob-title">Let&apos;s read <em>your chart.</em></h1>
              <p className="ob-sub">
                Your natal chart is the foundation of every reading you&apos;ll receive.
                We need your exact birth details to calculate it precisely.
              </p>

              <div className="ob-fields">

                <div className="ob-field">
                  <label className="label">Date of birth <span>*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8 }}>
                    <input
                      className={`input ${errors1.birth_date ? 'input-error' : ''}`}
                      type="number"
                      placeholder="MM"
                      min={1} max={12}
                      value={birthMonth}
                      onChange={e => {
                        const v = e.target.value.slice(0, 2);
                        setBirthMonth(v);
                        updateBirthDate(v, birthDay, birthYear);
                        setErrors1(p => ({ ...p, birth_date: undefined }));
                      }}
                    />
                    <input
                      className={`input ${errors1.birth_date ? 'input-error' : ''}`}
                      type="number"
                      placeholder="DD"
                      min={1} max={31}
                      value={birthDay}
                      onChange={e => {
                        const v = e.target.value.slice(0, 2);
                        setBirthDay(v);
                        updateBirthDate(birthMonth, v, birthYear);
                        setErrors1(p => ({ ...p, birth_date: undefined }));
                      }}
                    />
                    <input
                      className={`input ${errors1.birth_date ? 'input-error' : ''}`}
                      type="number"
                      placeholder="YYYY"
                      min={1900} max={new Date().getFullYear()}
                      value={birthYear}
                      onChange={e => {
                        const v = e.target.value.slice(0, 4);
                        setBirthYear(v);
                        updateBirthDate(birthMonth, birthDay, v);
                        setErrors1(p => ({ ...p, birth_date: undefined }));
                      }}
                    />
                  </div>
                  {errors1.birth_date && <span className="ob-error">{errors1.birth_date}</span>}
                </div>

                <div className="ob-field">
                  <label className="label">City of birth <span>*</span></label>
                  <input
                    className={`input ${errors1.birth_city ? 'input-error' : ''}`}
                    type="text"
                    placeholder="e.g. Paris, France"
                    value={step1.birth_city}
                    onChange={e => {
                      setStep1(p => ({ ...p, birth_city: e.target.value }));
                      setErrors1(p => ({ ...p, birth_city: undefined }));
                    }}
                  />
                  {errors1.birth_city && <span className="ob-error">{errors1.birth_city}</span>}
                </div>

                <div className="ob-divider" />

                <div className="ob-field">
                  <label className="label">What&apos;s most on your mind? <span>*</span></label>
                  <div className="choice-grid">
                    {FOCUS_OPTIONS.map(opt => (
                      <div
                        key={opt.value}
                        className={`choice-card ${step1.focus_areas.includes(opt.value) ? 'selected' : ''}`}
                        onClick={() => toggleFocus(opt.value)}
                      >
                        <span className="choice-icon">{opt.glyph}</span>
                        <span className="choice-label">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                  {errors1.focus_areas && (
                    <span className="ob-error">{errors1.focus_areas}</span>
                  )}
                </div>

                <div className="ob-divider" />

                <div className="ob-field">
                  <label className="label">When would you like your reading?</label>
                  <div className="time-options">
                    {DELIVERY_TIMES.map(t => (
                      <div
                        key={t}
                        className={`time-opt ${step1.delivery_time === t ? 'selected' : ''}`}
                        onClick={() => setStep1(p => ({ ...p, delivery_time: t }))}
                      >
                        {t === '7am' ? `${t} ✦` : t}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ob-field">
                  <label className="label">Your timezone</label>
                  <select
                    className="input"
                    value={step1.timezone}
                    onChange={e => setStep1(p => ({ ...p, timezone: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              <button
                className="btn btn-gold btn-full"
                style={{ marginTop: 32, padding: '16px 24px', fontSize: '15px', borderRadius: 'var(--r2)' }}
                onClick={goToStep2}
              >
                Continue to your reading →
              </button>
            </div>
          )}

          {/* ─── STEP 2 ─── */}
          {currentStep === 2 && (
            <div className="screen">
              <p className="ob-eyebrow">Step 2 of 2 · Your reading</p>
              <h1 className="ob-title">
                Where should we send it, <em>every morning?</em>
              </h1>
              <p className="ob-sub">
                Your personalized horoscope will land in your inbox before you start your day.
                We only use your email to send your daily reading — nothing else.
              </p>

              <div className="ob-trust-box">
                <span className="ob-trust-icon">📬</span>
                <p className="ob-trust-text">
                  <strong>Your reading is generated fresh every day</strong> from your natal chart
                  and that day&apos;s planetary transits. Your email is the only way we can deliver
                  it — we never share it, and we never spam.
                </p>
              </div>

              <div className="ob-fields">

                <div className="ob-field">
                  <label className="label">Your first name <span>*</span></label>
                  <input
                    className={`input ${errors2.first_name ? 'input-error' : ''}`}
                    type="text"
                    placeholder="e.g. Sofia"
                    value={step2.first_name}
                    onChange={e => {
                      setStep2(p => ({ ...p, first_name: e.target.value }));
                      setErrors2(p => ({ ...p, first_name: undefined }));
                    }}
                  />
                  {errors2.first_name && <span className="ob-error">{errors2.first_name}</span>}
                </div>

                <div className="ob-field">
                  <label className="label">Email address <span>*</span></label>
                  <input
                    className={`input ${errors2.email ? 'input-error' : ''}`}
                    type="email"
                    placeholder="you@example.com"
                    value={step2.email}
                    onChange={e => {
                      setStep2(p => ({ ...p, email: e.target.value }));
                      setErrors2(p => ({ ...p, email: undefined }));
                    }}
                  />
                  {errors2.email && <span className="ob-error">{errors2.email}</span>}
                </div>

                <div className="ob-field">
                  <label className="label">Anything specific going on right now?</label>
                  <textarea
                    className="input"
                    placeholder="Optional — a situation, a decision, a feeling. The more specific, the more your first reading will feel like it was written for you."
                    value={step2.free_context}
                    onChange={e => setStep2(p => ({ ...p, free_context: e.target.value }))}
                  />
                </div>

              </div>

              {apiError && <div className="ob-api-error">{apiError}</div>}

              <button
                className="btn btn-gold btn-full"
                style={{ marginTop: 32, padding: '16px 24px', fontSize: '15px', borderRadius: 'var(--r2)' }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Building your chart…' : 'Start my daily reading →'}
              </button>

              <button className="ob-back" onClick={goToStep1}>
                ← Back to chart details
              </button>
            </div>
          )}

          <div className="ob-footer">
            Your data is used only to generate your daily reading.
          </div>

        </div>
      </main>
      </div>

      <style>{`
        .start-page {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .start-nav {
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(8, 9, 15, 0.8);
          backdrop-filter: blur(20px);
        }
        .start-nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 400;
          letter-spacing: 0.16em;
          color: var(--gold2);
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .start-nav-tagline {
          font-size: 13px;
          color: var(--muted);
          text-align: right;
          line-height: 1.45;
          max-width: 320px;
        }
        .start-page .onboarding {
          flex: 1;
          min-height: 0;
        }
        .ob-animating { opacity: 0; transition: opacity 0.25s; }
        .input-error { border-color: rgba(220,100,80,0.5) !important; }
        @media (max-width: 640px) {
          .start-nav { padding: 16px 20px; gap: 16px; }
          .start-nav-logo { font-size: 17px; letter-spacing: 0.12em; }
          .start-nav-tagline { font-size: 12px; max-width: 180px; }
        }
        @media (max-width: 480px) {
          .ob-row, .choice-grid { grid-template-columns: 1fr; }
          .onboarding { padding: 32px 16px; }
        }
      `}</style>
    </>
  );
}
