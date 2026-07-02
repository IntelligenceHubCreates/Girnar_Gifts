import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AccountPage from '@/components/pages/AccountPage';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import styles from './account.module.css';

export const metadata = { title: 'My Account — Little Loot' };

export default function Account() {
  return (
    <>
      <Header />

      <main className={styles.pageMain}>
        <AccountPage />
      </main>

      {/* Footer — visible on desktop, hidden on tablet & mobile (≤1024px) */}
      <div className={styles.footerWrap}>
        <Footer />
      </div>

      {/* Main website mobile nav — visible on tablet & mobile only (≤1024px) */}
      <MobileBottomNav />
    </>
  );
}

/* NOTE: the original file also imported TopBar and NavBar but never rendered
   them, so they were dropped to keep the route clean. Re-add if you need them. */