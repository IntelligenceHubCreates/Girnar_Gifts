'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NAV_LINKS } from '@/lib/data';
import styles from './NavBar.module.css';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={link.active ? styles.active : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/sale" className={styles.navSale}>
            🔥 Sale
          </Link>
        </div>

        <button
          className={styles.hamburger}
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
        </button>
      </nav>

      {menuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMenuOpen(false)}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`${styles.mobileLink} ${link.active ? styles.mobileLinkActive : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/sale"
              className={`${styles.mobileLink} ${styles.mobileSale}`}
              onClick={() => setMenuOpen(false)}
            >
              🔥 Sale
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
