'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/data';
import styles from './BlogSection.module.css';

const AUTOPLAY_DELAY = 5000;
// How many cards visible per slide depends on screen — handled via CSS width
// Logic: we always render all cards, track scrolls by CARDS_PER_VIEW steps

export default function BlogSection() {
  const [current, setCurrent]     = useState(0);
  const [dragging, setDragging]   = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX  = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [perView, setPerView]     = useState(3);
  const total = BLOG_POSTS.length;
  const maxIndex = Math.max(0, total - perView);

  /* ── Detect cards per view from window width ── */
  useEffect(() => {
    function update() {
      if (window.innerWidth <= 600)       setPerView(1);
      else if (window.innerWidth <= 900)  setPerView(2);
      else                                setPerView(3);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── Autoplay ── */
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrent((c) => (c >= maxIndex ? 0 : c + 1));
    }, AUTOPLAY_DELAY);
  }, [maxIndex]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, resetTimer]);

  /* ── Navigation ── */
  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(idx, maxIndex)));
  }, [maxIndex]);

  /* ── Drag ── */
  function onDragStart(clientX: number) {
    dragStartX.current = clientX;
    setDragging(true);
    setDragOffset(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  }
  function onDragMove(clientX: number) {
    if (!dragging) return;
    setDragOffset(clientX - dragStartX.current);
  }
  function onDragEnd() {
    if (!dragging) return;
    setDragging(false);
    if (dragOffset < -50)     goTo(current + 1);
    else if (dragOffset > 50) goTo(current - 1);
    setDragOffset(0);
  }

  /* ── Keyboard ── */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  }

  /* ── Dot count = number of "pages" ── */
  const dotCount = maxIndex + 1;
  const cardWidth = 100 / perView; // percent

  return (
    <section className={styles.blogSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Latest from Our Blog</div>
        <Link href="/blog" className={styles.viewAll}>All Posts →</Link>
      </div>

      <div
        className={styles.carouselWrap}
        role="region"
        aria-label="Blog posts carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div
          className={`${styles.track} ${dragging ? styles.trackDragging : ''}`}
          style={{
            transform: `translateX(calc(-${current * cardWidth}% + ${dragOffset}px))`,
          }}
          onMouseDown={(e) => onDragStart(e.clientX)}
          onMouseMove={(e) => onDragMove(e.clientX)}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
          onTouchEnd={onDragEnd}
        >
          {BLOG_POSTS.map((post, i) => (
            <div
              key={post.title}
              className={styles.slide}
              style={{ width: `${cardWidth}%` }}
              aria-hidden={i < current || i >= current + perView}
            >
              <div className={styles.blogCard}>
                <div className={styles.blogThumb} style={{ background: post.bg }}>
                  {post.emoji}
                  <div className={styles.blogDate}>{post.date}</div>
                </div>
                <div className={styles.blogBody}>
                  <div className={styles.blogTag}>{post.tag}</div>
                  <div className={styles.blogTtl}>{post.title}</div>
                  <div className={styles.blogExcerpt}>{post.excerpt}</div>
                  <Link href="/blog" className={styles.blogRead}>Read More →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {dotCount > 1 && (
        <div className={styles.dots} role="tablist">
          {Array.from({ length: dotCount }).map((_, i) => (
            <span key={i} className={styles.dotWrap} onClick={() => goTo(i)}>
              <span
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && goTo(i)}
              />
            </span>
          ))}
        </div>
      )}
    </section>
  );
}