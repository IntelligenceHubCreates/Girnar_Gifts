'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './NavBar.module.css';

interface SubItem {
  emoji: string;
  label: string;
  sub: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  emoji: string;
  subItems?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', emoji: '🏠' },
  {
    label: 'Stationery', href: '/stationery', emoji: '📝',
    subItems: [
      { emoji: '✏️', label: 'Pens & Pencils',     sub: 'Gel pens, colour pencils & sets',   href: '/stationery/pens-pencils' },
      { emoji: '📏', label: 'Scales & Rulers',    sub: 'Acrylic, folding, triangle',         href: '/stationery/scales' },
      { emoji: '🔪', label: 'Sharpeners',          sub: 'Character, novelty & standard',     href: '/stationery/sharpeners' },
      { emoji: '🧹', label: 'Erasers',             sub: 'Novelty, box & standard erasers',   href: '/stationery/erasers' },
      { emoji: '📒', label: 'Notebooks & Diaries', sub: 'Diaries, clipboards & notepads',   href: '/stationery/notebooks' },
      { emoji: '🖍️', label: 'Art & Craft',         sub: 'Crayons, paints & colour books',   href: '/stationery/art-craft' },
      { emoji: '🏷️', label: 'Stickers & Tapes',   sub: 'Washi tape, seal & deco stickers',  href: '/stationery/stickers' },
      { emoji: '🎯', label: 'Stationery Sets',     sub: 'Gifting sets, space & kuromi kits', href: '/stationery/sets' },
    ],
  },
  {
    label: 'Bags & Pouches', href: '/bags', emoji: '👜',
    subItems: [
      { emoji: '🎒', label: 'School Bags',        sub: 'Premium & standard school bags',     href: '/bags/school-bags' },
      { emoji: '👝', label: 'Sling Bags',         sub: 'Fancy, jelly, silicone & knot',      href: '/bags/sling-bags' },
      { emoji: '🧳', label: 'Duffle & Travel',    sub: 'Mini duffle, jelly & fancy duffle',  href: '/bags/duffle-travel' },
      { emoji: '👛', label: 'Coin Pouches',       sub: 'Bling, unicorn & flat coin pouches', href: '/bags/coin-pouches' },
      { emoji: '✏️', label: 'Pencil Pouches',     sub: '3D zip, bunny, kitty & more',        href: '/bags/pencil-pouches' },
      { emoji: '🌿', label: 'Jute Bags',          sub: 'Mini, small & medium jute bags',     href: '/bags/jute-bags' },
      { emoji: '💼', label: 'Lunch Bags',         sub: 'Croc, bento, insulated & more',      href: '/bags/lunch-bags' },
      { emoji: '🧊', label: 'Frosted & Jelly',    sub: 'Transparent, jelly & frosted bags',  href: '/bags/frosted-jelly' },
    ],
  },
  {
    label: 'Bottles & Lunch', href: '/bottles', emoji: '🍱',
    subItems: [
      { emoji: '💧', label: 'Water Bottles',      sub: 'Cartoon, sports & printed bottles',  href: '/bottles/water-bottles' },
      { emoji: '🏆', label: 'Tumblers & Cups',    sub: 'Stanley, crystal, LED & handle',     href: '/bottles/tumblers' },
      { emoji: '🍱', label: 'Lunch Boxes',        sub: 'Character, cat, plain & 3-section',  href: '/bottles/lunch-boxes' },
      { emoji: '🥣', label: 'Tiffin & Soup',      sub: 'Insulated, steel & bento boxes',     href: '/bottles/tiffin' },
    ],
  },
  {
    label: 'Toys & Games', href: '/toys', emoji: '🎮',
    subItems: [
      { emoji: '🧩', label: 'Puzzles',            sub: 'Tangram, wooden, face & jigsaw',     href: '/toys/puzzles' },
      { emoji: '🎲', label: 'Board Games',        sub: 'Ludo, tic tac toe, magnetic game',   href: '/toys/board-games' },
      { emoji: '🤸', label: 'Activity Toys',      sub: 'Slime, squishy, bubbles & more',     href: '/toys/activity' },
      { emoji: '⏱️', label: 'Watches & Gadgets',  sub: 'Camera watch, light & digital',      href: '/toys/watches-gadgets' },
      { emoji: '🐷', label: 'Piggy Banks',        sub: 'Small, big & character banks',       href: '/toys/piggy-banks' },
      { emoji: '🎨', label: 'DIY & Creative',     sub: 'Diamond painting, scratch books',    href: '/toys/diy-creative' },
    ],
  },
  {
    label: 'Beauty & Hair', href: '/beauty', emoji: '💄',
    subItems: [
      { emoji: '💇', label: 'Hair Accessories',   sub: 'Scrunchies, clips, bands & pins',    href: '/beauty/hair' },
      { emoji: '💋', label: 'Makeup',             sub: 'Lipstick, face palette, lip balm',   href: '/beauty/makeup' },
      { emoji: '🧴', label: 'Skincare',           sub: 'Sunscreen, serum, moisturiser',      href: '/beauty/skincare' },
      { emoji: '🪥', label: 'Hygiene',            sub: 'Toothbrush, handwash, wet wipes',    href: '/beauty/hygiene' },
      { emoji: '🧼', label: 'Bath & Body',        sub: 'Soaps, shampoo bar, whipped soap',   href: '/beauty/bath-body' },
      { emoji: '💅', label: 'Nails & Jewellery',  sub: 'Nail sets, bracelets & necklaces',   href: '/beauty/nails-jewellery' },
    ],
  },
  {
    label: 'Keychains', href: '/keychains', emoji: '🔑',
    subItems: [
      { emoji: '🔑', label: 'All Keychains',      sub: 'Camera, casino, bottle & more',      href: '/keychains/all' },
      { emoji: '✨', label: 'Phone Charms',        sub: 'Labubu, mobile & bag charms',        href: '/keychains/phone-charms' },
      { emoji: '🧸', label: 'Character Charms',   sub: 'Anime, cartoon & novelty charms',    href: '/keychains/character' },
    ],
  },
  {
    label: 'Gift Sets', href: '/gifts', emoji: '🎁',
    subItems: [
      { emoji: '🎁', label: 'Gift Sets',          sub: 'Small, big & curated gift sets',     href: '/gifts/gift-sets' },
      { emoji: '🎨', label: 'Art Gift Sets',      sub: 'Paint & stationery gifting sets',    href: '/gifts/art-gifts' },
      { emoji: '🧳', label: 'Trolley Gift Sets',  sub: 'Suitcase & trolley gift bundles',    href: '/gifts/trolley' },
      { emoji: '👒', label: 'Accessory Sets',     sub: 'Box accessory & doll sets',          href: '/gifts/accessories' },
    ],
  },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className={styles.nav}>
      <div className={styles.navLinks}>
        {NAV_ITEMS.map((item) =>
          item.subItems ? (
            <div key={item.label} className={styles.navItem}>
              <button
                className={`${styles.navItemLink} ${isActive(item.href) ? styles.active : ''}`}
                aria-haspopup="true"
                type="button"
              >
                {item.label}
                <span className={styles.chevron}>▾</span>
              </button>

              <div className={`${styles.dropdown} ${item.subItems.length > 4 ? styles.dropdownWide : ''}`}>
                <div className={styles.dropdownSectionTitle}>{item.label}</div>
                <div className={item.subItems.length > 4 ? styles.dropdownGrid : ''}>
                  {item.subItems.map((sub) => (
                    <Link key={sub.href} href={sub.href} className={styles.dropdownLink}>
                      <span className={styles.dropdownEmoji}>{sub.emoji}</span>
                      <span className={styles.dropdownLinkText}>
                        <span className={styles.dropdownLinkLabel}>{sub.label}</span>
                        <span className={styles.dropdownLinkSub}>{sub.sub}</span>
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
              <Link
                href={item.href}
                className={isActive(item.href) ? styles.active : ''}
              >
                {item.label}
              </Link>
            </div>
          )
        )}
      </div>

      <Link href="/sale" className={styles.navSale}>
        🔥 Sale
      </Link>
    </nav>
  );
}