import Link from 'next/link';
import { FOOTER_INFO_LINKS, FOOTER_ACCOUNT_LINKS, BRANDS } from '@/lib/data';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        {/* Brand */}
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.logo}>
            <div className={styles.star}>🌟</div>
            Little<span className={styles.dot}>Loot</span>
          </Link>
          <p>
            Your one-stop destination for premium kids toys, creative stationery,
            and educational games. Bringing joy to every child!
          </p>
          <div className={styles.footerSocial}>
            {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
              <button key={i} className={styles.socialBtn} type="button" aria-label={`Social ${i}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Information */}
        <div className={styles.footerCol}>
          <h4>Information</h4>
          <ul>
            {FOOTER_INFO_LINKS.map((label) => (
              <li key={label}>
                <Link href="#">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* My Account */}
        <div className={styles.footerCol}>
          <h4>My Account</h4>
          <ul>
            {FOOTER_ACCOUNT_LINKS.map((label) => (
              <li key={label}>
                <Link href="#">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className={styles.footerCol}>
          <h4>Contact Us</h4>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>📍</span>
            <span>123 Market Street, Guntur, Andhra Pradesh 522001</span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>📞</span>
            <span>+91 98765 43210</span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>✉️</span>
            <span>
              <Link href="mailto:hello@littleloot.in">hello@littleloot.in</Link>
            </span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>⏰</span>
            <span>Mon–Sat: 9am – 7pm</span>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© 2026 Little Loot. All rights reserved. Built with ❤️ by Intelligence Hub.</span>
        <div className={styles.paymentIcons}>
          {['UPI', 'VISA', 'MC', 'RuPay'].map((pay) => (
            <div key={pay} className={styles.payIcon}>{pay}</div>
          ))}
        </div>
      </div>
    </footer>
  );
}
