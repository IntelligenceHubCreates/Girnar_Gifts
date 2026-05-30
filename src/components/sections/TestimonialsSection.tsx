'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TESTIMONIALS } from '@/lib/data';
import styles from './TestimonialsSection.module.css';

const AUTOPLAY_DELAY = 4500;

export default function TestimonialsSection() {
  const [current, setCurrent]   = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const total      = TESTIMONIALS.length;

  /* ── Autoplay ── */
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrent((c) => (c + 1) % total);
    }, AUTOPLAY_DELAY);
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, resetTimer]);

  /* ── Navigation ── */
  const goTo = useCallback((idx: number) => {
    setCurrent((idx + total) % total);
  }, [total]);

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  /* ── Touch / mouse drag ── */
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
    if (dragOffset < -50)       goTo(current + 1);
    else if (dragOffset > 50)   goTo(current - 1);
    setDragOffset(0);
  }

  /* ── Keyboard ── */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  }

  return (
    <section className={styles.testimonialSection}>
      <div className={styles.testiTitle}>💬 What Parents Are Saying</div>

      <div
        className={styles.carouselWrap}
        role="region"
        aria-label="Testimonials carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* ── Track ── */}
        <div
          ref={trackRef}
          className={`${styles.track} ${dragging ? styles.trackDragging : ''}`}
          style={{
            transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))`,
          }}
          onMouseDown={(e) => onDragStart(e.clientX)}
          onMouseMove={(e) => onDragMove(e.clientX)}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
          onTouchEnd={onDragEnd}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.author}
              className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
              aria-hidden={i !== current}
            >
              <div className={styles.testiCard}>
                <div className={styles.testiQuote}>"</div>
                <p className={styles.testiText}>{t.quote}</p>
                <div className={styles.testiAuthor}>
                  <div className={styles.testiAvatar}>{t.avatar}</div>
                  <div>
                    <div className={styles.testiName}>{t.author}</div>
                    <div className={styles.testiSub}>{t.sub}</div>
                    <div className={styles.testiStars}>★★★★★</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* ── Dots ── */}
      <div className={styles.dots} role="tablist">
        {TESTIMONIALS.map((_, i) => (
          <span key={i} className={styles.dotWrap} onClick={() => goTo(i)}>
            <span
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to testimonial ${i + 1}`}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && goTo(i)}
            />
          </span>
        ))}
      </div>
    </section>
  );
}