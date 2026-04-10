import Link from 'next/link';
import { FEATURED_PRODUCTS } from '@/lib/data';
import ProductCard from '@/components/ui/ProductCard';
import styles from './FeaturedProducts.module.css';

export default function FeaturedProducts() {
  return (
    <section className={styles.productsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Featured Products</div>
        <Link href="/products" className={styles.viewAll}>View All →</Link>
      </div>
      <div className={styles.productsGrid}>
        {FEATURED_PRODUCTS.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
            <ProductCard product={product} />
          </Link>
        ))}
      </div>
    </section>
  );
}
