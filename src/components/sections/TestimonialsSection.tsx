'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TESTIMONIALS } from '@/lib/data';
import styles from './TestimonialsSection.module.css';

const AUTOPLAY_DELAY = 4500;

/* ── Pastel palette — deterministic per first letter ── */
const PASTEL_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: '#FFE4E1', color: '#C0524A' },
  B: { bg: '#FFE8CC', color: '#B56A1A' },
  C: { bg: '#FFF3CC', color: '#8A6A00' },
  D: { bg: '#E8F5E9', color: '#2E7D32' },
  E: { bg: '#E3F2FD', color: '#1565C0' },
  F: { bg: '#F3E5F5', color: '#6A1B9A' },
  G: { bg: '#FCE4EC', color: '#AD1457' },
  H: { bg: '#E0F7FA', color: '#00696F' },
  I: { bg: '#FFF9C4', color: '#827717' },
  J: { bg: '#FFEBEE', color: '#B71C1C' },
  K: { bg: '#E8EAF6', color: '#283593' },
  L: { bg: '#F1F8E9', color: '#33691E' },
  M: { bg: '#FBE9E7', color: '#BF360C' },
  N: { bg: '#E0F2F1', color: '#004D40' },
  O: { bg: '#FFF3E0', color: '#E65100' },
  P: { bg: '#EDE7F6', color: '#4527A0' },
  Q: { bg: '#F9FBE7', color: '#558B2F' },
  R: { bg: '#FFE0B2', color: '#BF360C' },
  S: { bg: '#F8BBD0', color: '#880E4F' },
  T: { bg: '#B2EBF2', color: '#006064' },
  U: { bg: '#DCEDC8', color: '#33691E' },
  V: { bg: '#F0F4C3', color: '#827717' },
  W: { bg: '#D7CCC8', color: '#4E342E' },
  X: { bg: '#CFD8DC', color: '#263238' },
  Y: { bg: '#FFF9C4', color: '#F57F17' },
  Z: { bg: '#E1F5FE', color: '#01579B' },
};

function getPastel(name: string) {
  const letter = (name?.[0] ?? 'A').toUpperCase();
  return PASTEL_COLORS[letter] ?? { bg: '#F5F0FF', color: '#5C35A0' };
}

/* ── Reusable avatar component ── */
interface UserAvatarProps {
  name: string;
  profilePhoto?: string;
  size?: 'md' | 'sm';
}

function UserAvatar({ name, profilePhoto, size = 'md' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = profilePhoto && !imgError;
  const { bg, color } = getPastel(name);
  const initial = (name?.[0] ?? '?').toUpperCase();

  return (
    <div
      className={size === 'sm' ? styles.statAvatarInner : styles.testiAvatarInner}
      style={showPhoto ? {} : { background: bg }}
    >
      {showPhoto ? (
        <img
          src={profilePhoto}
          alt={name}
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <span style={{ color }} className={styles.avatarInitial}>
          {initial}
        </span>
      )}
    </div>
  );
}

/* ── Main component ── */
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

  /* Stat row: first 4 unique testimonial authors */
  const statUsers = TESTIMONIALS.slice(0, 4);

  return (
    <section className={styles.testimonialSection}>
      {/* Decorative sparkles */}
      <span className={`${styles.sparkle} ${styles.sparkleTR}`}>✦</span>
      <span className={`${styles.sparkle} ${styles.sparkleBL}`}>✦</span>

      {/* Confetti curved dashed arrow path */}
      <svg
        className={styles.confettiPath}
        width="72"
        height="52"
        viewBox="0 0 72 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M4 44 C 12 44, 18 10, 36 8 C 54 6, 60 28, 68 20" stroke="#c8b8d8" strokeWidth="1.6" strokeDasharray="3.5 3.5" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M62 16 L68 20 L63 24" stroke="#c8b8d8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
        <circle cx="10" cy="30" r="2"   fill="#f9c5d0" opacity="0.7" />
        <circle cx="22" cy="14" r="1.5" fill="#aadcf5" opacity="0.65" />
        <circle cx="38" cy="22" r="2"   fill="#ffd6a0" opacity="0.6" />
        <circle cx="52" cy="10" r="1.5" fill="#b5e8c8" opacity="0.65" />
        <circle cx="60" cy="32" r="2"   fill="#c8b8d8" opacity="0.55" />
        <path d="M16 22 L16 26 M14 24 L18 24" stroke="#ffc8a0" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
        <path d="M46 18 L46 22 M44 20 L48 20" stroke="#aadcf5" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        <path d="M30 36 L30 39 M28.5 37.5 L31.5 37.5" stroke="#c8b8d8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M58 42 L60 39 L62 42 L60 45 Z" fill="#f9c5d0" opacity="0.5" />
        <path d="M6 16 L8 13 L10 16 L8 19 Z"   fill="#b5e8c8" opacity="0.45" />
      </svg>

      {/* Left arrow */}
      <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous testimonial">
        ‹
      </button>

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

                {/* ── Col 1: Avatar + Quote ── */}
                <div className={styles.colLeft}>
                  <div className={styles.avatarCol}>
                    <div className={styles.avatarBubble}>
                      <UserAvatar
                        name={t.author}
                        profilePhoto={t.profilePhoto}
                        size="md"
                      />
                    </div>
                  </div>
                  <div className={styles.quoteCol}>
                    <div className={styles.testiQuote}>"</div>
                    <p className={styles.testiText}>{t.quote}</p>
                    <div className={styles.testiMeta}>
                      <span className={styles.testiName}>{t.author}</span>
                      <span className={styles.verifiedBadge}>
                        <span className={styles.verifiedIcon}>✓</span> Verified Purchase
                      </span>
                    </div>
                    <div className={styles.testiStars}>★★★★★</div>
                  </div>
                </div>

                {/* ── Col 2: Stat block ── */}
                <div className={styles.colRight}>
                  {/* Top row: 98% + label */}
                  <div className={styles.statTopRow}>
                    <div className={styles.statNumber}>98%</div>
                    <div className={styles.statLabel}>Parents Recommend<br />Little Loot</div>
                  </div>
                  {/* Bottom row: avatars + and more */}
                  <div className={styles.statAvatarRow}>
                    {statUsers.map((u, idx) => (
                      <div key={idx} className={styles.statAvatarWrap}>
                        <UserAvatar
                          name={u.author}
                          profilePhoto={u.profilePhoto}
                          size="sm"
                        />
                      </div>
                    ))}
                    <span className={styles.andMore}>and more...</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right arrow */}
      <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next testimonial">
        ›
      </button>
    </section>
  );
}