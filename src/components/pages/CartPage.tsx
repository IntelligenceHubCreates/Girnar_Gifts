'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CartPage.module.css';
import { _get, _put, _delete, _post } from '@/shared/fetchwrapper';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CartItem {
  id: number;
  emoji: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  qty: number;
  bgGradient: string;
  badge?: string;
  backendId?: number; // cart item id from backend
}

interface CouponState {
  code: string;
  applied: boolean;
  discount: number;
  message: string;
  error: boolean;
}

/* ─── Emoji / gradient helpers for backend products ─────────────────────── */
const CATEGORY_EMOJI: Record<string, string> = {
  Toys: '🧸', Vehicles: '🚲', 'Soft Toys': '🐻', Games: '🎮',
  Stationery: '✏️', 'Arts & Crafts': '🎨', Books: '📚',
  'Baby & Toddler': '🍼', Outdoor: '🛹', default: '🎁',
};
const GRADIENTS = [
  'linear-gradient(135deg,#FFF3D4,#FFE099)',
  'linear-gradient(135deg,#E1F7F2,#AAEEDD)',
  'linear-gradient(135deg,#EAE0FF,#C7A4F5)',
  'linear-gradient(135deg,#E0F3FF,#AACFF5)',
  'linear-gradient(135deg,#E8FFEE,#AAEECC)',
  'linear-gradient(135deg,#FFEEF8,#F5B6D6)',
];
function gradientFor(id: number) { return GRADIENTS[id % GRADIENTS.length]; }

/* ─── Initial Cart Data (fallback / loading state) ───────────────────────── */
const INITIAL_ITEMS: CartItem[] = [];

const VALID_COUPONS: Record<string, { discount: number; label: string }> = {
  LITTLE10: { discount: 0.1, label: '10% off applied!' },
  LOOT20: { discount: 0.2, label: '20% off applied!' },
  WELCOME50: { discount: 0, label: '₹50 flat off applied!' },
};

const FLAT_COUPONS: Record<string, number> = { WELCOME50: 50 };

const SUGGESTED: CartItem[] = [
  { id: 5, emoji: '🧩', name: 'Jumbo Jigsaw 100pc', category: 'Games', price: 349, originalPrice: 499, qty: 1, bgGradient: 'linear-gradient(135deg,#E0F3FF,#AACFF5)' },
  { id: 8, emoji: '🐻', name: 'Teddy Bear XL', category: 'Soft Toys', price: 799, originalPrice: 1099, qty: 1, bgGradient: 'linear-gradient(135deg,#E8FFEE,#AAEECC)', badge: 'New' },
  { id: 2, emoji: '🎪', name: 'Sudoku Puzzle Set', category: 'Games', price: 549, originalPrice: 749, qty: 1, bgGradient: 'linear-gradient(135deg,#FFE4E1,#FFBDB6)', badge: 'New' },
  { id: 7, emoji: '🛹', name: 'Mini Skateboards', category: 'Outdoor', price: 1199, originalPrice: 1499, qty: 1, bgGradient: 'linear-gradient(135deg,#FFEEF8,#F5B6D6)', badge: 'Hot' },
];

