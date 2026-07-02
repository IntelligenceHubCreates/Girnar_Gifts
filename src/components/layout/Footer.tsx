import Link from 'next/link';
import { FOOTER_INFO_LINKS, FOOTER_ACCOUNT_LINKS } from '@/lib/data';
import styles from './Footer.module.css';

// ── Social media SVG icons (official brand colors on hover via CSS) ──

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// ── Payment method SVGs ─────────────────────────────────────────

function IconUPI() {
  return (
    <svg width="36" height="20" viewBox="0 0 60 30" fill="none">
      <rect width="60" height="30" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <text x="5" y="20" fontFamily="Arial" fontSize="11" fontWeight="900" fill="#7B25B5">UPI</text>
      <polygon points="38,8 48,15 38,22" fill="#F47C20"/>
      <polygon points="48,8 58,15 48,22" fill="#7B25B5"/>
    </svg>
  );
}

function IconVisa() {
  return (
    <svg width="36" height="20" viewBox="0 0 60 30" fill="none">
      <rect width="60" height="30" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <text x="8" y="21" fontFamily="Arial" fontSize="14" fontWeight="900" fill="#1A1F71" letterSpacing="0">VISA</text>
    </svg>
  );
}

function IconMastercard() {
  return (
    <svg width="36" height="20" viewBox="0 0 60 30" fill="none">
      <rect width="60" height="30" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <circle cx="23" cy="15" r="9" fill="#EB001B"/>
      <circle cx="37" cy="15" r="9" fill="#F79E1B"/>
      <path d="M30 7.7a9 9 0 0 1 0 14.6A9 9 0 0 1 30 7.7z" fill="#FF5F00"/>
    </svg>
  );
}

function IconRuPay() {
  return (
    <svg width="36" height="20" viewBox="0 0 60 30" fill="none">
      <rect width="60" height="30" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <text x="5" y="20" fontFamily="Arial" fontSize="10" fontWeight="900" fill="#1E4C96">Ru</text>
      <text x="22" y="20" fontFamily="Arial" fontSize="10" fontWeight="900" fill="#E4252A">Pay</text>
    </svg>
  );
}

function IconNetBanking() {
  return (
    <svg width="36" height="20" viewBox="0 0 60 30" fill="none">
      <rect width="60" height="30" rx="4" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <rect x="8" y="10" width="44" height="3" rx="1" fill="#1A1A2E"/>
      <rect x="10" y="16" width="6" height="8" rx="1" fill="#F47C20"/>
      <rect x="20" y="16" width="6" height="8" rx="1" fill="#F47C20"/>
      <rect x="30" y="16" width="6" height="8" rx="1" fill="#F47C20"/>
      <rect x="40" y="16" width="6" height="8" rx="1" fill="#F47C20"/>
    </svg>
  );
}

// ── Social link data ────────────────────────────────────────────

const SOCIAL_LINKS = [
  { label: 'Facebook',  href: 'https://facebook.com/littleloot',  icon: <IconFacebook />,  hoverColor: '#1877F2' },
  { label: 'Instagram', href: 'https://instagram.com/littleloot', icon: <IconInstagram />, hoverColor: '#E1306C' },
  { label: 'X',         href: 'https://x.com/littleloot',         icon: <IconX />,         hoverColor: '#000000' },
  { label: 'YouTube',   href: 'https://youtube.com/@littleloot',  icon: <IconYouTube />,   hoverColor: '#FF0000' },
];

// ── Footer component ────────────────────────────────────────────

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>

        {/* ── Brand ── */}
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>🌟</div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>
                Little<span className={styles.logoDot}>Loot</span>
              </span>
              <span className={styles.logoTagline}>Joy for every child</span>
            </div>
          </Link>
          <p>
            Your one-stop destination for premium kids toys, creative stationery,
            and educational games. Bringing joy to every child!
          </p>
          <div className={styles.footerSocial}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label={s.label}
                style={{ '--hover-color': s.hoverColor } as React.CSSProperties}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* ── Information ── */}
        <div className={styles.footerCol}>
          <h4>Information</h4>
          <ul>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/blog">Our Blog</Link></li>
            <li><Link href="/careers">Careers</Link></li>
            <li><Link href="/press">Press & Media</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms & Conditions</Link></li>
            <li><Link href="/sitemap.xml">Sitemap</Link></li>
          </ul>
        </div>

        {/* ── My Account ── */}
        <div className={styles.footerCol}>
          <h4>My Account</h4>
          <ul>
            <li><Link href="/account">My Profile</Link></li>
            <li><Link href="/account/orders">My Orders</Link></li>
            <li><Link href="/wishlist">Wishlist</Link></li>
            <li><Link href="/account/addresses">Saved Addresses</Link></li>
            <li><Link href="/cart">My Cart</Link></li>
            <li><Link href="/account/returns">Returns & Refunds</Link></li>
            <li><Link href="/track-order">Track My Order</Link></li>
          </ul>
        </div>

        {/* ── Contact ── */}
        <div className={styles.footerCol}>
          <h4>Contact Us</h4>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>📍</span>
            <span>123 Market Street, Guntur,<br />Andhra Pradesh 522001</span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>📞</span>
            <a href="tel:+919876543210">+91 98765 43210</a>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>✉️</span>
            <a href="mailto:hello@littleloot.in">hello@littleloot.in</a>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>⏰</span>
            <span>Mon–Sat: 9 am – 7 pm IST</span>
          </div>
          {/* Quick support CTA */}
          <a href="https://wa.me/919876543210?text=Hi%20Little%20Loot!%20%F0%9F%91%8B%20I%20need%20some%20help." target="_blank" rel="noopener noreferrer" className={styles.supportBtn}>
            💬 Chat with Support
          </a>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.footerBottom}>
        <span>© {currentYear} Little Loot. All rights reserved. Built with ❤️ by Intelligence Hub.</span>
        <div className={styles.paymentIcons}>
          <IconUPI />
          <IconVisa />
          <IconMastercard />
          <IconRuPay />
          <IconNetBanking />
        </div>
      </div>
    </footer>
  );
}