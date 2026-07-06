'use client';

import Link from 'next/link';
import { motion, Transition } from 'framer-motion';
import styles from './GirnarHeroSection.module.css';
import { brand } from '@/config/brand';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/* ── entrance helpers (transform + opacity only) ──────────────────────── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 18 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } as Transition,
});

const TRUST = [
  { label: 'Complimentary gift wrapping' },
  { label: 'Pan-India delivery' },
  { label: 'Secure payments' },
];

/**
 * The signature moment: an orchestrated "gift reveal" - the one bold,
 * memorable beat the rest of the site stays quiet around (see
 * DESIGN_SYSTEM.md - Signature Moment). Runs once on mount, transform/
 * opacity only, and degrades to a static "already open" illustration
 * under prefers-reduced-motion.
 */
function GiftReveal() {
  const reduceMotion = usePrefersReducedMotion();

  const lid = reduceMotion
    ? { initial: { opacity: 1, y: 0, rotate: -8 }, animate: { opacity: 1, y: 0, rotate: -8 } }
    : {
        initial: { opacity: 1, y: 0, rotate: 0 },
        animate: { opacity: 1, y: -46, rotate: -8 },
        transition: { duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] } as Transition,
      };

  const glow = reduceMotion
    ? { initial: { opacity: 0.5, scale: 1 }, animate: { opacity: 0.5, scale: 1 } }
    : {
        initial: { opacity: 0, scale: 0.4 },
        animate: { opacity: 0.55, scale: 1 },
        transition: { duration: 1.1, delay: 0.9, ease: [0.16, 1, 0.3, 1] } as Transition,
      };

  const petal = (delay: number, x: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 0 } }
      : {
          initial: { opacity: 0, y: 0, x },
          animate: { opacity: [0, 1, 0], y: -120 },
          transition: { duration: 2.6, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.4 } as Transition,
        };

  const box = {
    initial: { opacity: 0, scale: 0.9, y: 16 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } as Transition,
  };

  return (
    <div className={styles.reveal} aria-hidden="true">
      <div className={styles.revealBand} />
      <motion.svg
        viewBox="0 0 360 320"
        className={styles.svg}
        initial={box.initial}
        animate={box.animate}
        transition={box.transition}
      >
        {/* ambient signature-gradient glow, revealed once the lid lifts */}
        <motion.circle
          cx="180" cy="170" r="120"
          fill="url(#gg-glow)"
          initial={glow.initial}
          animate={glow.animate}
          transition={'transition' in glow ? glow.transition : undefined}
        />

        {/* drifting petals - purely decorative, skipped under reduced motion */}
        <motion.circle cx="120" cy="230" r="5" fill="var(--gg-petal)" initial={petal(1.6, -6).initial} animate={petal(1.6, -6).animate} transition={'transition' in petal(1.6, -6) ? petal(1.6, -6).transition : undefined} />
        <motion.circle cx="230" cy="240" r="4" fill="var(--gg-rose)" initial={petal(2.1, 8).initial} animate={petal(2.1, 8).animate} transition={'transition' in petal(2.1, 8) ? petal(2.1, 8).transition : undefined} />

        {/* box base */}
        <rect x="90" y="170" width="180" height="120" rx="10" fill="var(--gg-wine)" />
        <rect x="90" y="170" width="180" height="18" fill="var(--gg-wine-dark)" opacity="0.5" />
        {/* vertical ribbon on base */}
        <rect x="164" y="170" width="32" height="120" fill="var(--gg-blush)" />

        {/* lid + bow - lifts open on mount */}
        <motion.g initial={lid.initial} animate={lid.animate} transition={'transition' in lid ? lid.transition : undefined} style={{ transformOrigin: '180px 170px' }}>
          <rect x="78" y="140" width="204" height="34" rx="8" fill="var(--gg-rose)" />
          <rect x="152" y="140" width="56" height="34" fill="var(--gg-blush)" />
          {/* bow */}
          <path d="M180 140 C150 110 130 118 138 138 C144 152 168 148 180 140 Z" fill="var(--gg-rose-dark)" />
          <path d="M180 140 C210 110 230 118 222 138 C216 152 192 148 180 140 Z" fill="var(--gg-rose-dark)" />
          <circle cx="180" cy="138" r="9" fill="var(--gg-wine)" />
        </motion.g>

        <defs>
          <radialGradient id="gg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--gg-petal)" />
            <stop offset="100%" stopColor="var(--gg-rose)" stopOpacity="0" />
          </radialGradient>
        </defs>
      </motion.svg>
    </div>
  );
}

export default function GirnarHeroSection() {
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

          <motion.ul className={styles.trustRow} {...up(0.32)}>
            {TRUST.map((t) => (
              <li key={t.label} className={styles.trustItem}>
                <span className={styles.trustDot} aria-hidden="true" />
                {t.label}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className={styles.visual}>
          <GiftReveal />
        </div>
      </div>
    </section>
  );
}
