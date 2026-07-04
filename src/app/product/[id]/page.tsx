import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ProductPage from '@/components/pages/ProductPage';
import styles from '@/styles/pageLayout.module.css';

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
      <div className={styles.footerWrap}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
