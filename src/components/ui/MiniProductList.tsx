import Link from 'next/link';
import type { MiniProduct } from '@/lib/data';
import styles from './MiniProductList.module.css';

interface Props {
  title: string;
  products: MiniProduct[];
}

export default function MiniProductList({ title, products }: Props) {
  const renderStars = (count: number) =>
    Array.from({ length: 5 }, (_, i) => (i < count ? '★' : '☆')).join('');

  return (
    <div className={styles.miniSection}>
      <div className={styles.miniSectionTitle}>
        {title}
        <Link href="#" className={styles.seeAll}>See All</Link>
      </div>
      {products.map((p) => (
        <div key={p.name} className={styles.miniProduct}>
          <div className={styles.miniThumb}>{p.emoji}</div>
          <div className={styles.miniInfo}>
            <div className={styles.miniName}>{p.name}</div>
            <div className={styles.miniStars}>{renderStars(p.stars)}</div>
            <div className={styles.miniPrice}>
              {p.price}
              {p.originalPrice && (
                <span className={styles.miniOriginal}>{p.originalPrice}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
