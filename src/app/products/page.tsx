// app/products/page.tsx
// ─── All Products Page ────────────────────────────────────────────────────────

import CategoryPage from '@/components/pages/CategoryPage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import styles from './products.module.css';

export const metadata = {
  title: 'All Products',
  description: 'Discover our wide range of thoughtful gifts for every occasion.',
};

export default function AllProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const category = searchParams?.category;

  return (
    <>
      <Header />

      <main className={styles.pageMain}>
        <CategoryPage
          title={category ?? 'All Products'}
          emoji="🎁"
          description={
            category
              ? `Thoughtful ${category.toLowerCase()}, curated for every occasion.`
              : 'Discover our wide range of thoughtful gifts for every occasion.'
          }
          bgEmojis={['🎁', '🧺', '🎉', '🍫', '🌸']}
          parentLabel="Home"
          parentHref="/"
          apiCategory={category}
          // No categorySlug → fetchAllProducts is used, filtered by apiCategory when present
        />
      </main>

      {/* Footer — visible on desktop, hidden on tablet & mobile (≤1024px) */}
      <div className={styles.footerWrap}>
        <Footer />
      </div>

      {/* Main website mobile nav — visible on tablet & mobile only (≤1024px) */}
      <MobileBottomNav />
    </>
  );
}