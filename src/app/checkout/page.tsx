import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import CheckoutPage from '@/components/pages/CheckoutPage';

export default function Checkout() {
  return (
    <>
      <TopBar />
      <Header />
      <NavBar />
      <main>
        <CheckoutPage />
      </main>
      <Footer />
    </>
  );
}
