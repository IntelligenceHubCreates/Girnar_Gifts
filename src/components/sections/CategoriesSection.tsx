'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';
import { brand } from '@/config/brand';
import styles from './CategoriesSection.module.css';

interface Category {
  image?: string;
  emoji?: string;
  name: string;
  bg: string;
  href: string;
}

// Girnar's real seeded gift categories (see MANUAL_STEPS.md). Each tile is a
// full-bleed curated lifestyle photo; categories without one yet (Toys) fall
// back to a tinted glyph tile until real photography exists for them.
const catHref = (name: string) => `/products?category=${encodeURIComponent(name)}`;
const cImg = brand.assets.categoryImages;

const CATEGORIES: Category[] = [
  { image: cImg.personalised, name: 'Personalised Gifts', bg: 'linear-gradient(160deg, var(--gg-blush) 0%, var(--gg-blush-deep) 100%)', href: catHref('Personalised Gifts') },
  { image: cImg.hampers,      name: 'Gift Hampers',       bg: 'linear-gradient(160deg, var(--gg-blush-deep) 0%, var(--gg-petal) 100%)', href: catHref('Gift Hampers') },
  { image: cImg.festive,      name: 'Festive & Occasion', bg: 'linear-gradient(160deg, var(--gg-petal) 0%, var(--gg-accent) 100%)',      href: catHref('Festive & Occasion') },
  { image: cImg.stationery,   name: 'Stationery',         bg: 'linear-gradient(160deg, var(--gg-muted-fill) 0%, var(--gg-border) 100%)', href: catHref('Stationery') },
  { image: cImg.bags,         name: 'Bags & Pouches',     bg: 'linear-gradient(160deg, var(--gg-blush) 0%, var(--gg-border) 100%)',      href: catHref('Bags & Pouches') },
  { image: cImg.bottles,      name: 'Bottles',            bg: 'linear-gradient(160deg, var(--gg-blush-deep) 0%, var(--gg-rose) 100%)',   href: catHref('Bottles') },
  { emoji: '🧸', name: 'Toys', bg: 'linear-gradient(160deg, var(--gg-petal) 0%, var(--gg-blush) 100%)', href: catHref('Toys') },
];

const DOTS_COUNT    = 3;
const AUTO_INTERVAL = 3000;

function ChevLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Read the actual rendered gap from the track element so the JS
 * scroll calculation always matches the CSS gap at every breakpoint.
 */
function getStep(track: HTMLDivElement): number {
  const card = track.children[0] as HTMLElement | null;
  if (!card) return 0;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 14;
  return card.offsetWidth + gap;
}

