import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import WishlistPage from '@/components/pages/WishlistPage';
import styles from '@/styles/pageLayout.module.css';

export const metadata = { title: 'My Wishlist — Little Loot' };

export default function Wishlist() {
  return (
    <>
      <Header />
      <main>
        <WishlistPage />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
