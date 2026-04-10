'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PRODUCT_DETAILS, FEATURED_PRODUCTS } from '@/lib/data';
import ProductCard from '@/components/ui/ProductCard';
import styles from './ProductPage.module.css';
import { _get, _post } from '@/shared/fetchwrapper';

const BADGE_CLASSES: Record<string, string> = {
  sale: styles.badgeSale,
  new: styles.badgeNew,
  hot: styles.badgeHot,
};

const REVIEWS = [
  { name: 'Priya S.', avatar: '👩', location: 'Hyderabad', stars: 5, date: 'March 2026', text: 'Absolutely worth every rupee! The quality exceeded my expectations and my child has not put it down since it arrived.' },
  { name: 'Rahul M.', avatar: '👨', location: 'Vijayawada', stars: 5, date: 'February 2026', text: 'Delivery was super fast — reached in 2 days! Packaging was beautiful and the product looks exactly like the photos.' },
  { name: 'Ananya R.', avatar: '👩‍💼', location: 'Guntur', stars: 4, date: 'February 2026', text: 'Great quality for the price. My little one loves it. Would have given 5 stars if it came with a small carry bag.' },
];

interface Props {
  productId: number | string;
}

export default function ProductPage({ productId }: Props) {
  // Use static data as default, overwrite with real API data if available
  const staticProduct = PRODUCT_DETAILS[Number(productId)] ?? PRODUCT_DETAILS[1];
  const [product, setProduct] = useState(staticProduct);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'reviews'>('details');
  const [pincode, setPincode] = useState('');
  const [pincodeMsg, setPincodeMsg] = useState('');

  /* ─── Load real product from backend ────────────────────────────── */
  useEffect(() => {
    if (!productId) return;
    _get(`/api/product/${productId}`).then((res: any) => {
      const p = res?.product_details || res;
      if (p && p.name) {
        const images = (p.product_image || []).map((img: any) => img.url || img);
        // Map backend shape → Little Loot shape
        const price = (p.original_price || 0) - (p.amount_discount || 0);
        setProduct({
          ...staticProduct,
          id: p.id ?? staticProduct.id,
          name: p.name ?? staticProduct.name,
          category: p.category ?? staticProduct.category,
          description: p.description ?? staticProduct.description,
          price: price || staticProduct.price,
          originalPrice: p.original_price ?? staticProduct.originalPrice,
          inStock: (p.count ?? 1) > 0,
          stockCount: p.count ?? staticProduct.stockCount,
          images: images.length > 0 ? images : staticProduct.images,
          imageBgs: images.length > 0 ? images.map(() => 'linear-gradient(135deg,#f0f0f0,#e0e0e0)') : staticProduct.imageBgs,
          highlights: p.details ?? staticProduct.highlights,
          longDescription: p.description ?? staticProduct.longDescription,
        });
      }
    }).catch(() => {}); // silently fall back to static data
  }, [productId]);

  /* ─── Add to Cart with backend sync ─────────────────────────────── */

  const stars = Array.from({ length: 5 }, (_, i) => i < product.stars ? '★' : '☆');

  const relatedProducts = product.relatedIds
    .map((id) => FEATURED_PRODUCTS.find((p) => p.id === id))
    .filter(Boolean) as typeof FEATURED_PRODUCTS;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  function handleCart() {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    // Sync to backend
    _post('/api/cart/items', { product_id: product.id, quantity: qty }).catch(() => {});
  }

  function checkPincode() {
    if (pincode.length !== 6 || isNaN(Number(pincode))) {
      setPincodeMsg('Please enter a valid 6-digit pincode.');
      return;
    }
    setPincodeMsg('✅ Delivery available! Expected: 2–4 business days');
  }

  return (
    <div className={styles.page}>
      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <Link href="/toys" className={styles.breadLink}>{product.category}</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>{product.name}</span>
      </div>

      {/* ── Main Grid ── */}
      <div className={styles.mainGrid}>

        {/* Left: Image Gallery */}
        <div className={styles.gallery}>
          <div className={styles.galleryMain} style={{ background: product.imageBgs[activeImg] }}>
            <div className={styles.galleryMainEmoji}>{product.images[activeImg]}</div>
            {product.badges.length > 0 && (
              <div className={styles.galleryBadges}>
                {product.badges.map((b) => (
                  <span key={b.label} className={`${styles.badge} ${BADGE_CLASSES[b.type]}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
            <button
              className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
              onClick={() => setWishlisted(!wishlisted)}
              aria-label="Add to wishlist"
            >
              {wishlisted ? '❤️' : '🤍'}
            </button>
          </div>
          <div className={styles.galleryThumbs}>
            {product.images.map((img, i) => (
              <button
                key={i}
                className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                style={{ background: product.imageBgs[i] }}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
              >
                <span>{img}</span>
              </button>
            ))}
          </div>
          {/* Trust badges strip */}
          <div className={styles.trustStrip}>
            <div className={styles.trustItem}><span>🚚</span><span>Free Shipping<br /><small>Over ₹499</small></span></div>
            <div className={styles.trustItem}><span>🔄</span><span>30-Day<br /><small>Easy Returns</small></span></div>
            <div className={styles.trustItem}><span>🛡️</span><span>BIS<br /><small>Certified</small></span></div>
            <div className={styles.trustItem}><span>💬</span><span>24/7<br /><small>Support</small></span></div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className={styles.info}>
          {/* Category pill */}
          <div className={styles.categoryPill}>{product.category}</div>

          <h1 className={styles.productTitle}>{product.name}</h1>

          {/* Rating row */}
          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {stars.map((s, i) => (
                <span key={i} className={s === '★' ? styles.starFilled : styles.starEmpty}>{s}</span>
              ))}
            </div>
            <span className={styles.ratingNum}>{product.stars}.0</span>
            <span className={styles.reviewCount}>({product.reviewCount} reviews)</span>
          </div>

          {/* Price block */}
          <div className={styles.priceBlock}>
            <span className={styles.priceNow}>₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <>
                <span className={styles.priceWas}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
                <span className={styles.priceSave}>Save {discount}%</span>
              </>
            )}
          </div>
          <p className={styles.taxNote}>Inclusive of all taxes. MRP ₹{(product.originalPrice ?? product.price).toLocaleString('en-IN')}</p>

          {/* Stock status */}
          <div className={product.stockCount < 10 ? styles.stockLow : styles.stockOk}>
            {product.inStock
              ? product.stockCount < 10
                ? `⚡ Only ${product.stockCount} left in stock — order soon!`
                : `✅ In Stock (${product.stockCount}+ units available)`
              : '❌ Out of Stock'}
          </div>

          {/* Short description */}
          <p className={styles.shortDesc}>{product.description}</p>

          {/* Key specs grid */}
          <div className={styles.specsGrid}>
            <div className={styles.specItem}>
              <span className={styles.specIcon}>🎂</span>
              <div>
                <div className={styles.specLabel}>Age Range</div>
                <div className={styles.specValue}>{product.ageRange}</div>
              </div>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specIcon}>🧪</span>
              <div>
                <div className={styles.specLabel}>Material</div>
                <div className={styles.specValue}>{product.material}</div>
              </div>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specIcon}>📐</span>
              <div>
                <div className={styles.specLabel}>Dimensions</div>
                <div className={styles.specValue}>{product.dimensions}</div>
              </div>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specIcon}>🛡️</span>
              <div>
                <div className={styles.specLabel}>Safety</div>
                <div className={styles.specValue}>{product.safetyInfo}</div>
              </div>
            </div>
          </div>

          {/* Quantity + CTA */}
          <div className={styles.ctaRow}>
            <div className={styles.qtyControl}>
              <button
                className={styles.qtyBtn}
                onClick={() => setQty(Math.max(1, qty - 1))}
                aria-label="Decrease quantity"
              >−</button>
              <span className={styles.qtyNum}>{qty}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => setQty(qty + 1)}
                aria-label="Increase quantity"
              >+</button>
            </div>
            <button
              className={`${styles.addToCartBtn} ${addedToCart ? styles.addedToCart : ''}`}
              onClick={handleCart}
              disabled={!product.inStock}
            >
              {addedToCart ? '✓ Added to Cart!' : '🛒 Add to Cart'}
            </button>
            <button className={styles.buyNowBtn} disabled={!product.inStock}>
              Buy Now
            </button>
          </div>

          {/* Pincode checker */}
          <div className={styles.pincodeBox}>
            <span className={styles.pincodeLabel}>📍 Check Delivery</span>
            <div className={styles.pincodeRow}>
              <input
                type="text"
                maxLength={6}
                className={styles.pincodeInput}
                placeholder="Enter pincode"
                value={pincode}
                onChange={(e) => { setPincode(e.target.value); setPincodeMsg(''); }}
              />
              <button className={styles.pincodeBtn} onClick={checkPincode}>Check</button>
            </div>
            {pincodeMsg && <p className={styles.pincodeResult}>{pincodeMsg}</p>}
          </div>

          {/* Share row */}
          <div className={styles.shareRow}>
            <span className={styles.shareLabel}>Share:</span>
            <button className={styles.shareBtn} aria-label="Share on WhatsApp">💬 WhatsApp</button>
            <button className={styles.shareBtn} aria-label="Copy link">🔗 Copy Link</button>
          </div>
        </div>
      </div>

      {/* ── Tab Section ── */}
      <div className={styles.tabSection}>
        <div className={styles.tabs}>
          {(['details', 'shipping', 'reviews'] as const).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'details' ? '📋 Product Details' : t === 'shipping' ? '🚚 Shipping & Returns' : `⭐ Reviews (${product.reviewCount})`}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'details' && (
            <div className={styles.detailsTab}>
              <div className={styles.longDesc}>
                <h3>About this product</h3>
                <p>{product.longDescription}</p>
              </div>
              <div className={styles.highlightsList}>
                <h3>Key Highlights</h3>
                <ul>
                  {product.highlights.map((h, i) => (
                    <li key={i}><span className={styles.checkIcon}>✦</span>{h}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className={styles.shippingTab}>
              <div className={styles.shippingCard}>
                <h3>🚚 Shipping Policy</h3>
                <ul>
                  <li><strong>Free shipping</strong> on all orders above ₹499</li>
                  <li>Standard delivery: <strong>3–5 business days</strong></li>
                  <li>Express delivery available at checkout: <strong>1–2 days</strong></li>
                  <li>Same-day delivery in Hyderabad, Vijayawada &amp; Guntur</li>
                  <li>Order tracking via SMS and email after dispatch</li>
                </ul>
              </div>
              <div className={styles.shippingCard}>
                <h3>🔄 Return Policy</h3>
                <ul>
                  <li><strong>30-day hassle-free returns</strong> — no questions asked</li>
                  <li>Product must be unused and in original packaging</li>
                  <li>Raise a return request via My Account or WhatsApp</li>
                  <li>Refund processed in <strong>3–5 business days</strong> to original payment</li>
                  <li>Free pickup for all returns across India</li>
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className={styles.reviewsTab}>
              <div className={styles.reviewSummary}>
                <div className={styles.reviewBigScore}>
                  <span className={styles.bigScoreNum}>{product.stars}.0</span>
                  <div className={styles.bigStars}>
                    {stars.map((s, i) => (
                      <span key={i} className={s === '★' ? styles.starFilled : styles.starEmpty}>{s}</span>
                    ))}
                  </div>
                  <span className={styles.bigReviewCount}>{product.reviewCount} reviews</span>
                </div>
                <div className={styles.ratingBars}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <div key={n} className={styles.ratingBarRow}>
                      <span>{n}★</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${n === 5 ? 70 : n === 4 ? 20 : n === 3 ? 7 : n === 2 ? 2 : 1}%` }}
                        />
                      </div>
                      <span>{n === 5 ? '70%' : n === 4 ? '20%' : n === 3 ? '7%' : n === 2 ? '2%' : '1%'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.reviewList}>
                {REVIEWS.map((r, i) => (
                  <div key={i} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <span className={styles.reviewAvatar}>{r.avatar}</span>
                      <div>
                        <div className={styles.reviewName}>{r.name}</div>
                        <div className={styles.reviewMeta}>{r.location} · {r.date}</div>
                      </div>
                      <div className={styles.reviewStars}>
                        {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                      </div>
                    </div>
                    <p className={styles.reviewText}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Related Products ── */}
      <div className={styles.relatedSection}>
        <div className={styles.relatedHeader}>
          <h2 className={styles.relatedTitle}>You might also like</h2>
          <Link href="/toys" className={styles.relatedViewAll}>View All →</Link>
        </div>
        <div className={styles.relatedGrid}>
          {relatedProducts.map((p) => (
            <Link key={p.id} href={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
              <ProductCard product={p} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
