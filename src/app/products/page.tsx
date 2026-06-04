// app/products/page.tsx  (or pages/products/index.tsx)
// ─── All Products Page ────────────────────────────────────────────────────────
// Drop this file at your route for /products.
// It reuses CategoryPage — no logic changes needed.

import CategoryPage from '@/components/pages/CategoryPage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'All Products | Little Loot',
  description: 'Discover our wide range of premium products for every child\'s need.',
};

export default function AllProductsPage() {
  return (
    <>
    <Header />
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
    <Footer />
    </>
  );
}