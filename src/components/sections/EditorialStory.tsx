'use client';

import { motion } from 'framer-motion';
import { brand } from '@/config/brand';
import { scaleIn, fadeUp, revealViewport } from '@/lib/motion';
import styles from './EditorialStory.module.css';

export default function EditorialStory() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <motion.div
          className={styles.visual}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={scaleIn}
        >
          <div className={styles.visualGlow} aria-hidden="true" />
          <span className={styles.visualEmoji} aria-hidden="true">🎁</span>
        </motion.div>

        <motion.div
          className={styles.copy}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={fadeUp}
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
