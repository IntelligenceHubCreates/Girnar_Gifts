'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { _post } from '@/shared/fetchwrapper';
import { brand } from '@/config/brand';
import styles from './LoginPage.module.css';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </g>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

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
        showToast('success', '✅ Logged in successfully!');
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      setApiError(err?.message || err || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
  try {
    setGoogleLoading(true);
    // ✅ Sign out first to clear any existing session/cookie
    await signIn('google', { callbackUrl: '/' });
  } catch {
    showToast('error', 'Google sign-in failed. Please try again.');
    setGoogleLoading(false);
  }
};

  const set = (field: string) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: ev.target.value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    if (apiError) setApiError('');
  };

  const anyLoading = loading || googleLoading;

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.brandMark}>
          <span className={styles.brandIcon}>
            <Image src={brand.assets.favicon} alt="" fill sizes="34px" />
          </span>
          {brand.shortName}<span className={styles.brandDot}>{brand.name.replace(brand.shortName, '').trim()}</span>
        </div>
        <div className={styles.illustGrid}>
          {['🎁', '🧺', '🎉', '👝', '🧴', '🌸'].map((e, i) => (
            <div key={i} className={styles.illustCard}>{e}</div>
          ))}
        </div>
        <p className={styles.panelHeading}>Welcome back</p>
        <p className={styles.panelSub}>Your wishlist and orders are right where you left them.</p>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <h1 className={styles.formHeading}>Sign In</h1>
          <p className={styles.formSub}>
            New here? <Link href="/signup">Create an account →</Link>
          </p>

          {apiError && <div className={styles.errorBanner}>{apiError}</div>}

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
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
          </div>

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
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
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

          <div className={styles.fieldRow}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <Link href="/forgot-password" className={styles.forgotLink}>Forgot Password?</Link>
          </div>

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={anyLoading}
          >
            <span>{loading ? 'Signing In…' : 'Sign In'}</span>
            {!loading && <span>→</span>}
          </button>

          <div className={styles.divider}>or continue with</div>

          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={anyLoading}
          >
            {googleLoading ? <span className={styles.spinner} /> : <GoogleLogo />}
            <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function signOut(arg0: { redirect: boolean; }) {
  throw new Error('Function not implemented.');
}
