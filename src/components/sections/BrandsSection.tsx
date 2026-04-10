import { BRANDS } from '@/lib/data';
import styles from './BrandsSection.module.css';

export default function BrandsSection() {
  return (
    <div className={styles.brandsSection}>
      <div className={styles.brandsTitle}>Our Trusted Brands</div>
      <div className={styles.brandsRow}>
        {BRANDS.map((brand) => (
          <div key={brand} className={styles.brandItem}>{brand}</div>
        ))}
      </div>
    </div>
  );
}
