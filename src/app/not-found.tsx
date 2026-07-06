import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import pageStyles from '@/styles/pageLayout.module.css';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className={styles.wrap}>
        <span className={styles.badge} aria-hidden="true">🎁</span>
        <p className={styles.eyebrow}>404</p>
        <h1 className={styles.title}>This page has been unwrapped already</h1>
        <p className={styles.body}>
          We couldn&apos;t find the page you were looking for. It may have moved,
          or the link might be out of date.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>Back to home</Link>
          <Link href="/products" className={styles.secondaryBtn}>Browse gifts</Link>
        </div>
      </main>
      <div className={pageStyles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
