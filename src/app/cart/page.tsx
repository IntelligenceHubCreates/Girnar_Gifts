import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import CartPage from '@/components/pages/CartPage';
import styles from './cart.module.css';

export default function Cart() {
  return (
    <>
      <Header />
      <main className={styles.pageMain}>
        <CartPage />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
