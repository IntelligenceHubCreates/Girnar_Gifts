import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import TrackOrderPage from '@/components/pages/TrackOrderPage';
import styles from './track-order.module.css';

export default function TrackOrder() {
  return (
    <>
      <Header />
      <main>
        <TrackOrderPage />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
