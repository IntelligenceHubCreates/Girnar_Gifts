'use client';

// Next.js renders this in place of the root layout when an error escapes an
// error boundary, so it must supply its own <html>/<body> and can't rely on
// design-tokens.css having loaded — hex values are inlined on purpose.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#FFFBFC',
          color: '#2A1218',
        }}
      >
        <span style={{ fontSize: '3rem', marginBottom: '20px' }} aria-hidden="true">🎁</span>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Something went wrong</h1>
        <p style={{ color: '#5B474C', marginBottom: '28px', maxWidth: '440px' }}>
          We hit an unexpected error. Please try again, or head back to the homepage.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '13px 26px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '0.92rem',
              border: 'none',
              cursor: 'pointer',
              background: '#7A1E33',
              color: '#fff',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '13px 26px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'none',
              background: '#FFFFFF',
              color: '#7A1E33',
              border: '1px solid #F0E1E5',
            }}
          >
            Back to home
          </a>
        </div>
      </body>
    </html>
  );
}
