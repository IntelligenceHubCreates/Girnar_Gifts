import type { Variants, Transition } from 'framer-motion';

/**
 * Shared framer-motion building blocks for the Girnar redesign's entrance /
 * scroll-reveal system (DESIGN_SYSTEM.md - Motion System, category 2).
 * Mirrors the CSS duration/easing tokens in design-tokens.css so JS-driven
 * and CSS-driven motion feel like one system rather than two.
 *
 *   --gg-duration-base:       250ms   -> DURATION.base
 *   --gg-duration-expressive: 400ms   -> DURATION.expressive
 *   --gg-ease-out: cubic-bezier(0.16,1,0.3,1) -> EASE.out
 *
 * Reduced motion is handled globally by <MotionConfig reducedMotion="user">
 * in MotionProvider.tsx - components using these variants don't need to
 * check usePrefersReducedMotion() themselves.
 */

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  expressive: 0.4,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  spring: [0.34, 1.56, 0.64, 1],
} as const;

/** Standard viewport config for scroll-triggered reveals: animate once, slightly before entering view. */
export const revealViewport = { once: true, margin: '-80px' } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.expressive, ease: EASE.out } as Transition,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATION.expressive, ease: EASE.out } as Transition,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.expressive, ease: EASE.out } as Transition,
  },
};

/** Wrap a list of children with this to stagger their `fadeUp`/`fadeIn` entrance. */
export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
});
