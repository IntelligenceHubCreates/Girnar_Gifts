import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import CartPage from '@/components/pages/CartPage';

export default function Cart() {
  return (
    <>
      <Header />
      <main>
        <CartPage />
      </main>
      <Footer />
    </>
  );
}
