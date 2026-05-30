'use client';

import { useState } from 'react';
import type { Product } from '@/lib/data';
import styles from './ProductCard.module.css';
import { _post } from '@/shared/fetchwrapper';

const BADGE_CLASSES: Record<string, string> = {
  sale: styles.badgeSale,
  new:  styles.badgeNew,
  hot:  styles.badgeHot,
};

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded]           = useState(false);
  const [loading, setLoading]       = useState(false);

  const stars = Array.from({ length: 5 }, (_, i) =>
    i < product.stars ? '★' : '☆'
  ).join('');

  async function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (loading || added) return;

    setLoading(true);
    try {
      await _post('/api/cart/items', {
        product_id: product.id,
        quantity: 1,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('[Cart] Failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleWishlist(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setWishlisted((prev) => !prev);
  }

  // FIX: Use optional chaining consistently — badges may be undefined
  const badges = product.badges ?? [];

  return (
    <div className={styles.productCard}>
      <div className={styles.productImg} style={{ background: product.bgGradient }}>
        {product.emoji}

        {/* FIX: Guard against undefined before mapping */}
        {badges.length > 0 && (
          <div className={styles.productBadges}>
            {badges.map((b) => (
              <span
                key={b.label}
                className={`${styles.badge} ${BADGE_CLASSES[b.type] ?? ''}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* FIX: Combine class names correctly so .wishlisted always wins */}
        <button
          className={[
            styles.productWish,
            wishlisted ? styles.wishlisted : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={handleWishlist}
          type="button"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      <div className={styles.productInfo}>
        <div className={styles.productCategory}>{product.category}</div>
        <div className={styles.productName} title={product.name}>
          {product.name}
        </div>
        <div className={styles.stars} aria-label={`${product.stars} out of 5 stars`}>
          {stars}
        </div>
        <div className={styles.productPrice}>
          <span className={styles.priceNow}>
            ₹{product.price?.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className={styles.priceWas}>
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* FIX: Added .productAddDone class that was missing from original CSS */}
        <button
          className={[
            styles.productAdd,
            added ? styles.productAddDone : '',
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          onClick={handleAddToCart}
          disabled={loading || added}
          aria-label={
            loading ? 'Adding to cart' : added ? 'Added to cart' : 'Add to cart'
          }
        >
          {loading ? 'Adding…' : added ? '✓ Added!' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}