import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroShapes}>
        <span className={styles.s1} />
        <span className={styles.s2} />
        <span className={styles.s3} />
      </div>

      <div className={styles.heroText}>
        <div className={styles.heroBadge}>✨ New Arrivals Just Dropped!</div>
        <h1>
          Where Kids<br />
          <span>Learn, Play</span><br />
          &amp; Explore
        </h1>
        <p>
          Discover a world of joy with curated toys, creative stationery, and
          educational games for every little adventurer.
        </p>
        <div className={styles.heroBtns}>
          <button className={styles.btnPrimary} type="button">Shop Now 🛒</button>
          <button className={styles.btnSecondary} type="button">Explore Deals</button>
        </div>
        <div className={styles.heroTags}>
          {['🚚 Free delivery on ₹499+', '↩️ Easy returns', '🎁 Gift wrapping'].map((tag) => (
            <span key={tag} className={styles.heroTag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className={styles.heroVisual}>
        <div className={styles.heroImgPlaceholder}>
          🧸
          <div className={`${styles.floatingBadge} ${styles.fb1}`}>Up to 40% OFF!</div>
          <div className={`${styles.floatingBadge} ${styles.fb2}`}>🌟 Top Rated</div>
          <div className={`${styles.floatingBadge} ${styles.fb3}`}>New Arrivals</div>
        </div>
      </div>
    </section>
  );
}
