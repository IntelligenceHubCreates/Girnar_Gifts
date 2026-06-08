'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './BlogSection.module.css';

interface BlogPost {
  id:       string;
  title:    string;
  tag:      string;
  tagColor: string;
  date:     string;
  readTime: string;
  image:    string;
  slug:     string;
}

const POSTS: BlogPost[] = [
  {
    id: '1',
    title:    '10 Best Educational Toys for Kids in 2024',
    tag:      'EDUCATION',
    tagColor: '#7c6ff7',
    date:     'May 22, 2024',
    readTime: '5 min read',
    image:    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80',
    slug:     '10-best-educational-toys-2024',
  },
  {
    id: '2',
    title:    'How Play Helps Your Child Learn and Grow',
    tag:      'PARENTING',
    tagColor: '#22c55e',
    date:     'May 8, 2024',
    readTime: '4 min read',
    image:    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80',
    slug:     'how-play-helps-child-learn-grow',
  },
  {
    id: '3',
    title:    'Easy DIY Crafts to Do at Home with Kids',
    tag:      'ACTIVITIES',
    tagColor: '#f59e0b',
    date:     'May 5, 2024',
    readTime: '4 min read',
    image:    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80',
    slug:     'easy-diy-crafts-at-home',
  },
  {
    id: '4',
    title:    'Choosing the Right Stationery for Your Child',
    tag:      'STATIONERY',
    tagColor: '#ec4899',
    date:     'Apr 28, 2024',
    readTime: '3 min read',
    image:    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&q=80',
    slug:     'choosing-right-stationery',
  },
  {
    id: '5',
    title:    'Screen-Free Activities for Toddlers',
    tag:      'PARENTING',
    tagColor: '#22c55e',
    date:     'Apr 15, 2024',
    readTime: '6 min read',
    image:    'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=600&q=80',
    slug:     'screen-free-activities-toddlers',
  },
];

const AUTOPLAY_MS  = 5000;
// Show 3 full cards + ~30% of 4th peeking — achieved via cardWidth=28%
const CARD_WIDTH_PCT = 28.5;   // each card = 28.5% of track

export default function BlogSection() {
  const [current,    setCurrent]    = useState(0);
  const [dragging,   setDragging]   = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxIndex = POSTS.length - 1;

  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(idx, maxIndex)));
  }, [maxIndex]);

  // Autoplay
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrent((c) => (c >= maxIndex - 2 ? 0 : c + 1));
    }, AUTOPLAY_MS);
  }, [maxIndex]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, resetTimer]);

  // Drag / swipe
  function onDragStart(clientX: number) {
    dragStartX.current = clientX;
    setDragging(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  }
  function onDragMove(clientX: number) {
    if (!dragging) return;
    setDragOffset(clientX - dragStartX.current);
  }
  function onDragEnd() {
    if (!dragging) return;
    setDragging(false);
    if      (dragOffset < -50) goTo(current + 1);
    else if (dragOffset >  50) goTo(current - 1);
    setDragOffset(0);
    resetTimer();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  }

  // translateX: each step moves one card width
  const translateX = -(current * CARD_WIDTH_PCT) + (typeof window !== 'undefined'
    ? (dragOffset / window.innerWidth) * 100
    : 0);

  return (
    <section className={styles.section}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <h2 className={styles.title}>Latest from Our Blog</h2>
        <Link href="/blog" className={styles.viewAll}>
          View All Articles
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </Link>
      </div>

      {/* ── Carousel ── */}
      <div
        className={styles.viewport}
        role="region"
        aria-label="Blog posts"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseDown={(e)  => onDragStart(e.clientX)}
        onMouseMove={(e)  => onDragMove(e.clientX)}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
        onTouchMove={(e)  => onDragMove(e.touches[0].clientX)}
        onTouchEnd={onDragEnd}
      >
        <div
          className={`${styles.track} ${dragging ? styles.noTransition : ''}`}
          style={{
            transform: `translateX(calc(-${current * CARD_WIDTH_PCT}% + ${dragOffset}px))`,
          }}
        >
          {POSTS.map((post) => (
            <div key={post.id} className={styles.card}>
              {/* Photo */}
              <Link href={`/blog/${post.slug}`} className={styles.imgLink} tabIndex={-1}>
                <div className={styles.imgBox}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className={styles.img}
                    loading="lazy"
                    draggable={false}
                  />
                </div>
              </Link>

              {/* Text */}
              <div className={styles.body}>
                <span className={styles.tag} style={{ color: post.tagColor }}>
                  {post.tag}
                </span>
                <Link href={`/blog/${post.slug}`} className={styles.cardTitle}>
                  {post.title}
                </Link>
                <div className={styles.meta}>
                  <span>{post.date}</span>
                  <span className={styles.dot}>·</span>
                  <span>{post.readTime}</span>
                  <span className={styles.dot}>·</span>
                  <Link href={`/blog/${post.slug}`} className={styles.readLink}>read</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}