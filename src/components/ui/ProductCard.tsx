'use client';

import { useState } from 'react';
import type { Product } from '@/lib/data';
import styles from './ProductCard.module.css';

const BADGE_CLASSES: Record<string, string> = {
  sale: styles.badgeSale,
  new: styles.badgeNew,
  hot: styles.badgeHot,
};

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const [wishlisted, setWishlisted] = useState(false);

  const stars = Array.from({ length: 5 }, (_, i) => (i < product.stars ? '★' : '☆')).join('');

  return (
    <div className={styles.productCard}>
      <div className={styles.productImg} style={{ background: product.bgGradient }}>
        {product.emoji}
        {product.badges.length > 0 && (
          <div className={styles.productBadges}>
            {product.badges.map((b) => (
              <span key={b.label} className={`${styles.badge} ${BADGE_CLASSES[b.type]}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}
        <button
          className={`${styles.productWish} ${wishlisted ? styles.wishlisted : ''}`}
          onClick={() => setWishlisted(!wishlisted)}
          type="button"
          aria-label="Add to wishlist"
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>
      <div className={styles.productInfo}>
        <div className={styles.productCategory}>{product.category}</div>
        <div className={styles.productName}>{product.name}</div>
        <div className={styles.stars}>{stars}</div>
        <div className={styles.productPrice}>
          <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice && (
            <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
          )}
        </div>
        <button className={styles.productAdd} type="button">🛒 Add to Cart</button>
      </div>
    </div>
  );
}
