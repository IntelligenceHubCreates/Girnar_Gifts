import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import CategoryPage from '@/components/pages/CategoryPage';

export default function ToysPage() {
  return (
    <>
      <TopBar />
      <Header />
      <NavBar />
      <main>
        <CategoryPage />
      </main>
      <Footer />
    </>
  );
}
