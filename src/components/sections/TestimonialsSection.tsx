import { TESTIMONIALS } from '@/lib/data';
import styles from './TestimonialsSection.module.css';

export default function TestimonialsSection() {
  return (
    <section className={styles.testimonialSection}>
      <div className={styles.testiTitle}>💬 What Parents Are Saying</div>
      <div className={styles.testiCards}>
        {TESTIMONIALS.map((t) => (
          <div key={t.author} className={styles.testiCard}>
            <div className={styles.testiQuote}>"</div>
            <p className={styles.testiText}>{t.quote}</p>
            <div className={styles.testiAuthor}>
              <div className={styles.testiAvatar}>{t.avatar}</div>
              <div>
                <div className={styles.testiName}>{t.author}</div>
                <div className={styles.testiSub}>{t.sub}</div>
                <div className={styles.testiStars}>★★★★★</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
