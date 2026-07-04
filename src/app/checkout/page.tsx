import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import CheckoutPage from '@/components/pages/CheckoutPage';
import styles from './checkout.module.css';

export default function Checkout() {
  return (
    <>
      <Header />
      <main className={styles.pageMain}>
        <CheckoutPage />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