const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 499;

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [coupon, setCoupon] = useState<CouponState>({ code: '', applied: false, discount: 0, message: '', error: false });
  const [couponInput, setCouponInput] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addedSuggestedId, setAddedSuggestedId] = useState<number | null>(null);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─── Load cart from backend ─────────────────────────────────────────── */
  useEffect(() => {
    _get('/api/cart')
      .then((res: any) => {
        const cartItems: CartItem[] = (res?.cart_items || []).map((ci: any, idx: number) => ({
          id: ci.product?.id ?? idx,
          backendId: ci.id,
          name: ci.product?.name ?? 'Product',
          category: ci.product?.category ?? 'General',
          price: (ci.product?.original_price ?? 0) - (ci.product?.amount_discount ?? 0),
          originalPrice: ci.product?.original_price ?? 0,
          qty: ci.quantity ?? 1,
          emoji: CATEGORY_EMOJI[ci.product?.category] ?? CATEGORY_EMOJI.default,
          bgGradient: gradientFor(ci.product?.id ?? idx),
          badge: ci.product?.amount_discount
            ? `-${Math.round((ci.product.amount_discount / ci.product.original_price) * 100)}%`
            : undefined,
        }));
        if (cartItems.length > 0) setItems(cartItems);
      })
      .catch(() => { /* keep empty state, user can still use UI */ })
      .finally(() => setLoading(false));
  }, []);

  /* ─── Calculations ───────────────────────────────────────────────────── */
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const originalTotal = items.reduce((s, i) => s + i.originalPrice * i.qty, 0);
  const itemSavings = originalTotal - subtotal;
  const isDeliveryFree = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = items.length === 0 ? 0 : isDeliveryFree ? 0 : DELIVERY_FEE;

  const flatDiscount = coupon.applied && FLAT_COUPONS[coupon.code] ? FLAT_COUPONS[coupon.code] : 0;
  const percentDiscount = coupon.applied && !FLAT_COUPONS[coupon.code] ? Math.round(subtotal * coupon.discount) : 0;
  const couponSavings = flatDiscount + percentDiscount;

  const total = Math.max(0, subtotal + deliveryCharge - couponSavings);
  const totalSavings = itemSavings + couponSavings + (isDeliveryFree && items.length > 0 ? DELIVERY_FEE : 0);

  /* ─── Handlers ───────────────────────────────────────────────────────── */
  function updateQty(id: number, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, item.qty + delta);
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: newQty } : i));
    // Sync to backend
    if (item.backendId) {
      _put(`/api/cart/items/${item.backendId}`, { quantity: newQty }).catch(() => {
        // Revert on failure
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: item.qty } : i));
      });
    }
  }

  function removeItem(id: number) {
    const item = items.find((i) => i.id === id);
    setRemovingId(id);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setRemovingId(null);
    }, 320);
    // Sync to backend
    if (item?.backendId) {
      _delete(`/api/cart/items/${item.backendId}`).catch(() => {});
    }
  }

  function saveForLater(id: number) {
    const item = items.find((i) => i.id === id);
    if (item) {
      setSavedItems((prev) => [...prev, item]);
      removeItem(id);
    }
  }

  function moveToCart(id: number) {
    const item = savedItems.find((i) => i.id === id);
    if (item) {
      setItems((prev) => [...prev, item]);
      setSavedItems((prev) => prev.filter((i) => i.id !== id));
      // Sync to backend
      _post('/api/cart/items', { product_id: item.id, quantity: item.qty }).catch(() => {});
    }
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCoupon({ code: '', applied: false, discount: 0, message: 'Please enter a coupon code.', error: true });
      return;
    }
    const valid = VALID_COUPONS[code];
    if (valid) {
      setCoupon({ code, applied: true, discount: valid.discount, message: valid.label, error: false });
    } else {
      setCoupon({ code: '', applied: false, discount: 0, message: 'Invalid coupon. Try LITTLE10 or LOOT20.', error: true });
    }
  }

  function removeCoupon() {
    setCoupon({ code: '', applied: false, discount: 0, message: '', error: false });
    setCouponInput('');
  }

  function addSuggested(item: CartItem) {
    setAddedSuggestedId(item.id);
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
    // Sync to backend
    _post('/api/cart/items', { product_id: item.id, quantity: 1 }).catch(() => {});
    setTimeout(() => setAddedSuggestedId(null), 1800);
  }

  const amountToFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;
  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  /* ─── Empty State ────────────────────────────────────────────────────── */
  if (!loading && items.length === 0 && savedItems.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadLink}>Home</Link>
          <span className={styles.breadSep}>›</span>
          <span className={styles.breadCurrent}>My Cart</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyEmoji}>🛒</div>
          <h2 className={styles.emptyTitle}>Your cart is empty!</h2>
          <p className={styles.emptyText}>Looks like you haven't added anything yet. Let's fix that!</p>
          <Link href="/" className={styles.emptyBtn}>Start Shopping →</Link>
        </div>
        <div className={styles.suggestedSection}>
          <h3 className={styles.suggestedTitle}>Popular right now</h3>
          <div className={styles.suggestedGrid}>
            {SUGGESTED.map((s) => (
              <div key={s.id} className={styles.suggestedCard}>
                <Link href={`/product/${s.id}`}>
                  <div className={styles.suggestedImg} style={{ background: s.bgGradient }}>
                    <span>{s.emoji}</span>
                    {s.badge && <span className={styles.suggestedBadge}>{s.badge}</span>}
                  </div>
                </Link>
                <div className={styles.suggestedInfo}>
                  <div className={styles.suggestedCat}>{s.category}</div>
                  <div className={styles.suggestedName}>{s.name}</div>
                  <div className={styles.suggestedPrice}>
                    <span className={styles.suggestedPriceNow}>₹{s.price.toLocaleString('en-IN')}</span>
                    <span className={styles.suggestedPriceWas}>₹{s.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    className={`${styles.suggestedAddBtn} ${addedSuggestedId === s.id ? styles.suggestedAdded : ''}`}
                    onClick={() => addSuggested(s)}
                  >
                    {addedSuggestedId === s.id ? '✓ Added!' : '+ Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main Cart ──────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadLink}>Home</Link>
        <span className={styles.breadSep}>›</span>
        <span className={styles.breadCurrent}>My Cart</span>
      </div>

      {/* Page Title */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Cart</h1>
          <p className={styles.pageSubtitle}>{loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} in your cart`}</p>
        </div>
        <Link href="/" className={styles.continueShopping}>← Continue Shopping</Link>
      </div>

      {/* Free Delivery Progress */}
      {items.length > 0 && (
        <div className={styles.deliveryBanner}>
          {isDeliveryFree ? (
            <span className={styles.deliveryFreeMsg}>🎉 You've unlocked <strong>FREE delivery</strong> on this order!</span>
          ) : (
            <span>
              🚚 Add <strong>₹{amountToFreeDelivery.toLocaleString('en-IN')}</strong> more for{' '}
              <strong>FREE delivery</strong>
            </span>
          )}
          <div className={styles.deliveryTrack}>
            <div className={styles.deliveryFill} style={{ width: `${freeDeliveryProgress}%` }} />
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className={styles.layout}>

        {/* ── Left: Cart Items ── */}
        <div className={styles.cartItems}>

          {/* Step indicator */}
          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.stepActive}`}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepLabel}>Cart</span>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepLabel}>Address</span>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepLabel}>Payment</span>
            </div>
          </div>

          {/* Items list */}
          {items.map((item) => (
            <div
              key={item.id}
              className={`${styles.cartItem} ${removingId === item.id ? styles.cartItemRemoving : ''}`}
            >
              {/* Product image */}
              <Link href={`/product/${item.id}`} className={styles.itemImgLink}>
                <div className={styles.itemImg} style={{ background: item.bgGradient }}>
                  <span className={styles.itemEmoji}>{item.emoji}</span>
                  {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
                </div>
              </Link>

              {/* Product details */}
              <div className={styles.itemDetails}>
                <div className={styles.itemTop}>
                  <div>
                    <div className={styles.itemCategory}>{item.category}</div>
                    <Link href={`/product/${item.id}`} className={styles.itemName}>{item.name}</Link>
                    <div className={styles.itemMeta}>
                      <span className={styles.metaChip}>🛡️ BIS Certified</span>
                      <span className={styles.metaChip}>🔄 30-day return</span>
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                  >✕</button>
                </div>

                <div className={styles.itemBottom}>
                  {/* Price */}
                  <div className={styles.itemPricing}>
                    <span className={styles.itemPrice}>₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                    {item.originalPrice > item.price && (
                      <>
                        <span className={styles.itemOriginalPrice}>₹{(item.originalPrice * item.qty).toLocaleString('en-IN')}</span>
                        <span className={styles.itemSaveChip}>
                          Save ₹{((item.originalPrice - item.price) * item.qty).toLocaleString('en-IN')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Qty + Actions */}
                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQty(item.id, -1)}
                        aria-label="Decrease"
                      >−</button>
                      <span className={styles.qtyNum}>{item.qty}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQty(item.id, 1)}
                        aria-label="Increase"
                      >+</button>
                    </div>
                    <button className={styles.saveBtn} onClick={() => saveForLater(item.id)}>
                      🤍 Save for later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Saved for Later */}
          {savedItems.length > 0 && (
            <div className={styles.savedSection}>
              <h3 className={styles.savedTitle}>Saved for Later ({savedItems.length})</h3>
              <div className={styles.savedGrid}>
                {savedItems.map((item) => (
                  <div key={item.id} className={styles.savedCard}>
                    <div className={styles.savedImg} style={{ background: item.bgGradient }}>
                      <span>{item.emoji}</span>
                    </div>
                    <div className={styles.savedInfo}>
                      <div className={styles.savedName}>{item.name}</div>
                      <div className={styles.savedPrice}>₹{item.price.toLocaleString('en-IN')}</div>
                      <button className={styles.moveToCartBtn} onClick={() => moveToCart(item.id)}>
                        Move to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupon Section */}
          <div className={styles.couponSection}>
            <div className={styles.couponHeader}>
              <span className={styles.couponIcon}>🎟️</span>
              <span className={styles.couponTitle}>Apply Coupon</span>
            </div>
            {coupon.applied ? (
              <div className={styles.couponApplied}>
                <div className={styles.couponAppliedLeft}>
                  <span className={styles.couponCheckmark}>✓</span>
                  <div>
                    <div className={styles.couponAppliedCode}>{coupon.code}</div>
                    <div className={styles.couponAppliedMsg}>{coupon.message}</div>
                  </div>
                </div>
                <button className={styles.removeCouponBtn} onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <div className={styles.couponRow}>
                <input
                  type="text"
                  className={styles.couponInput}
                  placeholder="Enter coupon code (try LITTLE10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button className={styles.couponApplyBtn} onClick={applyCoupon}>Apply</button>
              </div>
            )}
            {coupon.message && !coupon.applied && (
              <p className={`${styles.couponMsg} ${coupon.error ? styles.couponError : styles.couponSuccess}`}>
                {coupon.message}
              </p>
            )}
          </div>

          {/* Trust bar */}
          <div className={styles.trustBar}>
            <div className={styles.trustItem}><span>🔒</span><span>100% Secure<br /><small>SSL encrypted</small></span></div>
            <div className={styles.trustItem}><span>🚚</span><span>Fast Delivery<br /><small>2–5 business days</small></span></div>
            <div className={styles.trustItem}><span>🔄</span><span>Easy Returns<br /><small>30-day policy</small></span></div>
            <div className={styles.trustItem}><span>💳</span><span>All Payments<br /><small>UPI, Card, COD</small></span></div>
          </div>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryLines}>
              <div className={styles.summaryLine}>
                <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className={`${styles.summaryLine} ${styles.savingsLine}`}>
                <span>Product Discount</span>
                <span>− ₹{itemSavings.toLocaleString('en-IN')}</span>
              </div>
              {couponSavings > 0 && (
                <div className={`${styles.summaryLine} ${styles.savingsLine}`}>
                  <span>Coupon ({coupon.code})</span>
                  <span>− ₹{couponSavings.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className={styles.summaryLine}>
                <span>Delivery</span>
                <span className={isDeliveryFree ? styles.freeDeliveryTag : ''}>
                  {isDeliveryFree || items.length === 0 ? 'FREE' : `₹${DELIVERY_FEE}`}
                </span>
              </div>
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span className={styles.totalAmt}>₹{total.toLocaleString('en-IN')}</span>
            </div>

            {totalSavings > 0 && (
              <div className={styles.totalSavingsBadge}>
                🎉 You're saving <strong>₹{totalSavings.toLocaleString('en-IN')}</strong> on this order!
              </div>
            )}

            <a href="/checkout" className={styles.checkoutBtn}>
              Proceed to Checkout →
            </a>

            {/* Payment methods */}
            <div className={styles.paymentMethods}>
              <div className={styles.paymentLabel}>We accept</div>
              <div className={styles.paymentIcons}>
                <span className={styles.payIcon}>💳</span>
                <span className={styles.payIcon}>📱</span>
                <span className={styles.payIcon}>🏦</span>
                <span className={styles.payText}>UPI</span>
                <span className={styles.payText}>COD</span>
              </div>
            </div>
          </div>

          {/* Promo nudge card */}
          {!isDeliveryFree && items.length > 0 && (
            <div className={styles.nudgeCard}>
              <span className={styles.nudgeEmoji}>🚀</span>
              <div>
                <div className={styles.nudgeTitle}>Almost there!</div>
                <div className={styles.nudgeText}>
                  Add ₹{amountToFreeDelivery.toLocaleString('en-IN')} more to get <strong>FREE delivery</strong>
                </div>
              </div>
            </div>
          )}

          {/* Gift message */}
          <div className={styles.giftCard}>
            <div className={styles.giftHeader}>
              <span>🎁</span>
              <span className={styles.giftTitle}>Add a Gift Message</span>
            </div>
            <textarea
              className={styles.giftTextarea}
              placeholder="Write something special for the recipient…"
              rows={3}
            />
            <button className={styles.giftBtn}>Add Message</button>
          </div>
        </div>
      </div>

      {/* ── Suggested Products ── */}
      <div className={styles.suggestedSection}>
        <div className={styles.suggestedHeader}>
          <h3 className={styles.suggestedTitle}>You might also like</h3>
          <Link href="/" className={styles.suggestedViewAll}>View All →</Link>
        </div>
        <div className={styles.suggestedGrid}>
          {SUGGESTED.filter((s) => !items.find((i) => i.id === s.id)).slice(0, 4).map((s) => (
            <div key={s.id} className={styles.suggestedCard}>
              <Link href={`/product/${s.id}`}>
                <div className={styles.suggestedImg} style={{ background: s.bgGradient }}>
                  <span>{s.emoji}</span>
                  {s.badge && <span className={styles.suggestedBadge}>{s.badge}</span>}
                </div>
              </Link>
              <div className={styles.suggestedInfo}>
                <div className={styles.suggestedCat}>{s.category}</div>
                <div className={styles.suggestedName}>{s.name}</div>
                <div className={styles.suggestedPrice}>
                  <span className={styles.suggestedPriceNow}>₹{s.price.toLocaleString('en-IN')}</span>
                  <span className={styles.suggestedPriceWas}>₹{s.originalPrice.toLocaleString('en-IN')}</span>
                </div>
                <button
                  className={`${styles.suggestedAddBtn} ${addedSuggestedId === s.id ? styles.suggestedAdded : ''}`}
                  onClick={() => addSuggested(s)}
                >
                  {addedSuggestedId === s.id ? '✓ Added!' : '+ Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
