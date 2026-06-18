'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Step1Data {
  birth_date:    string;
  birth_time:    string;
  birth_city:    string;
  focus_areas:   string[];
  delivery_time: string;
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

export default function StartPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [animating, setAnimating] = useState(false);

  const [step1, setStep1] = useState<Step1Data>({
    birth_date:    '',
    birth_time:    '',
    birth_city:    '',
    focus_areas:   [],
    delivery_time: '7am',
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

  // ─── Validation ────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const e: Errors1 = {};
    if (!step1.birth_date)             e.birth_date  = 'Please enter your date of birth.';
    if (!step1.birth_city.trim())      e.birth_city  = 'Please enter your city of birth.';
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

  // ─── Step navigation ───────────────────────────────────────────────────────

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

  // ─── Submit ────────────────────────────────────────────────────────────────

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

      // Persist minimal data for /order page
      sessionStorage.setItem('sera_name',     step2.first_name);
      sessionStorage.setItem('sera_email',    step2.email);
      sessionStorage.setItem('sera_delivery', step1.delivery_time);

      router.push(`/order?id=${json.orderId}`);
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  // ─── Focus area toggle ─────────────────────────────────────────────────────

  function toggleFocus(value: string) {
    setStep1(prev => {
      const current = prev.focus_areas;
      if (current.includes(value)) {
        return { ...prev, focus_areas: current.filter(v => v !== value) };
      }
      if (current.length >= 3) return prev; // max 3
      return { ...prev, focus_areas: [...current, value] };
    });
    if (errors1.focus_areas) setErrors1(e => ({ ...e, focus_areas: undefined }));
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{startCSS}</style>
      <div className="stars" />
      <div className="aurora" />

      <div className="page">
        <nav>
          <Link href="/" className="nav-logo">✦ Seraphova</Link>
          <Link href="/" className="nav-back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Back to home
          </Link>
        </nav>

        <main>
          {/* Progress */}
          <div className="progress-wrap">
            <div className="progress-steps">
              <div className="progress-step">
                <div className={`step-dot ${currentStep === 1 ? 'active' : 'done'}`}>
                  {currentStep > 1 ? '✓' : <span>1</span>}
                </div>
                <div className={`step-line ${currentStep > 1 ? 'done' : ''}`} />
              </div>
              <div className="progress-step">
                <div className={`step-dot ${currentStep === 2 ? 'active' : ''}`}>
                  <span>2</span>
                </div>
              </div>
            </div>
            <div className="progress-labels">
              <span className={`progress-label ${currentStep === 1 ? 'active' : 'done'}`}>Your birth chart</span>
              <span className={`progress-label ${currentStep === 2 ? 'active' : ''}`}>Your reading</span>
            </div>
          </div>

          {/* Card */}
          <div className={`quiz-card ${animating ? 'animating' : ''}`}>

            {/* ─── STEP 1 ─── */}
            {currentStep === 1 && (
              <div className="step active">
                <div className="quiz-card-header">
                  <p className="card-eyebrow">Step 1 of 2 · Your chart</p>
                  <h1 className="card-title">Let&apos;s read<br /><em>your chart.</em></h1>
                  <p className="card-subtitle">Your natal chart is the foundation of every reading you&apos;ll receive. We need your exact birth details to calculate it precisely.</p>
                </div>
                <div className="quiz-card-body">
                  <div className="field-group">

                    <div className={`field ${errors1.birth_date ? 'has-error' : ''}`}>
                      <label htmlFor="dob">Date of birth <span>*</span></label>
                      <input
                        type="date" id="dob"
                        value={step1.birth_date}
                        onChange={e => { setStep1(p => ({ ...p, birth_date: e.target.value })); setErrors1(p => ({ ...p, birth_date: undefined })); }}
                      />
                      {errors1.birth_date && <span className="field-error">{errors1.birth_date}</span>}
                    </div>

                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="birth_time">Time of birth</label>
                        <input
                          type="time" id="birth_time"
                          value={step1.birth_time}
                          onChange={e => setStep1(p => ({ ...p, birth_time: e.target.value }))}
                        />
                        <p className="field-hint">Optional — but makes your rising sign accurate.</p>
                      </div>
                      <div className={`field ${errors1.birth_city ? 'has-error' : ''}`}>
                        <label htmlFor="birth_city">City of birth <span>*</span></label>
                        <input
                          type="text" id="birth_city" placeholder="e.g. Paris, France"
                          value={step1.birth_city}
                          onChange={e => { setStep1(p => ({ ...p, birth_city: e.target.value })); setErrors1(p => ({ ...p, birth_city: undefined })); }}
                        />
                        {errors1.birth_city && <span className="field-error">{errors1.birth_city}</span>}
                      </div>
                    </div>

                    <div className="field-divider" />

                    <div className="field">
                      <label>What&apos;s most on your mind right now? <span>*</span></label>
                      <div className="focus-grid">
                        {FOCUS_OPTIONS.map(opt => (
                          <label
                            key={opt.value}
                            className={`focus-label ${step1.focus_areas.includes(opt.value) ? 'checked' : ''}`}
                            onClick={() => toggleFocus(opt.value)}
                          >
                            <span className={`focus-check ${step1.focus_areas.includes(opt.value) ? 'checked' : ''}`}>
                              {step1.focus_areas.includes(opt.value) ? '✓' : ''}
                            </span>
                            <span className="focus-glyph">{opt.glyph}</span>
                            {opt.label}
                          </label>
                        ))}
                      </div>
                      {errors1.focus_areas && <span className="field-error" style={{ display: 'block' }}>{errors1.focus_areas}</span>}
                    </div>

                    <div className="field-divider" />

                    <div className="field">
                      <label>When would you like your reading?</label>
                      <div className="time-options">
                        {DELIVERY_TIMES.map(t => (
                          <label
                            key={t}
                            className={`time-opt-label ${step1.delivery_time === t ? 'checked' : ''}`}
                            onClick={() => setStep1(p => ({ ...p, delivery_time: t }))}
                          >
                            {t === '7am' ? `${t.toUpperCase()} ✦` : t.toUpperCase()}
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>

                  <button className="btn-submit" onClick={goToStep2}>
                    Continue to your reading
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2 ─── */}
            {currentStep === 2 && (
              <div className="step active">
                <div className="quiz-card-header">
                  <p className="card-eyebrow">Step 2 of 2 · Your reading</p>
                  <h1 className="card-title">Where should we<br />send it, <em>every morning?</em></h1>
                  <p className="card-subtitle">Your personalized horoscope will land in your inbox before you start your day. We only use your email to send your daily reading — nothing else.</p>
                </div>
                <div className="quiz-card-body">

                  <div className="email-trust-box">
                    <span className="email-trust-icon">📬</span>
                    <p className="email-trust-text">
                      <strong>Your reading is generated fresh every day</strong> from your natal chart and that day&apos;s planetary transits. Your email is the only way we can deliver it — we never share it, and we never spam.
                    </p>
                  </div>

                  <div className="field-group">

                    <div className={`field ${errors2.first_name ? 'has-error' : ''}`}>
                      <label htmlFor="first_name">Your first name <span>*</span></label>
                      <input
                        type="text" id="first_name" placeholder="e.g. Sofia"
                        value={step2.first_name}
                        onChange={e => { setStep2(p => ({ ...p, first_name: e.target.value })); setErrors2(p => ({ ...p, first_name: undefined })); }}
                      />
                      {errors2.first_name && <span className="field-error">{errors2.first_name}</span>}
                    </div>

                    <div className={`field ${errors2.email ? 'has-error' : ''}`}>
                      <label htmlFor="email">Email address <span>*</span></label>
                      <input
                        type="email" id="email" placeholder="you@example.com"
                        value={step2.email}
                        onChange={e => { setStep2(p => ({ ...p, email: e.target.value })); setErrors2(p => ({ ...p, email: undefined })); }}
                      />
                      {errors2.email && <span className="field-error">{errors2.email}</span>}
                    </div>

                    <div className="field">
                      <label htmlFor="context">Anything specific going on right now?</label>
                      <textarea
                        id="context"
                        placeholder="Optional — a situation, a decision, a feeling. The more specific, the more your first reading will feel like it was written for you."
                        value={step2.free_context}
                        onChange={e => setStep2(p => ({ ...p, free_context: e.target.value }))}
                      />
                    </div>

                  </div>

                  {apiError && <p className="api-error">{apiError}</p>}

                  <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Building your chart…' : 'Start my daily reading →'}
                    {!submitting && (
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    )}
                  </button>

                  <button className="btn-back" onClick={goToStep1}>← Back to chart details</button>

                </div>
              </div>
            )}

          </div>
        </main>

        <footer>
          <p className="footer-note">
            Your data is used only to generate your daily reading.{' '}
            <a href="#">Privacy policy</a> · <a href="#">Terms</a>
          </p>
        </footer>
      </div>
    </>
  );
}

const startCSS = `
nav {
  padding: 20px 32px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border);
  background: rgba(8,9,15,0.75); backdrop-filter: blur(20px);
}
.nav-logo { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; letter-spacing: 0.16em; color: var(--gold2); text-transform: uppercase; text-decoration: none; }
.nav-back { font-size: 13px; color: var(--muted); text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color 0.2s ease; }
.nav-back:hover { color: var(--text); }

.page { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 60px 24px 80px; }

.progress-wrap { width: 100%; max-width: 520px; margin-bottom: 48px; }
.progress-steps { display: flex; align-items: center; margin-bottom: 12px; }
.progress-step { display: flex; align-items: center; gap: 10px; flex: 1; }
.progress-step:last-child { flex: 0; }
.step-dot { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border2); background: var(--card); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: var(--muted2); flex-shrink: 0; transition: all 0.35s ease; }
.step-dot.active { border-color: var(--gold); background: var(--gold-dim); color: var(--gold2); box-shadow: 0 0 16px rgba(201,168,76,0.2); }
.step-dot.done { border-color: rgba(201,168,76,0.4); background: var(--gold-dim); color: var(--gold); }
.step-line { flex: 1; height: 1px; background: var(--border); margin: 0 2px; transition: background 0.35s ease; }
.step-line.done { background: rgba(201,168,76,0.3); }
.progress-labels { display: flex; justify-content: space-between; }
.progress-label { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; color: var(--muted2); transition: color 0.3s ease; }
.progress-label.active { color: var(--gold); }
.progress-label.done { color: var(--muted); }

.quiz-card { width: 100%; max-width: 520px; background: var(--card); border: 1px solid var(--border2); border-radius: var(--r2); overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.05); }
.quiz-card.animating { opacity: 0; transform: translateX(-10px); transition: opacity 0.25s, transform 0.25s; }
.step { animation: fadeSlideIn 0.4s cubic-bezier(.22,1,.36,1) both; }
@keyframes fadeSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }

.quiz-card-header { padding: 36px 40px 28px; border-bottom: 1px solid var(--border); background: linear-gradient(160deg,var(--card2) 0%,var(--card) 100%); }
.card-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
.card-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; line-height: 1.25; margin-bottom: 8px; }
.card-title em { font-style: italic; color: var(--gold2); }
.card-subtitle { font-size: 14px; color: var(--muted); line-height: 1.65; }
.quiz-card-body { padding: 36px 40px 40px; }

.field-group { display: flex; flex-direction: column; gap: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
label { font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
label span { color: var(--gold); margin-left: 3px; }
input[type="text"], input[type="email"], input[type="date"], input[type="time"], select, textarea {
  width: 100%; background: var(--deep); border: 1px solid var(--border2); border-radius: var(--r);
  padding: 13px 16px; font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--text);
  outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; -webkit-appearance: none; appearance: none;
}
input:focus, textarea:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }
input::placeholder, textarea::placeholder { color: var(--muted2); }
input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
textarea { resize: none; min-height: 90px; line-height: 1.6; }
.field-hint { font-size: 12px; color: var(--muted2); line-height: 1.5; font-style: italic; }
.field-error { font-size: 12px; color: var(--error); }
.field.has-error input, .field.has-error select, .field.has-error textarea { border-color: rgba(220,100,80,0.5); }
.api-error { font-size: 13px; color: var(--error); margin-top: 16px; padding: 12px 16px; background: var(--error-dim); border-radius: var(--r); border: 1px solid rgba(220,100,80,0.2); }

.focus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.focus-label { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--deep); border: 1px solid var(--border2); border-radius: var(--r); cursor: pointer; font-size: 14px; color: var(--muted); transition: all 0.2s ease; user-select: none; text-transform: none; letter-spacing: normal; font-weight: 400; }
.focus-label:hover { border-color: rgba(201,168,76,0.3); color: var(--text); }
.focus-label.checked { background: var(--gold-dim); border-color: rgba(201,168,76,0.5); color: var(--text); }
.focus-check { width: 18px; height: 18px; border-radius: 4px; border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; transition: all 0.2s ease; }
.focus-check.checked { background: var(--gold-dim); border-color: var(--gold); color: var(--gold); }
.focus-glyph { font-size: 15px; flex-shrink: 0; }

.time-options { display: flex; gap: 10px; flex-wrap: wrap; }
.time-opt-label { padding: 10px 18px; background: var(--deep); border: 1px solid var(--border2); border-radius: 100px; font-size: 13px; color: var(--muted); cursor: pointer; transition: all 0.2s ease; text-transform: none; letter-spacing: normal; font-weight: 400; }
.time-opt-label:hover { border-color: rgba(201,168,76,0.3); color: var(--text); }
.time-opt-label.checked { background: var(--gold-dim); border-color: rgba(201,168,76,0.5); color: var(--gold2); }

.field-divider { height: 1px; background: var(--border); margin: 4px 0; }

.email-trust-box { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; background: var(--gold-glow); border: 1px solid rgba(201,168,76,0.15); border-radius: var(--r); margin-bottom: 24px; }
.email-trust-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.email-trust-text { font-size: 13px; color: var(--muted); line-height: 1.65; }
.email-trust-text strong { color: var(--text); font-weight: 500; }

.btn-submit { width: 100%; margin-top: 32px; display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(135deg,var(--gold) 0%,var(--gold3) 100%); color: #08090f; font-weight: 600; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; padding: 18px; border-radius: 100px; border: none; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 0 36px rgba(201,168,76,0.2); font-family: 'DM Sans', sans-serif; }
.btn-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(201,168,76,0.35); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-submit svg { width: 16px; height: 16px; flex-shrink: 0; }
.btn-back { width: 100%; margin-top: 14px; background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted2); cursor: pointer; padding: 10px; transition: color 0.2s ease; text-align: center; }
.btn-back:hover { color: var(--muted); }

footer { border-top: 1px solid var(--border); padding: 28px 24px; text-align: center; }
.footer-note { font-size: 12px; color: var(--muted2); }
.footer-note a { color: var(--muted); text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 560px) {
  .quiz-card-header, .quiz-card-body { padding: 28px 24px; }
  .field-row, .focus-grid { grid-template-columns: 1fr; }
  .card-title { font-size: 24px; }
  main { padding: 40px 16px 60px; }
}
`;
