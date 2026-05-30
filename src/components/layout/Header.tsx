'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './Header.module.css';
import { useCart } from '@/context/CartContext';

interface SubItem { emoji: string; label: string; sub: string; href: string; }
interface NavItem  { label: string; href: string; emoji: string; subItems?: SubItem[]; }

interface SearchProduct {
  id: string; name: string;
  category?: string; sub_category_name?: string;
  original_price?: number; amount_discount?: number;
  product_image?: Array<{ url: string; public_id?: string } | string>;
  brand?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', emoji: '🏠' },
  {
    label: 'Stationery', href: '/stationery', emoji: '📝',
    subItems: [
      { emoji: '✏️', label: 'Pens & Pencils',      sub: 'Gel pens, colour pencils & sets',   href: '/stationery/pens-pencils' },
      { emoji: '📏', label: 'Scales & Rulers',     sub: 'Acrylic, folding, triangle',         href: '/stationery/scales' },
      { emoji: '🔪', label: 'Sharpeners',           sub: 'Character, novelty & standard',     href: '/stationery/sharpeners' },
      { emoji: '🧹', label: 'Erasers',              sub: 'Novelty, box & standard erasers',   href: '/stationery/erasers' },
      { emoji: '📒', label: 'Notebooks & Diaries',  sub: 'Diaries, clipboards & notepads',   href: '/stationery/notebooks' },
      { emoji: '🖍️', label: 'Art & Craft',          sub: 'Crayons, paints & colour books',   href: '/stationery/art-craft' },
      { emoji: '🏷️', label: 'Stickers & Tapes',    sub: 'Washi tape, seal & deco stickers',  href: '/stationery/stickers' },
      { emoji: '🎯', label: 'Stationery Sets',      sub: 'Gifting sets, space & kuromi kits', href: '/stationery/sets' },
    ],
  },
  {
    label: 'Bags & Pouches', href: '/bags', emoji: '👜',
    subItems: [
      { emoji: '🎒', label: 'School Bags',         sub: 'Premium & standard school bags',     href: '/bags/school-bags' },
      { emoji: '👝', label: 'Sling Bags',          sub: 'Fancy, jelly, silicone & knot',      href: '/bags/sling-bags' },
      { emoji: '🧳', label: 'Duffle & Travel',     sub: 'Mini duffle, jelly & fancy duffle',  href: '/bags/duffle-travel' },
      { emoji: '👛', label: 'Coin Pouches',        sub: 'Bling, unicorn & flat coin pouches', href: '/bags/coin-pouches' },
      { emoji: '✏️', label: 'Pencil Pouches',      sub: '3D zip, bunny, kitty & more',        href: '/bags/pencil-pouches' },
      { emoji: '🌿', label: 'Jute Bags',           sub: 'Mini, small & medium jute bags',     href: '/bags/jute-bags' },
      { emoji: '💼', label: 'Lunch Bags',          sub: 'Croc, bento, insulated & more',      href: '/bags/lunch-bags' },
      { emoji: '🧊', label: 'Frosted & Jelly',     sub: 'Transparent, jelly & frosted bags',  href: '/bags/frosted-jelly' },
    ],
  },
  {
    label: 'Bottles & Lunch', href: '/bottles', emoji: '🍱',
    subItems: [
      { emoji: '💧', label: 'Water Bottles',       sub: 'Cartoon, sports & printed bottles',  href: '/bottles/water-bottles' },
      { emoji: '🏆', label: 'Tumblers & Cups',     sub: 'Stanley, crystal, LED & handle',     href: '/bottles/tumblers' },
      { emoji: '🍱', label: 'Lunch Boxes',         sub: 'Character, cat, plain & 3-section',  href: '/bottles/lunch-boxes' },
      { emoji: '🥣', label: 'Tiffin & Soup',       sub: 'Insulated, steel & bento boxes',     href: '/bottles/tiffin' },
    ],
  },
  {
    label: 'Toys & Games', href: '/toys', emoji: '🎮',
    subItems: [
      { emoji: '🧩', label: 'Puzzles',             sub: 'Tangram, wooden, face & jigsaw',     href: '/toys/puzzles' },
      { emoji: '🎲', label: 'Board Games',         sub: 'Ludo, tic tac toe, magnetic game',   href: '/toys/board-games' },
      { emoji: '🤸', label: 'Activity Toys',       sub: 'Slime, squishy, bubbles & more',     href: '/toys/activity' },
      { emoji: '⏱️', label: 'Watches & Gadgets',   sub: 'Camera watch, light & digital',      href: '/toys/watches-gadgets' },
      { emoji: '🐷', label: 'Piggy Banks',         sub: 'Small, big & character banks',       href: '/toys/piggy-banks' },
      { emoji: '🎨', label: 'DIY & Creative',      sub: 'Diamond painting, scratch books',    href: '/toys/diy-creative' },
    ],
  },
  {
    label: 'Beauty & Hair', href: '/beauty', emoji: '💄',
    subItems: [
      { emoji: '💇', label: 'Hair Accessories',    sub: 'Scrunchies, clips, bands & pins',    href: '/beauty/hair' },
      { emoji: '💋', label: 'Makeup',              sub: 'Lipstick, face palette, lip balm',   href: '/beauty/makeup' },
      { emoji: '🧴', label: 'Skincare',            sub: 'Sunscreen, serum, moisturiser',      href: '/beauty/skincare' },
      { emoji: '🪥', label: 'Hygiene',             sub: 'Toothbrush, handwash, wet wipes',    href: '/beauty/hygiene' },
      { emoji: '🧼', label: 'Bath & Body',         sub: 'Soaps, shampoo bar, whipped soap',   href: '/beauty/bath-body' },
      { emoji: '💅', label: 'Nails & Jewellery',   sub: 'Nail sets, bracelets & necklaces',   href: '/beauty/nails-jewellery' },
    ],
  },
  {
    label: 'Keychains', href: '/keychains', emoji: '🔑',
    subItems: [
      { emoji: '🔑', label: 'All Keychains',       sub: 'Camera, casino, bottle & more',      href: '/keychains/all' },
      { emoji: '✨', label: 'Phone Charms',         sub: 'Labubu, mobile & bag charms',        href: '/keychains/phone-charms' },
      { emoji: '🧸', label: 'Character Charms',    sub: 'Anime, cartoon & novelty charms',    href: '/keychains/character' },
    ],
  },
  {
    label: 'Gift Sets', href: '/gifts', emoji: '🎁',
    subItems: [
      { emoji: '🎁', label: 'Gift Sets',           sub: 'Small, big & curated gift sets',     href: '/gifts/gift-sets' },
      { emoji: '🎨', label: 'Art Gift Sets',       sub: 'Paint & stationery gifting sets',    href: '/gifts/art-gifts' },
      { emoji: '🧳', label: 'Trolley Gift Sets',   sub: 'Suitcase & trolley gift bundles',    href: '/gifts/trolley' },
      { emoji: '👒', label: 'Accessory Sets',      sub: 'Box accessory & doll sets',          href: '/gifts/accessories' },
    ],
  },
];

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

