'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { _get } from '@/shared/fetchwrapper';
import type { UiProduct } from '@/types/product';
import styles from './StationerySpotlight.module.css';
import { normaliseProduct, unwrapList, fmtINR as fmt, PLACEHOLDER } from '@/lib/normalise';



const FEATURE_ITEMS = [
  { label: 'Boosts Creativity' },
  { label: 'Improves Focus'    },
  { label: 'Builds Confidence' },
  { label: 'Safe & Non-Toxic'  },
];

// Confetti pieces — shape, color, position, rotation, size
const CONFETTI = [
  // Stars
  { type: 'star',   color: '#F97316', top: '12%',  left: '8%',  size: 18, rotate: 20,  opacity: 0.9 },
  { type: 'star',   color: '#fbbf24', top: '70%',  left: '5%',  size: 13, rotate: -15, opacity: 0.85 },
  { type: 'star',   color: '#F97316', top: '18%',  left: '88%', size: 15, rotate: 35,  opacity: 0.8 },
  { type: 'star',   color: '#fbbf24', top: '78%',  left: '85%', size: 20, rotate: -25, opacity: 0.9 },
  // Circles
  { type: 'circle', color: '#34d399', top: '8%',   left: '20%', size: 10, rotate: 0,   opacity: 0.8 },
  { type: 'circle', color: '#60a5fa', top: '85%',  left: '18%', size: 8,  rotate: 0,   opacity: 0.75 },
  { type: 'circle', color: '#f472b6', top: '10%',  left: '75%', size: 11, rotate: 0,   opacity: 0.8 },
  { type: 'circle', color: '#a78bfa', top: '80%',  left: '78%', size: 9,  rotate: 0,   opacity: 0.75 },
  // Squares / diamonds
  { type: 'square', color: '#f472b6', top: '25%',  left: '4%',  size: 9,  rotate: 45,  opacity: 0.85 },
  { type: 'square', color: '#34d399', top: '60%',  left: '7%',  size: 7,  rotate: 30,  opacity: 0.8 },
  { type: 'square', color: '#60a5fa', top: '22%',  left: '90%', size: 8,  rotate: -40, opacity: 0.85 },
  { type: 'square', color: '#fbbf24', top: '55%',  left: '92%', size: 10, rotate: 20,  opacity: 0.8 },
  // Triangles (via border trick)
  { type: 'tri',    color: '#F97316', top: '48%',  left: '3%',  size: 10, rotate: 10,  opacity: 0.8 },
  { type: 'tri',    color: '#a78bfa', top: '38%',  left: '93%', size: 9,  rotate: -20, opacity: 0.8 },
  // Squiggles / lines
  { type: 'line',   color: '#34d399', top: '35%',  left: '6%',  size: 16, rotate: 55,  opacity: 0.7 },
  { type: 'line',   color: '#f472b6', top: '52%',  left: '91%', size: 14, rotate: -50, opacity: 0.7 },
  // Extra scattered dots
  { type: 'circle', color: '#F97316', top: '42%',  left: '2%',  size: 6,  rotate: 0,   opacity: 0.65 },
  { type: 'circle', color: '#fbbf24', top: '30%',  left: '95%', size: 7,  rotate: 0,   opacity: 0.65 },
  { type: 'star',   color: '#60a5fa', top: '62%',  left: '93%', size: 12, rotate: 15,  opacity: 0.75 },
  { type: 'square', color: '#a78bfa', top: '15%',  left: '14%', size: 7,  rotate: 60,  opacity: 0.7  },
];

