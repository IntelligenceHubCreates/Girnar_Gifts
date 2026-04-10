import { TRUST_ITEMS } from '@/lib/data';
import styles from './TrustBar.module.css';

export default function TrustBar() {
  return (
    <div className={styles.trustBar}>
      {TRUST_ITEMS.map((item) => (
        <div key={item.title} className={styles.trustItem}>
          <div className={styles.trustIcon}>{item.icon}</div>
          <div className={styles.trustText}>
            <strong>{item.title}</strong>
            <span>{item.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
