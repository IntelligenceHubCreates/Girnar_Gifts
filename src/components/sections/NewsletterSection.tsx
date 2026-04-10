'use client';

import { useState } from 'react';
import styles from './NewsletterSection.module.css';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className={styles.newsletter}>
      <h2>🎁 Get Exclusive Deals!</h2>
      <p>Subscribe and get 10% off your first order + early access to sales &amp; new arrivals.</p>
      {submitted ? (
        <div className={styles.successMsg}>🎉 You&apos;re subscribed! Check your inbox soon.</div>
      ) : (
        <div className={styles.newsletterForm}>
          <input
            type="email"
            placeholder="Enter your email address…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button type="button" onClick={handleSubmit}>Subscribe →</button>
        </div>
      )}
    </div>
  );
}
