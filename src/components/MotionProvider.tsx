'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Wraps the app once so every framer-motion animation in the tree honors
 * `prefers-reduced-motion` automatically (reducedMotion="user" reads the OS
 * setting live) instead of each component re-checking it individually. CSS
 * transitions/keyframes still get their own `@media (prefers-reduced-motion)`
 * block in globals.css - this only covers framer-motion-driven animation.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
