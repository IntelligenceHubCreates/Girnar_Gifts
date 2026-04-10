'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { _post } from '@/shared/fetchwrapper';
import styles from './SignupPage.module.css';

const PERKS = [
  { emoji: '🎁', title: 'Exclusive Deals', sub: 'Members-only offers daily' },
  { emoji: '🚀', title: 'Free Shipping', sub: 'On orders above ₹499' },
  { emoji: '⭐', title: 'Reward Points', sub: 'Earn on every purchase' },
  { emoji: '🔔', title: 'Early Access', sub: 'New arrivals first' },
];

function getStrength(pw: string): { level: number; label: string; cls: string } {
  if (!pw) return { level: 0, label: '', cls: '' };
  if (pw.length < 6) return { level: 1, label: 'Too weak', cls: 'weak' };
  if (pw.length < 8) return { level: 2, label: 'Fair', cls: 'fair' };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { level: 4, label: 'Strong 💪', cls: 'strong' };
  return { level: 3, label: 'Good', cls: 'good' };
}

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const strength = getStrength(form.password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile';
    if (!form.password) e.password = 'Password required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!agreed) e.terms = 'Please accept the terms';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      const response: any = await _post('/api/user/register', {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
        userId: response?.user?.id || '',
        userName: response?.user?.name || `${form.firstName} ${form.lastName}`.trim(),
        backendToken: response?.token || response?.user?.token || '',
      });
      if (result?.error) {
        setToast(true);
        setTimeout(() => { setToast(false); router.push('/login'); }, 2000);
      } else {
        setToast(true);
        setTimeout(() => { setToast(false); router.push('/'); }, 1500);
      }
    } catch (err: any) {
      setApiError(err?.message || err || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: ev.target.value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    if (apiError) setApiError('');
  };

  return (
    <div className={styles.page}>
      {/* ── Left: Form ── */}
      <div className={styles.leftPanel}>
        <div className={styles.formBox}>
          <h1 className={styles.formHeading}>Create Account 🎉</h1>
          <p className={styles.formSub}>
            Already have one? <Link href="/login">Sign in →</Link>
          </p>

          {apiError && <div className={styles.errorMsg} style={{ marginBottom: 12 }}>{apiError}</div>}

          {/* Name row */}
          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="su-fn">First Name</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>👤</span>
                <input id="su-fn" type="text" className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                  placeholder="Riya" value={form.firstName} onChange={set('firstName')} />
              </div>
              {errors.firstName && <span className={styles.errorMsg}>{errors.firstName}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="su-ln">Last Name</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>👤</span>
                <input id="su-ln" type="text" className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                  placeholder="Sharma" value={form.lastName} onChange={set('lastName')} />
              </div>
              {errors.lastName && <span className={styles.errorMsg}>{errors.lastName}</span>}
            </div>
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="su-email">Email Address</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>✉️</span>
              <input id="su-email" type="email" className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="riya@example.com" value={form.email} onChange={set('email')} />
            </div>
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="su-phone">Mobile Number <span style={{color:'#bbb',fontWeight:400}}>(optional)</span></label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>📱</span>
              <input id="su-phone" type="tel" className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                placeholder="9876543210" value={form.phone} onChange={set('phone')} maxLength={10} />
            </div>
            {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="su-pw">Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input id="su-pw" type={showPw ? 'text' : 'password'} className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="••••••••" value={form.password} onChange={set('password')} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide' : 'Show'}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password && (
              <>
                <div className={styles.strengthBar}>
                  {[1,2,3,4].map(n => (
                    <div key={n}
                      className={`${styles.strengthSeg} ${n <= strength.level ? `${styles.active} ${styles[strength.cls]}` : ''}`}
                    />
                  ))}
                </div>
                <p className={styles.strengthLabel}>{strength.label}</p>
              </>
            )}
            {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
          </div>

          {/* Terms */}
          <div className={styles.termsRow}>
            <input type="checkbox" id="su-terms" checked={agreed} onChange={e => {
              setAgreed(e.target.checked);
              if (errors.terms) setErrors(er => { const n = {...er}; delete n.terms; return n; });
            }} />
            <label htmlFor="su-terms" className={styles.termsText}>
              I agree to the <Link href="#">Terms of Service</Link> and <Link href="#">Privacy Policy</Link>
              {errors.terms && <><br/><span className={styles.errorMsg}>{errors.terms}</span></>}
            </label>
          </div>

          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            <span>{loading ? 'Creating Account…' : 'Create My Account'}</span> {!loading && <span>🚀</span>}
          </button>

          <div className={styles.divider}>or sign up with</div>

          <div className={styles.socialRow}>
            <button type="button" className={styles.socialBtn} onClick={() => signIn('google', { callbackUrl: '/' })}>
              <span className={styles.socialIcon}>🌐</span> Google
            </button>
            <button type="button" className={styles.socialBtn}>
              <span className={styles.socialIcon}>📘</span> Facebook
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Perks Panel ── */}
      <div className={styles.rightPanel}>
        <p className={styles.perksHeading}>Why Join Little Loot? 💛</p>
        <div className={styles.perksList}>
          {PERKS.map(p => (
            <div key={p.title} className={styles.perkItem}>
              <span className={styles.perkEmoji}>{p.emoji}</span>
              <div className={styles.perkText}>
                <strong>{p.title}</strong>
                <span>{p.sub}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.promoTag}>🎁 Get ₹100 off your first order!</div>
      </div>

      {toast && <div className={styles.toast}>🎉 Account created! Welcome to Little Loot!</div>}
    </div>
  );
}
