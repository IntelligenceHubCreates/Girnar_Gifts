'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { _get, _post } from '@/shared/fetchwrapper';
import { normaliseProduct, unwrapList, fmtINR, PLACEHOLDER } from '@/lib/normalise';
import { useCart } from '@/context/CartContext';
import styles from './HamperBuilderPage.module.css';

// Matches the HAMPER_FEE constant in Backend/app/hampers/routers.py — the
// backend recomputes the authoritative total when the hamper is created;
// this is only a live preview shown while picking items.
const HAMPER_FEE_PREVIEW = 49;

const CATEGORIES = [
  'All',
  'Personalised Gifts',
  'Gift Hampers',
  'Festive & Occasion',
  'Stationery',
  'Bags & Pouches',
  'Bottles',
  'Toys',
];

interface PickProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stockCount: number;
}

export default function HamperBuilderPage() {
  const router = useRouter();
  const { addItem } = useCart();

  const [products, setProducts] = useState<PickProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch]     = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [picks, setPicks]       = useState<Record<string, number>>({});
  const [hamperName, setHamperName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    _get('/api/product/all?limit=100&in_stock=true')
      .then((res) => {
        if (cancelled) return;
        const list = unwrapList(res).map(normaliseProduct).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.images[0] || PLACEHOLDER,
          category: p.category,
          stockCount: p.stockCount,
        }));
        setProducts(list);
      })
      .catch(() => { if (!cancelled) setLoadError('Could not load products. Please refresh.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat !== 'All' && p.category !== activeCat) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, search, activeCat]);

  const pickedList = useMemo(
    () => products.filter((p) => (picks[p.id] ?? 0) > 0),
    [products, picks],
  );

  const subtotal = useMemo(
    () => pickedList.reduce((sum, p) => sum + p.price * (picks[p.id] ?? 0), 0),
    [pickedList, picks],
  );

  const itemCount = useMemo(
    () => pickedList.reduce((sum, p) => sum + (picks[p.id] ?? 0), 0),
    [pickedList, picks],
  );

  const total = pickedList.length > 0 ? subtotal + HAMPER_FEE_PREVIEW : 0;

  const setQty = useCallback((product: PickProduct, qty: number) => {
    const clamped = Math.max(0, Math.min(qty, product.stockCount));
    setPicks((prev) => {
      const next = { ...prev };
      if (clamped <= 0) delete next[product.id];
      else next[product.id] = clamped;
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (pickedList.length === 0) {
      setSubmitError('Add at least one item to your hamper first.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const res: any = await _post('/api/hampers', {
        name: hamperName.trim() || undefined,
        items: pickedList.map((p) => ({ product_id: p.id, quantity: picks[p.id] })),
      });
      const result = await addItem({
        id: res.id,
        name: res.name,
        price: res.price,
        quantity: 1,
        image: res.image || undefined,
        category: 'Personalised Gifts',
        product_count: 1,
        is_available: true,
      });
      if (result.ok) {
        router.push('/cart');
      } else {
        setSubmitError('Could not add the hamper to your cart. Please try again.');
      }
    } catch (err: any) {
      if (err?.status === 401) {
        const cb = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?callbackUrl=${cb}`;
        return;
      }
      setSubmitError(err?.message || err || 'Could not build your hamper. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Build Your Own Hamper</h1>
        <p className={styles.subtitle}>
          Pick the products you want to include — we&rsquo;ll price the hamper for you automatically.
        </p>
      </div>

      <div className={styles.layout}>
        {/* ── Product picker ── */}
        <div className={styles.picker}>
          <div className={styles.filters}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className={styles.catChips}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.chip}${activeCat === c ? ` ${styles.chipActive}` : ''}`}
                  onClick={() => setActiveCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className={styles.status}>Loading products…</p>}
          {loadError && <p className={styles.statusError}>{loadError}</p>}
          {!loading && !loadError && filtered.length === 0 && (
            <p className={styles.status}>No products match your search.</p>
          )}

          <div className={styles.grid}>
            {filtered.map((p) => {
              const qty = picks[p.id] ?? 0;
              return (
                <div key={p.id} className={styles.card}>
                  <div className={styles.cardImgWrap}>
                    <Image src={p.image} alt={p.name} fill sizes="140px" className={styles.cardImg} />
                  </div>
                  <p className={styles.cardName}>{p.name}</p>
                  <p className={styles.cardPrice}>₹{fmtINR(p.price)}</p>
                  {qty === 0 ? (
                    <button type="button" className={styles.addBtn} onClick={() => setQty(p, 1)}>
                      + Add
                    </button>
                  ) : (
                    <div className={styles.stepper}>
                      <button type="button" onClick={() => setQty(p, qty - 1)} aria-label="Decrease quantity">–</button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => setQty(p, qty + 1)} aria-label="Increase quantity">+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Hamper summary ── */}
        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Your Hamper</h2>

          <input
            type="text"
            className={styles.nameInput}
            placeholder="Name your hamper (optional) — e.g. Diwali gift for Mom"
            value={hamperName}
            onChange={(e) => setHamperName(e.target.value)}
            maxLength={80}
          />

          {pickedList.length === 0 ? (
            <p className={styles.emptyState}>Nothing added yet — pick some products to get started.</p>
          ) : (
            <ul className={styles.pickedList}>
              {pickedList.map((p) => (
                <li key={p.id} className={styles.pickedRow}>
                  <div className={styles.pickedImgWrap}>
                    <Image src={p.image} alt={p.name} fill sizes="44px" className={styles.pickedImg} />
                  </div>
                  <div className={styles.pickedInfo}>
                    <span className={styles.pickedName}>{p.name}</span>
                    <span className={styles.pickedMeta}>{picks[p.id]} × ₹{fmtINR(p.price)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setQty(p, 0)}
                    aria-label={`Remove ${p.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
              <span>₹{fmtINR(subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Hamper packaging fee</span>
              <span>₹{fmtINR(HAMPER_FEE_PREVIEW)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.totalRowFinal}`}>
              <span>Total</span>
              <span>₹{fmtINR(total)}</span>
            </div>
          </div>

          {submitError && <p className={styles.statusError}>{submitError}</p>}

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || pickedList.length === 0}
          >
            {submitting ? 'Building your hamper…' : 'Add Hamper to Cart'}
          </button>
        </aside>
      </div>
    </div>
  );
}
