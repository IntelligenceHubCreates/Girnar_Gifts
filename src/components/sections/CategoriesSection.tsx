import { CATEGORIES } from '@/lib/data';
import styles from './CategoriesSection.module.css';

export default function CategoriesSection() {
  return (
    <section className={styles.categoriesSection}>
      <div className={styles.sectionTitle}>Shop by Category</div>
      <div className={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.name}
            className={styles.catCard}
            style={{ background: cat.bg }}
            role="button"
            tabIndex={0}
          >
            <span className={styles.catEmoji}>{cat.emoji}</span>
            <div className={styles.catName}>{cat.name}</div>
            <div className={styles.catCount}>{cat.count}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
