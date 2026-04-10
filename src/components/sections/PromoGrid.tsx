import Link from 'next/link';
import styles from './PromoGrid.module.css';

const PROMOS = [
  { cls: styles.p1, title: 'Barbie World 🩷', sub: 'Save up to 45% on all dolls & accessories', emoji: '🪆' },
  { cls: styles.p2, title: 'Teddy Bears 🧸', sub: 'Soft plushies starting from ₹299', emoji: '🐻' },
  { cls: styles.p3, title: 'Back to School 🎒', sub: 'Premium stationery for every student', emoji: '✏️' },
];

export default function PromoGrid() {
  return (
    <div className={styles.promoGrid}>
      {PROMOS.map((promo) => (
        <div key={promo.title} className={`${styles.promoCard} ${promo.cls}`}>
          <h3>{promo.title}</h3>
          <p>{promo.sub}</p>
          <Link href="#" className={styles.promoBtn}>Shop Now →</Link>
          <div className={styles.promoEmoji}>{promo.emoji}</div>
        </div>
      ))}
    </div>
  );
}
