'use client';

import { useState, useRef } from 'react';
import styles from './NewsletterSection.module.css';
import { brand } from '@/config/brand';

export default function NewsletterSection() {
  const [email, setEmail]         = useState('');
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function handleSubmit() {
    const trimmed = email.trim();

    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    if (!validate(trimmed)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Replace with your real newsletter API endpoint
      const res = await fetch('/api/newsletter/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? data?.message ?? 'Subscription failed');
      }

      setStatus('success');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Something went wrong. Please try again.');
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (status === 'error') { setStatus('idle'); setErrorMsg(''); }
  }

  return (
    <section className={styles.wrapper} aria-label="Newsletter signup">
      <div className={styles.inner}>

        {/* ── Illustration ── */}
        <div className={styles.illustration} aria-hidden="true">
          <EnvelopeIllustration />
        </div>

        {/* ── Copy ── */}
        <div className={styles.copy}>
          <p className={styles.heading}>Join the {brand.name} Family</p>
          <p className={styles.sub}>
            Get exclusive offers, parenting tips, and new arrivals straight to your inbox.
          </p>
        </div>

        {/* ── Form ── */}
        <div className={styles.formWrap}>
          {status === 'success' ? (
            <div className={styles.successPill} role="status">
              <span className={styles.successCheck}>✓</span>
              You&apos;re subscribed! Check your inbox.
            </div>
          ) : (
            <>
              <div className={`${styles.inputRow} ${status === 'error' ? styles.hasError : ''}`}>
                <input
                  ref={inputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleChange}
                  onKeyDown={handleKey}
                  disabled={status === 'loading'}
                  aria-label="Email address"
                  aria-invalid={status === 'error'}
                  aria-describedby={status === 'error' ? 'nl-error' : undefined}
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === 'loading'}
                  className={styles.btn}
                  aria-label="Subscribe to newsletter"
                >
                  {status === 'loading' ? (
                    <span className={styles.spinner} aria-hidden="true" />
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
              {status === 'error' && (
                <p id="nl-error" className={styles.errorMsg} role="alert">
                  {errorMsg}
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </section>
  );
}

// ── Inline SVG illustration — matches reference image exactly ─────

function EnvelopeIllustration() {
  return (
    <svg
      width="72"
      height="64"
      viewBox="0 0 72 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Envelope body */}
      <rect x="6" y="18" width="52" height="36" rx="4" fill="#fff" stroke="#e8a598" strokeWidth="1.5"/>
      {/* Envelope flap */}
      <path d="M6 22 L32 40 L58 22" stroke="#e8a598" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Heart on envelope */}
      <path
        d="M26 30 C26 27.5 28 26 30 27.5 C32 26 34 27.5 34 30 C34 33 30 36 30 36 C30 36 26 33 26 30Z"
        fill="#F97316"
      />
      {/* Stars / sparkles */}
      <text x="54" y="20" fontSize="11" fill="#F97316">✦</text>
      <text x="2"  y="36" fontSize="8"  fill="#F97316" opacity="0.7">✦</text>
      {/* Little confetti dots */}
      <circle cx="60" cy="30" r="2.5" fill="#fcd34d"/>
      <circle cx="4"  cy="22" r="2"   fill="#fcd34d" opacity="0.8"/>
    </svg>
  );
}