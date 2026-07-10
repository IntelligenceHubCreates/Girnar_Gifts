'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './Header.module.css';
import { useCart } from '@/context/CartContext';
import { brand } from '@/config/brand';

/* ─── Types ──────────────────────────────────────────────────────── */
interface SubItem { emoji: string; label: string; sub: string; href: string; }
interface NavItem  { label: string; href: string; emoji: string; subItems?: SubItem[]; }
interface SearchProduct {
  id: string; name: string;
  category?: string; sub_category_name?: string;
  original_price?: number; amount_discount?: number;
  product_image?: Array<{ url: string; public_id?: string } | string>;
  brand?: string;
}

/* ─── Nav data — Girnar's real seeded gift categories (no fabricated
       subcategories yet; see MANUAL_STEPS.md for the taxonomy decision
       this is pending) ──────────────────────────────────────────────── */
const catHref = (name: string) => `/products?category=${encodeURIComponent(name)}`;

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', emoji: '🏠' },
  {
    label: 'Personalised Gifts', href: catHref('Personalised Gifts'), emoji: '🎁',
    subItems: [
      { emoji: '🧺', label: 'Build Your Own Hamper', sub: 'Pick items, we price it for you', href: '/personalised-gifts/build-a-hamper' },
    ],
  },
  { label: 'Gift Hampers',        href: catHref('Gift Hampers'),        emoji: '🧺' },
  { label: 'Festive & Occasion',  href: catHref('Festive & Occasion'),  emoji: '🎉' },
  { label: 'Stationery',          href: catHref('Stationery'),          emoji: '✏️' },
  { label: 'Bags & Pouches',      href: catHref('Bags & Pouches'),      emoji: '👝' },
  { label: 'Bottles',             href: catHref('Bottles'),             emoji: '🧴' },
  { label: 'Toys',                href: catHref('Toys'),                emoji: '🧸' },
];

const CAT_ITEMS = NAV_ITEMS; // show all items including Home

/* ─── Highlight search match ─────────────────────────────────────── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ─── SVG Icons ──────────────────────────────────────────────────── */
function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={filled ? 'var(--gg-primary)' : 'none'}
      stroke={filled ? 'var(--gg-primary)' : 'currentColor'}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
