'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { motion, Transition } from 'framer-motion';
import styles from './HeroSection.module.css';

/* ── typed animation helpers ─────────────────────────────── */
const up = (delay = 0) => ({
  initial:    { opacity: 0, y: 22 } as const,
  animate:    { opacity: 1, y: 0  } as const,
  transition: { duration: 0.55, delay, ease: 'easeOut' } as Transition,
});

const fi = (delay = 0) => ({
  initial:    { opacity: 0 } as const,
  animate:    { opacity: 1 } as const,
  transition: { duration: 0.5, delay, ease: 'easeOut' } as Transition,
});

/* ── data types ───────────────────────────────────────────── */
interface Floater {
  id: string;
  emoji: string;
  cls: string;
  initial: Parameters<typeof motion.div>[0]['initial'];
  animate: Parameters<typeof motion.div>[0]['animate'];
  transition: Transition;
}

interface Stat {
  ico: string;
  num: string;
  lbl: string;
  star?: boolean;
  bg: string;
}

interface TrustItem {
  ico: string;
  bg: string;
  title: string;
  sub: string;
}

/* ── 3D floating toy objects ──────────────────────────────── */
const FLOATERS: Floater[] = [
  {
    id: 'toy-car',
    emoji: '🚗',
    cls: styles.floatToy1,
    initial: { opacity: 0, scale: 0.3, rotateY: -60, y: 40 },
    animate: { opacity: 1, scale: 1,   rotateY: 0,   y: 0  },
    transition: { delay: 0.7, duration: 0.7, type: 'spring', stiffness: 180 },
  },
  {
    id: 'lunchbox',
    emoji: '🧺',
    cls: styles.floatToy2,
    initial: { opacity: 0, scale: 0.3, rotateY: 60,  y: 30 },
    animate: { opacity: 1, scale: 1,   rotateY: 0,   y: 0  },
    transition: { delay: 0.9, duration: 0.7, type: 'spring', stiffness: 180 },
  },
  {
    id: 'blocks',
    emoji: '🧩',
    cls: styles.floatToy3,
    initial: { opacity: 0, scale: 0.3, rotateX: 60,  y: 20 },
    animate: { opacity: 1, scale: 1,   rotateX: 0,   y: 0  },
    transition: { delay: 1.0, duration: 0.7, type: 'spring', stiffness: 180 },
  },
  {
    id: 'rocket',
    emoji: '🚀',
    cls: styles.floatToy4,
    initial: { opacity: 0, scale: 0.2, rotate: -20, y: 50 },
    animate: { opacity: 1, scale: 1,   rotate: 12,  y: 0  },
    transition: { delay: 1.1, duration: 0.65, type: 'spring', stiffness: 160 },
  },
  {
    id: 'lunchbox2',
    emoji: '🍱',
    cls: styles.floatToy5,
    initial: { opacity: 0, scale: 0.3, rotateY: -45, y: 30 },
    animate: { opacity: 1, scale: 1,   rotateY: 0,   y: 0  },
    transition: { delay: 1.2, duration: 0.7, type: 'spring', stiffness: 180 },
  },
];

const STATS = [
  {
    num: '4.9/5 Rating',
    lbl: 'From 8,000+ reviews',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M12 2.6l2.8 5.67 6.26.91-4.53 4.41 1.07 6.24L12 16.92l-5.6 2.94 1.07-6.24L2.94 9.18l6.26-.91L12 2.6z"/>
      </svg>
    ),
    bg: styles.statGold,
  },

  {
    num: 'BIS Certified',
    lbl: 'Safe & Child-friendly',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4L21 20H3L12 4Z"/>
        <circle cx="12" cy="15" r="1.2" fill="currentColor"/>
      </svg>
    ),
    bg: styles.statGreen,
  },

  {
    num: 'Easy Returns',
    lbl: '7 Days return policy',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 12a8 8 0 1 1-2.35-5.65"/>
        <path d="M20 4v6h-6"/>
      </svg>
    ),
    bg: styles.statOrange,
  },
];

const TRUST = [
  {
    bg: styles.tPeach,
    num: '50,000+',
    title: 'Happy Parents',
    sub: '👩🏻 👨🏽 👩🏼 👨🏾 and more...',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="3"/>
        <circle cx="16" cy="10" r="3"/>
        <path d="M3.5 18c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
        <path d="M13 18c.2-2.1 1.9-3.8 4-3.8 2.2 0 4 1.8 4 4"/>
      </svg>
    ),
  },

  {
    bg: styles.tMint,
    num: '150,000+',
    title: 'Products Delivered',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2 3 7l9 5 9-5-9-5Zm-7 7v8l7 4v-8L5 9Zm14 0-7 4v8l7-4V9Z"/>
      </svg>
    ),
  },

  {
    bg: styles.tLavender,
    num: '4.9/5',
    title: 'Average Rating',
    stars: true,
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <circle cx="12" cy="12" r="9"/>
        <path
          d="M12 7.5l1.4 2.8 3.1.45-2.25 2.2.53 3.05L12 14.7l-2.78 1.46.53-3.05-2.25-2.2 3.1-.45L12 7.5Z"
          fill="#fff"
        />
      </svg>
    ),
  },

  {
    bg: styles.tBlue,
    num: '300+',
    title: 'Educational Products',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 4 2 9l10 5 8-4v5h2V9L12 4Zm-6 8v4c0 1.8 3 4 6 4s6-2.2 6-4v-4l-6 3-6-3Z"/>
      </svg>
    ),
  },
];

