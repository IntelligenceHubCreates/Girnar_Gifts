// app/products/page.tsx
// ─── All Products Page ────────────────────────────────────────────────────────

import CategoryPage from '@/components/pages/CategoryPage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import styles from './products.module.css';

export const metadata = {
  title: 'All Products | Little Loot',
  description: 'Discover our wide range of premium products for every child\'s need.',
};

export default function AllProductsPage() {
  return (
    <>
      <Header />

      <main className={styles.pageMain}>
        <CategoryPage
          title="All Products"
          emoji="🧸"
          description="Discover our wide range of premium products for every child's need."
          bgEmojis={['🎒', '🧸', '🎨', '📚', '🎯', '🎁']}
          tags={['School Bags', 'Lunch & Bottles', 'Toys & Games', 'Stationery', 'Arts & Crafts', 'Educational', 'Gift Sets']}
          parentLabel="Home"
          parentHref="/"
          // No categorySlug → fetchAllProducts is used
          heroGradient="linear-gradient(135deg, #FF6B35 0%, #FF8C42 40%, #FFA85C 100%)"
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