'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, Transition } from 'framer-motion';
import styles from './GirnarHeroSection.module.css';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { _get } from '@/shared/fetchwrapper';
import { normaliseProduct, unwrapList, fmtINR } from '@/lib/normalise';
import { useCart } from '@/context/CartContext';
import { brand } from '@/config/brand';
import type { UiProduct } from '@/types/product';

/* ── entrance helpers (transform + opacity only) ──────────────────────── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 18 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } as Transition,
});

const CARD_TINTS = ['var(--gg-blush)', 'var(--gg-rose-tint)', 'var(--gg-muted-fill)'];

/**
 * Flat illustrated gift-hamper cutout — stands in for the "signature Girnar
 * gift" hero photo and for any mini-card product without an uploaded photo.
 * No real cutout photography exists yet (see MANUAL_STEPS.md), so this is an
 * honest vector placeholder rather than a stand-in claiming to be final
 * photography. Three palette variants so a run of un-photographed products
 * still reads as "different items."
 */
function HamperGlyph({ variant = 0, className }: { variant?: 0 | 1 | 2; className?: string }) {
  const palettes = [
    { basket: 'var(--gg-wine)', ribbon: 'var(--gg-rose)', dot: 'var(--gg-petal)' },
    { basket: 'var(--gg-rose)', ribbon: 'var(--gg-petal)', dot: 'var(--gg-blush)' },
    { basket: 'var(--gg-blush-deep)', ribbon: 'var(--gg-wine)', dot: 'var(--gg-rose)' },
  ] as const;
  const p = palettes[variant];
  return (
    <svg viewBox="0 0 200 200" className={className ?? styles.glyph} aria-hidden="true">
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

interface MiniCardProps {
  product: UiProduct;
  tint: string;
  variant: number;
  cartState: 'idle' | 'loading' | 'added' | 'error';
  onAddToCart: () => void;
}

function MiniCard({ product, tint, variant, cartState, onAddToCart }: MiniCardProps) {
  return (
    <div className={styles.miniCard} style={{ background: tint }}>
      <div className={styles.miniCardImgWrap}>
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="90px"
            className={styles.miniCardImg}
          />
        ) : (
          <HamperGlyph variant={(variant % 3) as 0 | 1 | 2} className={styles.miniCardGlyph} />
        )}
      </div>
      <p className={styles.miniCardName}>{product.name}</p>
      <p className={styles.miniCardPrice}>{fmtINR(product.price)}</p>
      <button
        type="button"
        className={styles.miniCardBtn}
        onClick={onAddToCart}
        disabled={cartState === 'loading'}
      >
        {cartState === 'loading' ? 'Adding…' : cartState === 'added' ? 'Added ✓' : cartState === 'error' ? 'Try again' : 'Add to Cart'}
      </button>
    </div>
  );
}

export default function GirnarHeroSection() {
  const reduceMotion = usePrefersReducedMotion();
  const { addItem } = useCart();

  const [products, setProducts] = useState<UiProduct[]>([]);
  const [cartStates, setCartStates] = useState<Record<string, 'idle' | 'loading' | 'added' | 'error'>>({});

  // Cursor-follow parallax on the hero image — desktop pointer only,
  // disabled entirely under reduced motion. Spring-smoothed so it reads as
  // a gentle drift, not a snap.
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 120, damping: 20, mass: 0.4 });
  const springY = useSpring(mvY, { stiffness: 120, damping: 20, mass: 0.4 });
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    _get('/api/product/all?limit=3&in_stock=true')
      .then((res) => setProducts(unwrapList(res).map(normaliseProduct)))
      .catch(() => setProducts([]));
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduceMotion || e.pointerType !== 'mouse') return;
      const rect = visualRef.current?.getBoundingClientRect();
      if (!rect) return;
      mvX.set(((e.clientX - rect.left) / rect.width - 0.5) * 24);
      mvY.set(((e.clientY - rect.top) / rect.height - 0.5) * 24);
    },
    [reduceMotion, mvX, mvY],
  );

  const handlePointerLeave = useCallback(() => {
    mvX.set(0);
    mvY.set(0);
  }, [mvX, mvY]);

  const handleAddToCart = useCallback(
    async (p: UiProduct) => {
      if (cartStates[p.id] === 'loading') return;
      setCartStates((s) => ({ ...s, [p.id]: 'loading' }));
      const res = await addItem({
        id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
        image: p.images[0], category: p.category,
        product_count: p.stockCount, is_available: p.inStock,
      });
      setCartStates((s) => ({ ...s, [p.id]: res.ok ? 'added' : 'error' }));
      if (res.ok) setTimeout(() => setCartStates((s) => ({ ...s, [p.id]: 'idle' })), 1800);
    },
    [addItem, cartStates],
  );

  // The hero visual is a fixed lifestyle photo (not a per-product image),
  // so all fetched products are free to use as the three mini cards below
  // the CTAs.
  const miniProducts = products.slice(0, 3);

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <motion.h1 className={styles.headline} {...up(0)}>
            The Art of
            <br />
            Thoughtful Gifting
          </motion.h1>

          <motion.p className={styles.subhead} {...up(0.1)}>
            Curated hampers, personalised keepsakes, and festive collections — thoughtfully
            wrapped and delivered across India. Find something they&rsquo;ll remember.
          </motion.p>

          <motion.div className={styles.ctaRow} {...up(0.2)}>
            <Link href="/products" className={styles.btnPrimary}>
              Shop Gifts
            </Link>
            <Link href="/products" className={styles.btnSecondary}>
              Explore Collections
            </Link>
          </motion.div>

          {miniProducts.length > 0 && (
            <motion.div className={styles.cardsRow} {...up(0.3)}>
              {miniProducts.map((p, i) => (
                <MiniCard
                  key={p.id}
                  product={p}
                  tint={CARD_TINTS[i % CARD_TINTS.length]}
                  variant={i}
                  cartState={cartStates[p.id] ?? 'idle'}
                  onAddToCart={() => handleAddToCart(p)}
                />
              ))}
            </motion.div>
          )}
        </div>

        <div
          ref={visualRef}
          className={styles.visual}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <motion.div
            className={styles.blob}
            aria-hidden="true"
            animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className={styles.circle} aria-hidden="true" />
          <div className={styles.decorBleed} aria-hidden="true" />

          <motion.p
            className={styles.script}
            aria-hidden="true"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={reduceMotion ? undefined : {
              opacity: 1,
              rotate: [-6, -4.5, -6],
            }}
            transition={reduceMotion ? undefined : {
              opacity: { duration: 0.8, delay: 0.5 },
              rotate: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            }}
          >
            wrapped with love
          </motion.p>

          <motion.div
            className={styles.stage}
            style={reduceMotion ? undefined : { x: springX, y: springY }}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className={styles.stageFloat}
              animate={reduceMotion ? undefined : { rotateY: [-18, -12, -18], rotateX: [5, 8, 5] }}
              transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Image
                src={brand.assets.heroImage}
                alt="Kids joyfully showing off their Girnar Gifts hampers"
                width={1024}
                height={1536}
                draggable={false}
                className={styles.stageImg}
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
