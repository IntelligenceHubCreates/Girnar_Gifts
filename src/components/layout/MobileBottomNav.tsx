'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './MobileBottomNav.module.css';

/* ─── Lightweight stroke icons (match Header.tsx style) ──────────────────── */
const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconGrid = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IconHeart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconCart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const IconUser = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export default function MobileBottomNav() {
  const pathname = usePathname() || '/';
  const { state } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { data: session } = useSession();

  const cartCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const avatar = session?.user?.image || null;
  const initial = session?.user?.name ? session.user.name.trim()[0].toUpperCase() : null;

  /* Main *website* navigation — NOT the account tabs. */
  const items = [
    { key: 'home',       label: 'Home',       href: '/',          active: pathname === '/' },
    { key: 'categories', label: 'Categories', href: '/products',  active: pathname.startsWith('/products') },
    { key: 'wishlist',   label: 'Wishlist',   href: '/wishlist',  active: pathname.startsWith('/wishlist') },
    { key: 'cart',       label: 'Cart',       href: '/cart',      active: pathname.startsWith('/cart') },
    { key: 'account',    label: 'Account',    href: '/account',   active: pathname.startsWith('/account') },
  ];

  const renderIcon = (key: string) => {
    switch (key) {
      case 'home':       return <IconHome />;
      case 'categories': return <IconGrid />;
      case 'wishlist':   return <IconHeart />;
      case 'cart':       return <IconCart />;
      case 'account':
        if (avatar) return <img src={avatar} alt="" className={styles.avatar} referrerPolicy="no-referrer" />;
        if (initial) return <span className={styles.avatarInitial}>{initial}</span>;
        return <IconUser />;
      default:           return null;
    }
  };

  const badgeCount = (key: string): number => {
    if (key === 'cart') return cartCount;
    if (key === 'wishlist') return wishlistCount;
    return 0;
  };

  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation">
      {items.map(it => {
        const count = badgeCount(it.key);
        return (
          <Link
            key={it.key}
            href={it.href}
            prefetch={false}
            className={`${styles.navItem} ${it.active ? styles.navItemActive : ''}`}
            aria-current={it.active ? 'page' : undefined}
            aria-label={it.label}
          >
            <span className={`${styles.iconWrap} ${it.key === 'account' && (avatar || initial) ? styles.iconWrapAvatar : ''}`}>
              {renderIcon(it.key)}
              {count > 0 && (
                <span className={styles.badge} aria-hidden="true">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </span>
            <span className={styles.navLabel}>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}