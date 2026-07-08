import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import HamperBuilderPage from '@/components/pages/HamperBuilderPage';
import styles from './build-a-hamper.module.css';

export const metadata = {
  title: 'Build Your Own Hamper',
  description: 'Pick the products you want, and we\'ll price your hamper for you.',
};

export default function BuildAHamperPage() {
  return (
    <>
      <Header />
      <main className={styles.pageMain}>
        <HamperBuilderPage />
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
