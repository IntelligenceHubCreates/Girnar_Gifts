import Link from 'next/link';
import styles from './TopBar.module.css';

export default function TopBar() {
  return (
    <div className={styles.topbar}>
      <span>🎉 Welcome to Little Loot — Fun starts here!</span>
      <div className={styles.links}>
        <Link href="/track-order">Track Order</Link>
        <Link href="/help">Help</Link>
        <Link href="/store-locator">Store Locator</Link>
      </div>
    </div>
  );
}