function ConfettiPiece({ piece }: { piece: typeof CONFETTI[0] }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    top:      piece.top,
    left:     piece.left,
    opacity:  piece.opacity,
    transform: `rotate(${piece.rotate}deg)`,
    pointerEvents: 'none',
    zIndex: 6,
  };

  if (piece.type === 'star') {
    return (
      <svg
        style={{ ...base, width: piece.size, height: piece.size }}
        viewBox="0 0 20 20"
        fill={piece.color}
      >
        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z"/>
      </svg>
    );
  }
  if (piece.type === 'circle') {
    return (
      <div style={{
        ...base,
        width: piece.size, height: piece.size,
        borderRadius: '50%',
        background: piece.color,
      }} />
    );
  }
  if (piece.type === 'square') {
    return (
      <div style={{
        ...base,
        width: piece.size, height: piece.size,
        background: piece.color,
        borderRadius: 2,
      }} />
    );
  }
  if (piece.type === 'tri') {
    return (
      <div style={{
        ...base,
        width: 0, height: 0,
        borderLeft:   `${piece.size * 0.6}px solid transparent`,
        borderRight:  `${piece.size * 0.6}px solid transparent`,
        borderBottom: `${piece.size}px solid ${piece.color}`,
        background: 'transparent',
      }} />
    );
  }
  if (piece.type === 'line') {
    return (
      <div style={{
        ...base,
        width: piece.size, height: 3,
        borderRadius: 2,
        background: piece.color,
      }} />
    );
  }
  return null;
}



function ProductImg({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const validSrc = !errored && src && (src.startsWith('http') || src.startsWith('/')) ? src : null;
  return (
    <Image
      src={validSrc ?? PLACEHOLDER}
      alt={alt}
      width={52}
      height={52}
      style={{ objectFit: 'contain', display: 'block' }}
      onError={() => setErrored(true)}
    />
  );
}

function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonText}>
        <div className={styles.skeletonName} />
        <div className={styles.skeletonPrice} />
      </div>
    </div>
  );
}

export default function StationerySpotlight() {
  const [products,   setProducts]   = useState<UiProduct[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(false);

useEffect(() => {
  setLoading(true); setFetchError(false);
  _get('/api/product/all?category_slug=stationery&limit=5&skip=0')
    .then((res) => {
      setProducts(unwrapList(res).map(normaliseProduct).slice(0, 5));
      // empty = valid, not an error
    })
    .catch(() => setFetchError(true))
    .finally(() => setLoading(false));
}, []);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        {/* ══ LEFT ══ */}
        <div className={styles.left}>
          <p className={styles.tag}>Educational Collection</p>
          <h2 className={styles.heading}>
            Tools That Inspire<br />
            Curiosity &amp; Creativity
          </h2>
          <p className={styles.body}>
            Our toys and learning tools are designed by experts
            to support your child's brain development and
            spark imagination.
          </p>
          <div className={styles.features}>
            {FEATURE_ITEMS.map((f) => (
              <div key={f.label} className={styles.featureItem}>
                <span className={styles.featureIcon} aria-hidden="true">✓</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
          <Link href="/stationery" className={styles.cta}>
            Explore Collection &nbsp;→
          </Link>
        </div>

        {/* ══ CENTER — hero + confetti ══ */}
        <div className={styles.center}>
          {/* Confetti layer */}
          {CONFETTI.map((piece, i) => (
            <ConfettiPiece key={i} piece={piece} />
          ))}
          <img
            src="/girl.png"
            alt="Child playing with educational toys"
            className={styles.heroImg}
            width={420}   /* set to actual intrinsic ratio of girl.png */
            height={480}
            loading="lazy"
          />
        </div>

        {/* ══ RIGHT — 5 products ══ */}
        <div className={styles.right}>
          <p className={styles.panelTitle}>Top Picks for Little Learners</p>

          <div className={styles.list}>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
            ) : fetchError ? (
              <p className={styles.errorMsg}>Could not load products.</p>
            ) : (
              products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className={styles.listItem}>
                  <div className={styles.listImg}>
                    {p.images.length > 0
                      ? <ProductImg src={p.images[0]} alt={p.name} />
                      : <span className={styles.listEmoji}>{p.emoji || '📦'}</span>
                    }
                  </div>
                  <div className={styles.listText}>
                    <p className={styles.listName}>{p.name}</p>
                    <div className={styles.listPriceRow}>
                      <span className={styles.listPrice}>₹{fmt(p.price)}</span>
                      {p.originalPrice > p.price && (
                        <span className={styles.listMrp}>₹{fmt(p.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {!loading && !fetchError && (
            <Link href="/stationery" className={styles.viewAll}>View all</Link>
          )}
        </div>

      </div>
    </section>
  );
}