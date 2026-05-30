// app/order-confirmation/page.tsx
import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import OrderConfirmationClient from './OrderConfirmationClient';
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
      <Footer />
    </>
  );
}