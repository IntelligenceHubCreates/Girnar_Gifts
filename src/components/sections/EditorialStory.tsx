'use client';

import { motion } from 'framer-motion';
import { brand } from '@/config/brand';
import styles from './EditorialStory.module.css';

export default function EditorialStory() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.visualGlow} aria-hidden="true" />
          <span className={styles.visualEmoji} aria-hidden="true">🎁</span>
        </motion.div>

        <motion.div
          className={styles.copy}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className={styles.eyebrow}>The art of gifting</p>
          <blockquote className={styles.quote}>
            &ldquo;Every gift tells a story. We help you tell it beautifully.&rdquo;
          </blockquote>
          <p className={styles.body}>{brand.description}</p>
        </motion.div>
      </div>
    </section>
  );
}
