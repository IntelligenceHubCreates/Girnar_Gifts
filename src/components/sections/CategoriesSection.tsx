'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './CategoriesSection.module.css';

interface Category {
  image?: string;
  emoji?: string;
  name: string;
  count: string;
  bg: string;
  dots?: boolean;
  href: string;
  txtclr: string;
}

const CATEGORIES: Category[] = [
  { image: '/stationery.png',     name: 'Stationery',      count: '186 Items', bg: 'linear-gradient(160deg,#FFDCC7 0%,#FFC6A4 100%)', txtclr: '#7A4322',  href: '/stationery' },
  { image: '/bags.png',           name: 'Bags & Pouches',  count: '214 Items', bg: 'linear-gradient(160deg,#FFF1C7 0%,#FFE59A 100%)', txtclr: '#7B5A00',  href: '/bags' },
  { image: '/Tumbler.png',        name: 'Bottles & Lunch', count: '97 Items',  bg: 'linear-gradient(160deg,#DDF6E8 0%,#BDECCC 100%)', txtclr: '#1F5C45', href: '/bottles', dots: true },
  { image: '/toys.png',           name: 'Toys & Games',    count: '341 Items', bg: 'linear-gradient(160deg,#FFD8E2 0%,#FFBFD0 100%)', txtclr: '#8A3652', href: '/toys' },
  { image: '/beauty.png',         name: 'Beauty & Hair',   count: '128 Items', bg: 'linear-gradient(160deg,#EEE0FF 0%,#DCC7FF 100%)', txtclr: '#5F3D99', href: '/beauty' },
  { image: '/keychains.png',      name: 'Keychains',       count: '73 Items',  bg: 'linear-gradient(160deg,#FFF0D4 0%,#FFE2A8 100%)', txtclr: '#7A5715', href: '/keychains' },
  { emoji: '🎁',                  name: 'Gift Sets',       count: '59 Items',  bg: 'linear-gradient(160deg,#E9ECF3 0%,#D8DDE8 100%)', txtclr: '#4A5568', href: '/gifts' },
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

  /* ── Touch swipe ── */
  const touchX = useRef(0);
  const moved  = useRef(false);

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
              touchX.current   = e.touches[0].clientX;
              moved.current    = false;
              isPaused.current = true;
            }}
            onTouchMove={() => { moved.current = true; }}
            onTouchEnd={(e) => {
              isPaused.current = false;
              if (!moved.current) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 30) go(dx < 0 ? page + 1 : page - 1);
            }}
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                className={styles.card}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
              >
                <Link
                  href={cat.href}
                  className={styles.cardLink}
                  aria-label={`Shop ${cat.name}`}
                >
                  {/* Bleed image */}
                  {cat.image ? (
                    <div className={styles.productWrap}>
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width:420px) 108px,(max-width:600px) 124px,(max-width:900px) 134px,160px"
                        className={styles.productImg}
                        priority={i < 4}
                      />
                    </div>
                  ) : (
                    <div className={styles.emojiWrap} role="img" aria-label={cat.name}>
                      {cat.emoji}
                    </div>
                  )}

                  {/* Coloured body */}
                  <div
                    className={styles.cardInner}
                    style={{ background: cat.bg }}
                  >
                    <div className={`${styles.cardBody}${cat.dots ? ` ${styles.cardBodyDots}` : ''}`}>
                      <p className={styles.cardName} style={{ color: cat.txtclr }}>{cat.name}</p>
                      <p className={styles.cardCount} style={{ color: cat.txtclr }}>{cat.count}</p>
                      <div className={styles.cardArrow} style={{ color: cat.txtclr }} aria-hidden="true">→</div>
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