'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import styles from './GirnarHeroSection.module.css';
import { brand } from '@/config/brand';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { _get } from '@/shared/fetchwrapper';
import { normaliseProduct, unwrapList, fmtINR } from '@/lib/normalise';
import { useCart } from '@/context/CartContext';
import type { UiProduct } from '@/types/product';

/* ── entrance helpers (transform + opacity only) ──────────────────────── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 18 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } as Transition,
});

const AUTO_MS = 4200;
const CARD_TINTS = ['var(--gg-blush)', 'var(--gg-petal)', 'var(--gg-blush-deep)'];

/**
 * Flat illustrated hamper glyph — shown whenever a product has no uploaded
 * photo yet, so the showcase always has something honest to display rather
 * than a broken image (see DESIGN_SYSTEM.md - Hero showcase). Three palette
 * variants so a run of un-photographed products still reads as "different
 * items" rather than one glyph repeated.
 */
function HamperGlyph({ variant = 0 }: { variant?: 0 | 1 | 2 }) {
  const palettes = [
    { basket: 'var(--gg-wine)', ribbon: 'var(--gg-rose)', dot: 'var(--gg-petal)' },
    { basket: 'var(--gg-rose)', ribbon: 'var(--gg-petal)', dot: 'var(--gg-blush)' },
    { basket: 'var(--gg-blush-deep)', ribbon: 'var(--gg-wine)', dot: 'var(--gg-rose)' },
  ] as const;
  const p = palettes[variant];
  return (
    <svg viewBox="0 0 200 200" className={styles.glyph} aria-hidden="true">
      <rect x="38" y="90" width="124" height="86" rx="14" fill={p.basket} />
      <rect x="38" y="90" width="124" height="16" fill="rgba(0,0,0,0.08)" />
      <circle cx="70" cy="86" r="16" fill={p.dot} />
      <circle cx="100" cy="80" r="18" fill={p.dot} opacity="0.85" />
      <circle cx="132" cy="86" r="16" fill={p.dot} opacity="0.7" />
      <rect x="88" y="40" width="24" height="90" fill={p.ribbon} />
      <path d="M100 44 C78 22 54 30 64 52 C71 68 92 62 100 44 Z" fill={p.ribbon} />
      <path d="M100 44 C122 22 146 30 136 52 C129 68 108 62 100 44 Z" fill={p.ribbon} />
      <circle cx="100" cy="46" r="8" fill={p.basket} />
    </svg>
  );
}

function ShowcaseImg({ product, variant }: { product: UiProduct | undefined; variant: number }) {
  if (product?.images?.[0]) {
    return (
      <Image
        src={product.images[0]}
        alt={product.name}
        fill
        sizes="(max-width: 1024px) 60vw, 420px"
        className={styles.stageImg}
        priority
      />
    );
  }
  return <HamperGlyph variant={(variant % 3) as 0 | 1 | 2} />;
}

export default function GirnarHeroSection() {
  const reduceMotion = usePrefersReducedMotion();
  const { addItem } = useCart();

  const [products, setProducts] = useState<UiProduct[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [cartStates, setCartStates] = useState<Record<string, 'idle' | 'loading' | 'added' | 'error'>>({});
  const hoverRef = useRef(false);

  useEffect(() => {
    _get('/api/product/all?limit=4&in_stock=true')
      .then((res) => setProducts(unwrapList(res).map(normaliseProduct)))
      .catch(() => setProducts([]));
  }, []);

  // Auto-advance the showcase; pauses on hover/focus, stops entirely under
  // reduced motion (index only changes via explicit card clicks then).
  useEffect(() => {
    if (reduceMotion || products.length < 2) return;
    const id = setInterval(() => {
      if (!hoverRef.current) setActiveIdx((i) => (i + 1) % products.length);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [products.length, reduceMotion]);

  const handleAddToCart = useCallback(
    async (p: UiProduct) => {
      if (cartStates[p.id] === 'loading') return;
      setCartStates((s) => ({ ...s, [p.id]: 'loading' }));
      const res = await addItem({
        id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
        image: p.images[0], category: p.category,
      });
      setCartStates((s) => ({ ...s, [p.id]: res.ok ? 'added' : 'error' }));
      if (res.ok) setTimeout(() => setCartStates((s) => ({ ...s, [p.id]: 'idle' })), 1800);
    },
    [addItem, cartStates],
  );

  const cards = products.slice(0, 3);
  const active = products[activeIdx];

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <motion.p className={styles.eyebrow} {...up(0)}>
            {brand.name} &middot; The art of gifting
          </motion.p>

          <motion.h1 className={styles.headline} {...up(0.08)}>
            Gifts worth
            <br />
            <span className={styles.headlineAccent}>unwrapping.</span>
          </motion.h1>

          <motion.p className={styles.subhead} {...up(0.16)}>
            {brand.description}
          </motion.p>

          <motion.div className={styles.ctaRow} {...up(0.24)}>
            <Link href="/products" className={styles.btnPrimary}>
              Shop the collection
            </Link>
            <Link href="/products" className={styles.btnSecondary}>
              Explore by occasion <span aria-hidden="true">&rarr;</span>
            </Link>
          </motion.div>

          {cards.length > 0 && (
            <motion.div className={styles.cardsRow} {...up(0.32)}>
              {cards.map((p, i) => {
                const state = cartStates[p.id] ?? 'idle';
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.miniCard} ${i === activeIdx ? styles.miniCardActive : ''}`}
                    style={{ background: CARD_TINTS[i % CARD_TINTS.length] }}
                    onClick={() => setActiveIdx(i)}
                    onMouseEnter={() => { hoverRef.current = true; }}
                    onMouseLeave={() => { hoverRef.current = false; }}
                    aria-pressed={i === activeIdx}
                    aria-label={`Show ${p.name} in the showcase`}
                  >
                    <div className={styles.miniCardImgWrap}>
                      <ShowcaseImg product={p} variant={i} />
                    </div>
                    <p className={styles.miniCardName}>{p.name}</p>
                    <p className={styles.miniCardPrice}>{fmtINR(p.price)}</p>
                    <span
                      className={styles.miniCardBtn}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); handleAddToCart(p); }
                      }}
                    >
                      {state === 'loading' ? 'Adding…' : state === 'added' ? 'Added ✓' : state === 'error' ? 'Try again' : 'Add to Cart'}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        <div
          className={styles.visual}
          onMouseEnter={() => { hoverRef.current = true; }}
          onMouseLeave={() => { hoverRef.current = false; }}
        >
          <div className={styles.blobA} aria-hidden="true" />
          <div className={styles.blobB} aria-hidden="true" />
          <p className={styles.watermark} aria-hidden="true">Choose your gift</p>

          <div className={styles.stage}>
            <div className={styles.stageTilt}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active?.id ?? 'placeholder'}
                  className={styles.stageImgWrap}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: -140, scale: 0.86 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotateY: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: 140, scale: 0.86 }}
                  transition={{ duration: reduceMotion ? 0.25 : 0.85, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ShowcaseImg product={active} variant={activeIdx} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
