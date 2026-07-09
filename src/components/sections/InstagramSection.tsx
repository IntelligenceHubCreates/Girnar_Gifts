import { brand } from '@/config/brand';
import styles from './InstagramSection.module.css';

// No live Instagram feed integration yet (would need real API credentials
// and real posted content - see MANUAL_STEPS.md). This is an honest
// follow-CTA rather than fabricated post thumbnails.
export default function InstagramSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Follow along</p>
        <p className={styles.body}>
          Gifting ideas, behind-the-scenes, and new arrivals on Instagram.
        </p>
        <a
          href={brand.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
        >
          Follow {brand.name}
        </a>
      </div>
    </section>
  );
}