export default function Header() {
  const [search,       setSearch]       = useState('');
  const [results,      setResults]      = useState<SearchProduct[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [dropOpen,     setDropOpen]     = useState(false);
  const [activeIdx,    setActiveIdx]    = useState(-1);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [openSection,  setOpenSection]  = useState<string | null>(null);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  const { data: session, status } = useSession();
  const { state }   = useCart();
  const pathname    = usePathname();
  const router      = useRouter();

  const inputRef    = useRef<HTMLInputElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartCount = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const BACKEND   = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

  // scroll shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropOpen(false); setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ q, limit: '8' });
      const res    = await fetch(`${BACKEND}/api/product/search?${params}`);
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
  }, [BACKEND]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (!q || q.length < 2) { setResults([]); setDropOpen(false); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => doSearch(q), 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, doSearch]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); activeIdx >= 0 && results[activeIdx] ? navigateToProduct(results[activeIdx]) : search.trim() && submitSearch(); }
    else if (e.key === 'Escape') { setDropOpen(false); setActiveIdx(-1); setSearchOpen(false); inputRef.current?.blur(); }
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

  const closeMenu     = () => { setMenuOpen(false); setOpenSection(null); };
  const toggleSection = (label: string) => setOpenSection((p) => p === label ? null : label);
  const isActive      = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const showDrop      = dropOpen && search.trim().length >= 2;
  const showNoResults = showDrop && !searching && results.length === 0;

  const userName    = session?.user?.name  || '';
  const userEmail   = session?.user?.email || '';
  const userImage   = session?.user?.image || null;
  const userInitial = userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : '?';

  return (
    <>
      {/* ── TopBar ── */}
      <div className={styles.topbar}>
        <span className={styles.topbarMsg}>🎉 Welcome to Little Loot — Fun starts here!</span>
        <div className={styles.topbarLinks}>
          <Link href="/track-order">Track Order</Link>
          <Link href="/help">Help</Link>
          <Link href="/store-locator">Store Locator</Link>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerInner}>

          {/* Hamburger — mobile only */}
          <button className={styles.hamburger} type="button"
            aria-label="Toggle menu" aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}>
            <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
          </button>

          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>🌟</div>
            Little<span className={styles.logoDot}>Loot</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.navLinks} aria-label="Main navigation">
            {NAV_ITEMS.map((item) =>
              item.subItems ? (
                <div key={item.label} className={styles.navItem}>
                  <button type="button"
                    className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}>
                    {item.label}
                    <span className={styles.chevron} aria-hidden="true">▾</span>
                  </button>
                  <div className={`${styles.dropdown} ${item.subItems.length > 4 ? styles.dropdownWide : ''}`}
                    role="menu">
                    <div className={styles.dropdownTitle}>{item.label}</div>
                    <div className={item.subItems.length > 4 ? styles.dropdownGrid : ''}>
                      {item.subItems.map((sub) => (
                        <Link key={sub.href} href={sub.href} className={styles.dropdownLink} role="menuitem">
                          <span className={styles.dropdownEmoji} aria-hidden="true">{sub.emoji}</span>
                          <span className={styles.dropdownText}>
                            <span className={styles.dropdownLabel}>{sub.label}</span>
                            <span className={styles.dropdownSub}>{sub.sub}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link href={item.href} className={styles.dropdownViewAll}>
                      View all {item.label} →
                    </Link>
                  </div>
                </div>
              ) : (
                <div key={item.label} className={styles.navItem}>
                  <Link href={item.href}
                    className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}>
                    {item.label}
                  </Link>
                </div>
              )
            )}
          </nav>

          {/* Right actions */}
          <div className={styles.actions}>

            {/* Search */}
            <div ref={wrapRef}
              className={`${styles.searchWrap} ${searchOpen ? styles.searchWrapOpen : ''}`}>
              {searchOpen ? (
                <div className={styles.searchBar}>
                  <input ref={inputRef} type="text"
                    placeholder="Search toys, stationery…"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={onKeyDown}
                    onFocus={() => results.length > 0 && setDropOpen(true)}
                    autoComplete="off" autoFocus aria-label="Search products" />
                  {search && (
                    <button className={styles.clearBtn} type="button"
                      onClick={clearSearch} aria-label="Clear search">✕</button>
                  )}
                  <button type="button" className={styles.searchBtn}
                    onClick={submitSearch} aria-label="Submit search">
                    {searching ? <span className={styles.spinner} /> : '🔍'}
                  </button>
                  <button type="button" className={styles.searchClose}
                    onClick={() => { setSearchOpen(false); clearSearch(); }}
                    aria-label="Close search">✕</button>
                </div>
              ) : (
                <button type="button" className={styles.iconBtn}
                  onClick={() => setSearchOpen(true)} aria-label="Open search">
                  <span className={styles.iconBtnIcon} aria-hidden="true">🔍</span>
                </button>
              )}

              {/* Dropdown results */}
              {showDrop && results.length > 0 && (
                <div className={styles.searchDrop} role="listbox">
                  {results.map((product, i) => {
                    const imgEntry = product.product_image?.[0];
                    const imgUrl = typeof imgEntry === 'string' ? imgEntry : imgEntry?.url ?? null;
                    const price  = product.original_price != null
                      ? product.original_price - (product.amount_discount ?? 0) : null;
                    return (
                      <div key={product.id}
                        className={`${styles.searchItem} ${i === activeIdx ? styles.searchItemActive : ''}`}
                        role="option" aria-selected={i === activeIdx}
                        onMouseDown={(e) => { e.preventDefault(); navigateToProduct(product); }}
                        onMouseEnter={() => setActiveIdx(i)}>
                        <div className={styles.searchThumb}>
                          {imgUrl
                            ? <img src={imgUrl} alt={product.name}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span aria-hidden="true">🎁</span>}
                        </div>
                        <div className={styles.searchInfo}>
                          <div className={styles.searchName}>
                            <Highlight text={product.name} query={search} />
                          </div>
                          {product.category && (
                            <div className={styles.searchCat}>{product.category}</div>
                          )}
                        </div>
                        {price != null && (
                          <div className={styles.searchPrice}>₹{price.toLocaleString('en-IN')}</div>
                        )}
                      </div>
                    );
                  })}
                  <button className={styles.searchFooter} type="button"
                    onMouseDown={(e) => { e.preventDefault(); submitSearch(); }}>
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

            {/* Cart */}
            <Link href="/cart" className={styles.cartBtn} aria-label={`Cart, ${cartCount} items`}>
              <span aria-hidden="true">🛒</span>
              <span className={styles.cartLabel}>Cart</span>
              {cartCount > 0 && (
                <span className={styles.cartBadge} aria-hidden="true">{cartCount}</span>
              )}
            </Link>

            {/* Auth */}
            {status === 'loading' ? (
              <div className={styles.authPlaceholder} aria-hidden="true" />
            ) : session ? (
              <div ref={userMenuRef} className={styles.userWrap}>
                <button type="button" className={styles.userBtn}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Account menu" aria-expanded={userMenuOpen}>
                  {userImage
                    ? <img src={userImage} alt={userName} className={styles.userAvatar} referrerPolicy="no-referrer" />
                    : <div className={styles.userInitial} aria-hidden="true">{userInitial}</div>}
                  <span className={styles.userNameLabel}>{userName.split(' ')[0] || 'Account'}</span>
                  <span className={styles.userChevron} aria-hidden="true">▾</span>
                </button>
                {userMenuOpen && (
                  <div className={styles.userMenu} role="menu">
                    <div className={styles.userMenuTop}>
                      {userImage
                        ? <img src={userImage} alt={userName} className={styles.userMenuAvatar} referrerPolicy="no-referrer" />
                        : <div className={styles.userMenuInitial} aria-hidden="true">{userInitial}</div>}
                      <div>
                        <div className={styles.userMenuName}>{userName || 'My Account'}</div>
                        <div className={styles.userMenuEmail}>{userEmail}</div>
                      </div>
                    </div>
                    <div className={styles.userMenuDivider} />
                    <Link href="/account"              className={styles.userMenuItem} role="menuitem" onClick={() => setUserMenuOpen(false)}><span>👤</span> My Account</Link>
                    <Link href="/orders"               className={styles.userMenuItem} role="menuitem" onClick={() => setUserMenuOpen(false)}><span>📦</span> My Orders</Link>
                    <Link href="/account?tab=wishlist" className={styles.userMenuItem} role="menuitem" onClick={() => setUserMenuOpen(false)}><span>❤️</span> Wishlist</Link>
                    <Link href="/account?tab=addresses" className={styles.userMenuItem} role="menuitem" onClick={() => setUserMenuOpen(false)}><span>📍</span> Addresses</Link>
                    <div className={styles.userMenuDivider} />
                    <button type="button"
                      className={`${styles.userMenuItem} ${styles.userMenuSignOut}`}
                      role="menuitem"
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/login' }); }}>
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authBtns}>
                <Link href="/login"  className={styles.loginBtn}>Login</Link>
                <Link href="/signup" className={styles.registerBtn}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className={styles.overlay} onClick={closeMenu}
          role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerLogo}>Little<span>Loot</span></div>
              <button className={styles.drawerClose} onClick={closeMenu}
                type="button" aria-label="Close menu">✕</button>
            </div>

            {session ? (
              <div className={styles.drawerUser}>
                {userImage
                  ? <img src={userImage} alt={userName} className={styles.drawerUserAvatar} referrerPolicy="no-referrer" />
                  : <div className={styles.drawerUserInitial} aria-hidden="true">{userInitial}</div>}
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
                      <button type="button"
                        className={`${styles.drawerToggle} ${isActive(item.href) ? styles.drawerLinkActive : ''}`}
                        onClick={() => toggleSection(item.label)}
                        aria-expanded={openSection === item.label}>
                        <span aria-hidden="true">{item.emoji}</span>
                        <span className={styles.drawerToggleLabel}>{item.label}</span>
                        <span className={`${styles.drawerChevron} ${openSection === item.label ? styles.drawerChevronOpen : ''}`}
                          aria-hidden="true">▾</span>
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
                    <Link href={item.href}
                      className={`${styles.drawerToggle} ${isActive(item.href) ? styles.drawerLinkActive : ''}`}
                      onClick={closeMenu}>
                      <span aria-hidden="true">{item.emoji}</span>
                      <span className={styles.drawerToggleLabel}>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
              {session && (
                <button type="button" className={styles.drawerSignOut}
                  onClick={() => { closeMenu(); signOut({ callbackUrl: '/login' }); }}>
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