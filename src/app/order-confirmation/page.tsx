import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import OrderConfirmationClient from './OrderConfirmationClient';
import styles from '@/styles/pageLayout.module.css';
import { Suspense } from 'react';

export default function OrderConfirmationPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={null}>
          <OrderConfirmationClient />
        </Suspense>
      </main>
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