export default function CategoriesSection() {
  const trackRef              = useRef<HTMLDivElement>(null);
  const [page, setPage]       = useState(0);
  const [maxPage, setMaxPage] = useState(CATEGORIES.length - 1);
  const isPaused              = useRef(false);
  const autoRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Recalculate maxPage on resize ── */
  useEffect(() => {
    function calc() {
      const track = trackRef.current;
      if (!track || !track.children[0]) return;
      const step    = getStep(track);
      const visible = Math.max(1, Math.floor(track.parentElement!.offsetWidth / step));
      const max     = Math.max(0, CATEGORIES.length - visible);
      setMaxPage(max);
      // clamp current page if window got wider
      setPage((p) => Math.min(p, max));
    }
    calc();
    const ro = new ResizeObserver(calc);
    if (trackRef.current?.parentElement)
      ro.observe(trackRef.current.parentElement);
    return () => ro.disconnect();
  }, []);

  /* ── Slide track ── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translateX(-${page * getStep(track)}px)`;
  }, [page]);

  const go = useCallback(
    (p: number) => setPage(Math.max(0, Math.min(p, maxPage))),
    [maxPage],
  );

  /* ── Auto-advance ── */
  useEffect(() => {
    autoRef.current = setInterval(() => {
      if (!isPaused.current)
        setPage((p) => (p >= maxPage ? 0 : p + 1));
    }, AUTO_INTERVAL);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [maxPage]);

  /* ── Touch swipe — live drag-follow, snaps to the nearest page on release ── */
  const touchX    = useRef(0);
  const moved     = useRef(false);
  const dragDelta = useRef(0);

  /* ── Dot mapping ── */
  const activeDot = maxPage === 0
    ? 0
    : Math.round((page / maxPage) * (DOTS_COUNT - 1));
  const dotToPage = (i: number) =>
    Math.round((i * maxPage) / (DOTS_COUNT - 1));

  return (
    <section className={styles.section}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headingBlock}>
            <h2 className={styles.heading}>Shop by Category</h2>
            <div className={styles.headingBar} />
          </div>

          <div className={styles.headerRight}>
            <div className={styles.navBtns}>
              <button
                className={`${styles.btn} ${styles.btnOut}`}
                onClick={() => go(page - 1)}
                disabled={page === 0}
                aria-label="Previous category"
              >
                <ChevLeft />
              </button>
              <button
                className={`${styles.btn} ${styles.btnFill}`}
                onClick={() => go(page + 1 > maxPage ? 0 : page + 1)}
                aria-label="Next category"
              >
                <ChevRight />
              </button>
            </div>

            <Link href="/search" className={styles.viewAll}>
              <span className={styles.viewAllText}>View All →</span>
            </Link>
          </div>
        </div>

        {/* Slider */}
        <div
          className={styles.outerWrap}
          onMouseEnter={() => { isPaused.current = true;  }}
          onMouseLeave={() => { isPaused.current = false; }}
        >
          <div
            className={styles.track}
            ref={trackRef}
            onTouchStart={(e) => {
              touchX.current    = e.touches[0].clientX;
              moved.current     = false;
              dragDelta.current = 0;
              isPaused.current  = true;
              const track = trackRef.current;
              if (track) track.style.transition = 'none';
            }}
            onTouchMove={(e) => {
              const dx = e.touches[0].clientX - touchX.current;
              dragDelta.current = dx;
              if (Math.abs(dx) > 4) moved.current = true;
              const track = trackRef.current;
              if (!track) return;
              const step = getStep(track);
              const base = -page * step;
              // Rubber-band resistance past the first/last page.
              const atStart = page === 0 && dx > 0;
              const atEnd    = page === maxPage && dx < 0;
              const eased    = atStart || atEnd ? dx * 0.35 : dx;
              track.style.transform = `translateX(${base + eased}px)`;
            }}
            onTouchEnd={() => {
              isPaused.current = false;
              const track = trackRef.current;
              if (!track) return;
              track.style.transition = ''; // restore CSS transition for the snap animation
              const dx = dragDelta.current;
              const step   = getStep(track);
              const target = moved.current && Math.abs(dx) > 30
                ? Math.max(0, Math.min(maxPage, page + (dx < 0 ? 1 : -1)))
                : page;
              track.style.transform = `translateX(-${target * step}px)`;
              go(target);
            }}
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                className={styles.card}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.expressive, delay: 0.05 + i * 0.06, ease: EASE.out }}
              >
                <Link
                  href={cat.href}
                  className={styles.cardLink}
                  aria-label={`Shop ${cat.name}`}
                >
                  <div className={styles.cardFrame}>
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width:420px) 130px,(max-width:600px) 148px,(max-width:900px) 160px,190px"
                        className={styles.cardImg}
                        priority={i < 4}
                      />
                    ) : (
                      <div className={styles.cardTint} style={{ background: cat.bg }}>
                        <span className={styles.cardEmoji} role="img" aria-label={cat.name}>{cat.emoji}</span>
                      </div>
                    )}
                    <div className={styles.cardScrim} aria-hidden="true" />
                    <div className={styles.cardFooter}>
                      <p className={styles.cardName}>{cat.name}</p>
                      <div className={styles.cardArrow} aria-hidden="true">→</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div className={styles.dots} role="tablist" aria-label="Carousel pages">
          {Array.from({ length: DOTS_COUNT }, (_, i) => (
            <button
              key={i}
              className={`${styles.dot}${activeDot === i ? ` ${styles.dotOn}` : ''}`}
              onClick={() => go(dotToPage(i))}
              aria-label={`Go to page ${i + 1}`}
              role="tab"
              aria-selected={activeDot === i}
            />
          ))}
        </div>

      </div>
    </section>
  );
}