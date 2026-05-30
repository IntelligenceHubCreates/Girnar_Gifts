import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import ProductPage from '@/components/pages/ProductPage';

interface Props {
  params: { id: string };
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <>
      <Header />
      <main>
        <ProductPage productId={params.id} />
      </main>
      <Footer />
    </>
  );
}
