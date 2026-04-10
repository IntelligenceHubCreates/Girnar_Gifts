'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  const [search, setSearch] = useState('');
  const cartCount = 3;

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <div className={styles.star}>🌟</div>
        Little<span className={styles.dot}>Loot</span>
      </Link>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search for toys, stationery, games…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" aria-label="Search">🔍</button>
      </div>

      <div className={styles.headerActions}>
        <button className={`${styles.iconBtn} ${styles.hideMobile}`} type="button">
          <span className={styles.icon}>📍</span>
          <span className={styles.iconLabel}>Store</span>
        </button>
        <button className={`${styles.iconBtn} ${styles.hideMobile}`} type="button">
          <span className={styles.icon}>📞</span>
          <span className={styles.iconLabel}>Support</span>
        </button>
        <Link href="/account" className={styles.iconBtn}>
          <span className={styles.icon}>👤</span>
          <span className={styles.iconLabel}>Account</span>
        </Link>
        <a href="/cart" className={`${styles.iconBtn} ${styles.cartBtn}`}>
          <span className={styles.cartIcon}>🛒</span>
          <span>Cart</span>
          <div className={styles.cartBadge}>{cartCount}</div>
        </a>
      </div>
    </header>
  );
}
