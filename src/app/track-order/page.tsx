import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import TrackOrderPage from '@/components/pages/TrackOrderPage';

export default function TrackOrder() {
  return (
    <>
      <TopBar />
      <Header />
      <NavBar />
      <main>
        <TrackOrderPage />
      </main>
      <Footer />
    </>
  );
}
