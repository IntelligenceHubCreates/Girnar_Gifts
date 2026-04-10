'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { _post } from '@/shared/fetchwrapper';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      const response: any = await _post('/api/user/login', {
        email: form.email,
        password: form.password,
      });
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
        userId: response?.user?.id || '',
        userName: response?.user?.name || '',
        backendToken: response?.token || '',
      });
      if (result?.error) {
        setApiError('Login failed. Please try again.');
      } else {
        setToast(true);
        setTimeout(() => {
          setToast(false);
          router.push('/');
        }, 1500);
      }
    } catch (err: any) {
      setApiError(err?.message || err || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => signIn('google', { callbackUrl: '/' });

  const set = (field: string) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: ev.target.value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    if (apiError) setApiError('');
  };

  return (
    <div className={styles.page}>
      {/* ── Left decorative panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.brandMark}>
          🌟 Little<span className={styles.brandDot}>Loot</span>
        </div>
        <div className={styles.illustGrid}>
          {['🚀','🦕','🎨','🧸','🔮','🎭'].map((e, i) => (
            <div key={i} className={styles.illustCard}>{e}</div>
          ))}
        </div>
        <p className={styles.panelHeading}>Welcome back, Explorer! 🎉</p>
        <p className={styles.panelSub}>Your little one's wishlist is waiting.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <h1 className={styles.formHeading}>Sign In</h1>
          <p className={styles.formSub}>
            New here? <Link href="/signup">Create an account →</Link>
          </p>

          {apiError && <div className={styles.errorMsg} style={{ marginBottom: 12 }}>{apiError}</div>}

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">Email Address</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>✉️</span>
              <input
                id="login-email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-pw">Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                id="login-pw"
                type={showPw ? 'text' : 'password'}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
          </div>

          {/* Remember / Forgot */}
          <div className={styles.fieldRow}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <Link href="#" className={styles.forgotLink}>Forgot Password?</Link>
          </div>

          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            <span>{loading ? 'Signing In…' : 'Sign In'}</span> {!loading && <span>→</span>}
          </button>

          <div className={styles.divider}>or continue with</div>

          <div className={styles.socialRow}>
            <button type="button" className={styles.socialBtn} onClick={handleGoogle}>
              <span className={styles.socialIcon}>🌐</span> Google
            </button>
            <button type="button" className={styles.socialBtn}>
              <span className={styles.socialIcon}>📘</span> Facebook
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={styles.toast}>✅ Logged in successfully!</div>
      )}
    </div>
  );
}