/* ── component ────────────────────────────────────────────── */
export default function HeroSection() {
  const router = useRouter();

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.blob} aria-hidden="true" />

        {/* LEFT */}
        <div className={styles.leftCol}>
          <motion.div className={styles.badge} {...up(0)}>
            ✨ Trusted by 50,000+ parents for safe, educational fun! ✨
          </motion.div>

          <motion.h1 className={styles.heading} {...up(0.06)}>
            Learning<br />
            Through<span className={styles.dot}>  Play.</span>
          </motion.h1>

          <motion.p className={styles.para} {...up(0.12)}>
            Discover thoughtfully curated toys, school essentials, and creative tools that help children learn, explore, and grow.
            Safe, certified, and delivered to your doorstep with love.
          </motion.p>

          <motion.div className={styles.ctaRow} {...up(0.18)}>
            <motion.button
              className={styles.btnPrimary}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/products')}
            >
              Shop Now
              <span className={styles.btnArrow}>→</span>
            </motion.button>

            <motion.button
              className={styles.btnSecondary}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/categories')}
            >
              <span className={styles.btnGridIcon}>⊞</span>
              Explore Categories
            </motion.button>
          </motion.div>

<motion.div className={styles.stats} {...up(0.24)}>
  {STATS.map((s, i) => (
    <React.Fragment key={s.num}>
      {i > 0 && <div className={styles.statDivider} />}

      <div className={styles.statCard}>
        <div className={`${styles.statIconWrap} ${s.bg}`}>
          <div className={styles.statIcon}>
            {s.icon}
          </div>
        </div>

        <div className={styles.statText}>
          <div className={styles.statTitle}>{s.num}</div>
          <div className={styles.statSubtitle}>{s.lbl}</div>
        </div>
      </div>
    </React.Fragment>
  ))}
</motion.div>
        </div>

        {/* RIGHT — boy image, full-height covering the blob */}
        <div className={styles.rightCol}>
            {/* Background Decorations */}
  <div className={styles.heroDecor}>
    <div className={styles.paperPlane}>
      <svg viewBox="0 0 80 60">
        <path
          d="M4 30L76 4L48 56L36 36L4 30Z"
          fill="#BFD1FF"
        />
        <path
          d="M36 36L76 4"
          stroke="#8EA9F8"
          strokeWidth="2"
        />
      </svg>
    </div>

    <svg
      className={styles.flightPath}
      viewBox="0 0 120 120"
      fill="none"
    >
      <path
        d="M100 10C40 20 50 90 10 110"
        stroke="#B9B9B9"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
    </svg>

    <div className={styles.star}>⭐</div>

    <span className={`${styles.dot} ${styles.dot1}`} />
    <span className={`${styles.dot} ${styles.dot2}`} />
    <span className={`${styles.dot} ${styles.dot3}`} />
    <span className={`${styles.dot} ${styles.dot4}`} />
    <span className={`${styles.dot} ${styles.dot5}`} />

    <div className={styles.blobShape1} />
    <div className={styles.blobShape2} />
  </div>
          <motion.div
            className={styles.charWrap}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            transition={{ duration: 0.72, delay: 0.08, ease: 'easeOut' } as Transition}
          >
            <img
              src="/boy.png"
              alt="Little Loot mascot"
              draggable={false}
              className={styles.charImg}
            />
          </motion.div>
        </div>
      </section>

      {/* TRUST BAR */}
<motion.div className={styles.trustBarWrapper} {...fi(0.5)}>
  <div className={styles.trustBar}>
    {TRUST.map((item, i) => (
      <React.Fragment key={item.num}>
        <div className={styles.trustCard}>
          <div className={`${styles.trustIcon} ${item.bg}`}>
            {item.icon}
          </div>

          <div className={styles.trustContent}>
            <div className={styles.trustNum}>
              {item.num}
            </div>

            <div className={styles.trustTitle}>
              {item.title}
            </div>

            {item.sub && (
              <div className={styles.trustSub}>
                {item.sub}
              </div>
            )}

            {item.stars && (
              <div className={styles.trustStars}>
                ★★★★★
              </div>
            )}
          </div>
        </div>

        {i < TRUST.length - 1 && (
          <div className={styles.trustDivider} />
        )}
      </React.Fragment>
    ))}
  </div>
</motion.div>
    </div>
  );
}