'use client';

import { motion } from 'framer-motion';
import { fadeUp, revealViewport } from '@/lib/motion';

/**
 * Generic scroll-reveal wrapper: fades + lifts its children in once, the
 * first time they enter the viewport. Used to apply the entrance-motion
 * system to whole sections without editing each section's internals -
 * see DESIGN_SYSTEM.md, Motion System category 2 (entrance/scroll reveals).
 */
export default function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}
