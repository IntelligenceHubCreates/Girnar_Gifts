import Link from 'next/link';
import styles from './TopBar.module.css';
import { brand } from '@/config/brand';

export default function TopBar() {
  return (
    <div className={styles.topbar}>
      <span>🎉 Welcome to {brand.name} — {brand.tagline}!</span>
      <div className={styles.links}>
        <Link href="/track-order">Track Order</Link>
        <Link href="/help">Help</Link>
        <Link href="/store-locator">Store Locator</Link>
      </div>
    </div>
  );
}