/* Shopping cart — trolley with wheels, matches reference */
function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9"  cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconChevron({ open }: { open?: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.22s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function Header() {

  /* ── Search state ── */
  const [search,      setSearch]      = useState('');
  const [results,     setResults]     = useState<SearchProduct[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const [searchOpen,  setSearchOpen]  = useState(false); // mobile toggle

  /* ── Nav / UI state ── */
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [openSection,   setOpenSection]   = useState<string | null>(null);
  const [activeDropIdx, setActiveDropIdx] = useState<number | null>(null);
  const [mobileChipOpen, setMobileChipOpen] = useState<string | null>(null); // ≤768px chip-strip dropdown, keyed by NAV_ITEMS label
  const [scrolled,      setScrolled]      = useState(false);

  /* ── Hooks ── */
  const { data: session, status } = useSession();
  const { state }   = useCart();
  const pathname    = usePathname();
  const router      = useRouter();

  /* ── Refs ── */
  const inputRef      = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const catBarRef     = useRef<HTMLElement>(null);
  const catStripRef   = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Derived ── */
  const cartCount = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const showDrop      = dropOpen && search.trim().length >= 2;
  const showNoResults = showDrop && !searching && results.length === 0;
  const userName    = session?.user?.name  || '';
  const userEmail   = session?.user?.email || '';
  const userImage   = session?.user?.image || null;
  const userInitial = userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : '?';

  /* ── Scroll shadow ── */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* ── Body scroll lock when drawer open ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* ── Close search dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setDropOpen(false); setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Close cat dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catBarRef.current && !catBarRef.current.contains(e.target as Node))
        setActiveDropIdx(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Close mobile chip-strip dropdown on outside tap ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catStripRef.current && !catStripRef.current.contains(e.target as Node))
        setMobileChipOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Close dropdowns on route change ── */
  useEffect(() => {
    setActiveDropIdx(null);
    setMobileChipOpen(null);
    setDropOpen(false);
  }, [pathname]);

  /* ── Debounced search ── */
  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ q, limit: '8' });
      const res    = await fetch(`/api/product/search?${params}`);
      const json   = await res.json();
      const raw: any[] = Array.isArray(json) ? json : (json?.data ?? []);
      const list: SearchProduct[] = raw.map((p) => ({
        id: String(p.id), name: p.name,
        category: p.sub_category_name || p.category || undefined,
        sub_category_name: p.sub_category_name,
        original_price: p.original_price, amount_discount: p.amount_discount,
        product_image: p.product_image, brand: p.brand,
      }));
      setResults(list); setDropOpen(true); setActiveIdx(-1);
    } catch {
      setResults([]); setDropOpen(false);
    } finally { setSearching(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (!q || q.length < 2) { setResults([]); setDropOpen(false); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => doSearch(q), 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, doSearch]);

  /* ── Search keyboard navigation ── */
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if      (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter')      { e.preventDefault(); activeIdx >= 0 && results[activeIdx] ? navigateToProduct(results[activeIdx]) : search.trim() && submitSearch(); }
    else if (e.key === 'Escape')     { setDropOpen(false); setActiveIdx(-1); setSearchOpen(false); inputRef.current?.blur(); }
  }

  function submitSearch() {
    if (!search.trim()) return;
    setDropOpen(false); setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }
  function navigateToProduct(p: SearchProduct) {
    setDropOpen(false); setSearch(''); setResults([]); setSearchOpen(false);
    router.push(`/product/${p.id}`);
  }
  function clearSearch() { setSearch(''); setResults([]); setDropOpen(false); inputRef.current?.focus(); }

  /* ── Cat-bar dropdown hover with leave-delay ── */
  function handleCatEnter(idx: number) {
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
    setActiveDropIdx(idx);
  }
  function handleCatLeave() {
    dropTimerRef.current = setTimeout(() => setActiveDropIdx(null), 120);
  }
  function handleDropEnter() {
    if (dropTimerRef.current) clearTimeout(dropTimerRef.current);
  }
  function handleDropLeave() {
    dropTimerRef.current = setTimeout(() => setActiveDropIdx(null), 120);
  }

  /* ── Helpers ── */
  const closeMenu     = () => { setMenuOpen(false); setOpenSection(null); };
  const toggleSection = (label: string) => setOpenSection((p) => p === label ? null : label);
  // Category links now carry a `?category=` query string (real Girnar
  // categories, not path segments) - deliberately not highlighted as
  // "active" here since usePathname() can't see query params without
  // useSearchParams(), which would force every page rendering Header
  // out of static generation. Plain path hrefs still highlight correctly.
  const isActive = (href: string) =>
    href.includes('?') ? false : (href === '/' ? pathname === '/' : pathname.startsWith(href));

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── ROW 1: TOP BAR ─────────────────────────────────────────── */}
      <div className={styles.topbar}>
        <span className={styles.topbarMsg}>
          Complimentary gift wrapping on every order &nbsp;&middot;&nbsp; 7-day easy returns
        </span>
      </div>

      {/* ── ROW 2: MAIN HEADER ─────────────────────────────────────── */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerInner}>

          {/* Hamburger — mobile only */}
          <button
            className={styles.hamburger} type="button"
            aria-label="Toggle menu" aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
          </button>

          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Image src={brand.assets.favicon} alt="" fill sizes="44px" priority />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>{brand.name}</span>
              <span className={styles.logoTagline}>{brand.tagline}</span>
            </div>
          </Link>

          {/* ── Right group: Search + Icon actions — always flush right ── */}
          <div className={styles.rightGroup}>

          {/* ── Search — always visible desktop; toggled mobile ─── */}
          <div
            ref={searchWrapRef}
            className={`${styles.searchWrap} ${searchOpen ? styles.searchWrapOpen : ''}`}
          >
            {/* Desktop: always rendered. Mobile: only when searchOpen */}
            <div className={`${styles.searchBar} ${!searchOpen ? styles.searchBarDesktop : ''}`}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for gifts, hampers, personalised presents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => { results.length > 0 && setDropOpen(true); }}
                autoComplete="off"
                aria-label="Search products"
                role="combobox"
                aria-expanded={showDrop}
                aria-haspopup="listbox"
                aria-controls="header-search-listbox"
                aria-autocomplete="list"
              />
              {search && (
                <button className={styles.clearBtn} type="button"
                  onClick={clearSearch} aria-label="Clear search">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
              <button
                type="button" className={styles.searchBtn}
                onClick={submitSearch} aria-label="Search"
              >
                {searching
                  ? <span className={styles.spinner} />
                  : <IconSearch />}
              </button>
              {/* Close only shown on mobile overlay */}
              <button
                type="button" className={styles.searchClose}
                onClick={() => { setSearchOpen(false); clearSearch(); }}
                aria-label="Close search"
              >✕</button>
            </div>

            {/* Mobile search trigger */}
            {!searchOpen && (
              <button
                type="button"
                className={styles.searchTriggerMobile}
                onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                aria-label="Open search"
              >
                <IconSearch />
              </button>
            )}

            {/* Search results dropdown */}
            {showDrop && results.length > 0 && (
              <div id="header-search-listbox" className={styles.searchDrop} role="listbox" aria-label="Search suggestions">
                {results.map((product, i) => {
                  const imgEntry = product.product_image?.[0];
                  const imgUrl   = typeof imgEntry === 'string' ? imgEntry : imgEntry?.url ?? null;
                  const price    = product.original_price != null
                    ? product.original_price - (product.amount_discount ?? 0) : null;
                  return (
                    <div
                      key={product.id}
                      className={`${styles.searchItem} ${i === activeIdx ? styles.searchItemActive : ''}`}
                      role="option" aria-selected={i === activeIdx}
                      onMouseDown={(e) => { e.preventDefault(); navigateToProduct(product); }}
                      onMouseEnter={() => setActiveIdx(i)}
                    >
                      <div className={styles.searchThumb}>
                        {imgUrl
                          ? <img src={imgUrl} alt={product.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <span aria-hidden="true">🎁</span>}
                      </div>
                      <div className={styles.searchInfo}>
                        <div className={styles.searchName}><Highlight text={product.name} query={search} /></div>
                        {product.category && <div className={styles.searchCat}>{product.category}</div>}
                      </div>
                      {price != null && (
                        <div className={styles.searchPrice}>₹{price.toLocaleString('en-IN')}</div>
                      )}
                    </div>
                  );
                })}
                <button
                  className={styles.searchFooter} type="button"
                  onMouseDown={(e) => { e.preventDefault(); submitSearch(); }}
                >
                  See all results for <strong>"{search}"</strong> →
                </button>
              </div>
            )}
            {showNoResults && (
              <div className={styles.searchDrop}>
                <div className={styles.searchEmpty}>
                  🔍 No products found for <strong>"{search}"</strong>
                </div>
              </div>
            )}
          </div>

          {/* ── Right icon actions ────────────────────────────────── */}
          <div className={styles.iconActions}>

            {/* Wishlist */}
            <Link href="/wishlist" className={styles.iconAction} aria-label="Wishlist">
              <span className={styles.iconActionIcon}><IconHeart /></span>
              <span className={styles.iconActionLabel}>Wishlist</span>
            </Link>

            {/* Account — direct link, no dropdown */}
            {status === 'loading' ? (
              <div className={styles.authPlaceholder} aria-hidden="true" />
            ) : session ? (
              /* Logged in → go straight to /account */
              <Link href="/account" className={styles.iconAction} aria-label="My Account">
                <span className={styles.iconActionIcon}>
                  {userImage
                    ? <img src={userImage} alt={userName} className={styles.userAvatar} referrerPolicy="no-referrer" />
                    : <div className={styles.userInitial}>{userInitial}</div>}
                </span>
                <span className={styles.iconActionLabel}>
                  {userName.split(' ')[0] || 'Account'}
                </span>
              </Link>
            ) : (
              /* Logged out → go straight to /login */
              <Link href="/login" className={styles.iconAction} aria-label="Account">
                <span className={styles.iconActionIcon}><IconUser /></span>
                <span className={styles.iconActionLabel}>Account</span>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className={styles.iconAction} aria-label={`Cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}>
              <span className={styles.iconActionIcon} style={{ position: 'relative' }}>
                <IconCart />
                {cartCount > 0 && (
                  <span className={styles.cartBadge} aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </span>
              <span className={styles.iconActionLabel}>Cart</span>
            </Link>

          </div>{/* /iconActions */}
          </div>{/* /rightGroup */}
        </div>{/* /headerInner */}
      </header>

      {/* ── Mobile category chip strip (≤768px only) ── */}
      <div className={styles.catStripWrap} ref={catStripRef}>
        <nav className={styles.catStripMobile} aria-label="Browse categories">
          <Link
            href="/products"
            className={`${styles.catChip} ${pathname === '/products' ? styles.catChipActive : ''}`}
          >
            <span className={styles.catChipEmoji} aria-hidden="true">🛍️</span>
            All
          </Link>

          {NAV_ITEMS.filter((item) => item.href !== '/').map((item) => (
            item.subItems ? (
              <button
                key={item.label}
                type="button"
                className={`${styles.catChip} ${isActive(item.href) ? styles.catChipActive : ''}`}
                onClick={() => setMobileChipOpen((p) => (p === item.label ? null : item.label))}
                aria-haspopup="true"
                aria-expanded={mobileChipOpen === item.label}
              >
                <span className={styles.catChipEmoji} aria-hidden="true">{item.emoji}</span>
                {item.label}
                <IconChevron open={mobileChipOpen === item.label} />
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.catChip} ${isActive(item.href) ? styles.catChipActive : ''}`}
              >
                <span className={styles.catChipEmoji} aria-hidden="true">{item.emoji}</span>
                {item.label}
              </Link>
            )
          ))}

          <Link
            href="/products?sort=newest"
            className={styles.catChip}
          >
            <span className={styles.catChipEmoji} aria-hidden="true">✦</span>
            New Arrivals
          </Link>
        </nav>

        {/* Tap-triggered dropdown for chips with subItems (e.g. Personalised
            Gifts → Build Your Own Hamper) - mirrors the desktop hover
            dropdown's content, adapted to tap since the chip strip has no
            hover state on touch devices. */}
        {mobileChipOpen && NAV_ITEMS.find((i) => i.label === mobileChipOpen)?.subItems && (
          <div className={styles.mobileChipDropdown} role="menu">
            {(() => {
              const openItem = NAV_ITEMS.find((i) => i.label === mobileChipOpen)!;
              return (
                <>
                  <div className={styles.mobileChipDropdownHeader}>
                    <span className={styles.dropdownTitle}>{openItem.label}</span>
                    <Link href={openItem.href} className={styles.dropdownViewAllInline} onClick={() => setMobileChipOpen(null)}>
                      View all →
                    </Link>
                  </div>
                  <div className={styles.dropdownList}>
                    {openItem.subItems!.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={styles.dropdownLink}
                        role="menuitem"
                        onClick={() => setMobileChipOpen(null)}
                      >
                        <span className={styles.dropdownEmoji} aria-hidden="true">{sub.emoji}</span>
                        <span className={styles.dropdownText}>
                          <span className={styles.dropdownLabel}>{sub.label}</span>
                          <span className={styles.dropdownSub}>{sub.sub}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── ROW 3: CATEGORY NAV BAR ────────────────────────────────── */}
      <nav
        ref={catBarRef}
        className={styles.categoryBar}
        aria-label="Category navigation"
      >
        {/* Orange "All Categories" pill */}
        <Link href="/products" className={styles.allCatsBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          All Categories
        </Link>

        {/* Category links */}
        <div className={styles.catNav}>
          {CAT_ITEMS.map((item, idx) => (
            <div
              key={item.label}
              className={styles.catNavItem}
              onMouseEnter={() => item.subItems && handleCatEnter(idx)}
              onMouseLeave={() => item.subItems && handleCatLeave()}
            >
              {/* Parent link — navigates AND shows dropdown on hover */}
              <Link
                href={item.href}
                className={`${styles.catNavLink} ${isActive(item.href) ? styles.catNavLinkActive : ''}`}
                aria-haspopup={!!item.subItems}
                aria-expanded={activeDropIdx === idx}
                onClick={() => setActiveDropIdx(null)}
              >
                {item.label}
                {item.subItems && <IconChevron open={activeDropIdx === idx} />}
              </Link>

              {/* Dropdown panel */}
              {item.subItems && (
                <div
                  className={`${styles.dropdown} ${item.subItems.length > 4 ? styles.dropdownWide : ''} ${activeDropIdx === idx ? styles.dropdownVisible : ''}`}
                  role="menu"
                  onMouseEnter={handleDropEnter}
                  onMouseLeave={handleDropLeave}
                >
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownTitle}>{item.label}</span>
                    <Link href={item.href} className={styles.dropdownViewAllInline} onClick={() => setActiveDropIdx(null)}>
                      View all →
                    </Link>
                  </div>
                  <div className={item.subItems.length > 4 ? styles.dropdownGrid : styles.dropdownList}>
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={styles.dropdownLink}
                        role="menuitem"
                        onClick={() => setActiveDropIdx(null)}
                      >
                        <span className={styles.dropdownEmoji} aria-hidden="true">{sub.emoji}</span>
                        <span className={styles.dropdownText}>
                          <span className={styles.dropdownLabel}>{sub.label}</span>
                          <span className={styles.dropdownSub}>{sub.sub}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className={styles.dropdownFooter}>
                    <Link href={item.href} className={styles.dropdownViewAll} onClick={() => setActiveDropIdx(null)}>
                      View all {item.label} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* New Arrivals — right */}
        <Link href="/products?sort=newest" className={styles.newArrivalsLink}>
          <span aria-hidden="true">✦</span> New Arrivals
        </Link>
      </nav>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className={styles.overlay}
          onClick={closeMenu}
          role="dialog" aria-modal="true" aria-label="Navigation menu"
        >
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>

            <div className={styles.drawerHeader}>
              <div className={styles.drawerLogo}>{brand.shortName}<span>{brand.name.replace(brand.shortName, '').trim()}</span></div>
              <button className={styles.drawerClose} onClick={closeMenu}
                type="button" aria-label="Close menu">✕</button>
            </div>

            {session ? (
              <div className={styles.drawerUser}>
                {userImage
                  ? <img src={userImage} alt={userName} className={styles.drawerUserAvatar} referrerPolicy="no-referrer" />
                  : <div className={styles.drawerUserInitial}>{userInitial}</div>}
                <div>
                  <div className={styles.drawerUserName}>{userName}</div>
                  <div className={styles.drawerUserEmail}>{userEmail}</div>
                </div>
              </div>
            ) : (
              <div className={styles.drawerAuthBtns}>
                <Link href="/login"  className={styles.drawerLoginBtn}    onClick={closeMenu}>Login</Link>
                <Link href="/signup" className={styles.drawerRegisterBtn} onClick={closeMenu}>Register</Link>
              </div>
            )}

            <nav className={styles.drawerNav} aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className={styles.drawerSection}>
                  {item.subItems ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.drawerToggle} ${isActive(item.href) ? styles.drawerLinkActive : ''}`}
                        onClick={() => toggleSection(item.label)}
                        aria-expanded={openSection === item.label}
                      >
                        <span aria-hidden="true">{item.emoji}</span>
                        <span className={styles.drawerToggleLabel}>{item.label}</span>
                        <span
                          className={`${styles.drawerChevron} ${openSection === item.label ? styles.drawerChevronOpen : ''}`}
                          aria-hidden="true"
                        >▾</span>
                      </button>
                      {openSection === item.label && (
                        <div className={styles.drawerSubs}>
                          {item.subItems.map((sub) => (
                            <Link key={sub.href} href={sub.href}
                              className={styles.drawerSub} onClick={closeMenu}>
                              <span aria-hidden="true">{sub.emoji}</span>{sub.label}
                            </Link>
                          ))}
                          <Link href={item.href} className={styles.drawerViewAll} onClick={closeMenu}>
                            View all {item.label} →
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`${styles.drawerToggle} ${isActive(item.href) ? styles.drawerLinkActive : ''}`}
                      onClick={closeMenu}
                    >
                      <span aria-hidden="true">{item.emoji}</span>
                      <span className={styles.drawerToggleLabel}>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}

              {/* Wishlist + Orders quick links in drawer */}
              <div className={styles.drawerSection}>
                <Link href="/wishlist" className={styles.drawerToggle} onClick={closeMenu}>
                  <span aria-hidden="true">❤️</span>
                  <span className={styles.drawerToggleLabel}>Wishlist</span>
                </Link>
              </div>
              <div className={styles.drawerSection}>
                <Link href="/orders" className={styles.drawerToggle} onClick={closeMenu}>
                  <span aria-hidden="true">📦</span>
                  <span className={styles.drawerToggleLabel}>My Orders</span>
                </Link>
              </div>
              <div className={styles.drawerSection}>
                <Link href="/cart" className={styles.drawerToggle} onClick={closeMenu}>
                  <span aria-hidden="true">🛒</span>
                  <span className={styles.drawerToggleLabel}>Cart {cartCount > 0 ? `(${cartCount})` : ''}</span>
                </Link>
              </div>

              {session && (
                <button
                  type="button" className={styles.drawerSignOut}
                  onClick={() => { closeMenu(); signOut({ callbackUrl: '/login' }); }}
                >
                  🚪 Sign Out
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}