import { STATIONERY_ITEMS, SPOTLIGHT_TAGS } from '@/lib/data';
import styles from './StationerySpotlight.module.css';

export default function StationerySpotlight() {
  return (
    <section className={styles.spotlightSection}>
      <div className={styles.spotlightInner}>
        <div className={styles.spotlightText}>
          <div className={styles.tag}>⭐ Stationery Collection</div>
          <h2>
            Tools That Spark<br />
            <span>Creativity</span>
          </h2>
          <p>
            From vibrant sketch pads to premium gel pens — our curated stationery
            collection turns every desk into a creative studio.
          </p>
          <div className={styles.spotlightItems}>
            {SPOTLIGHT_TAGS.map((tag) => (
              <div key={tag} className={styles.spotlightItem}>{tag}</div>
            ))}
          </div>
          <button className={styles.btnPrimary} type="button">Explore Stationery →</button>
        </div>
        <div className={styles.spotlightGrid}>
          {STATIONERY_ITEMS.map((item) => (
            <div key={item.name} className={styles.spotlightProd}>
              <span className={styles.emoji}>{item.emoji}</span>
              <div className={styles.sname}>{item.name}</div>
              <div className={styles.sprice}>{item.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
