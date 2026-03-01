import type { Transition, Variants } from 'framer-motion'

// ── Spring presets ──────────────────────────────────────────────
// Apple-style: high stiffness (snappy), high damping (no ringing), low mass

/** Default — snappy with a hint of overshoot */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }

/** Softer — for larger/page-level motion */
export const springGentle: Transition = { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }

/** Extra-snappy — for micro-interactions (chevron rotation, toggle) */
export const springSnappy: Transition = { type: 'spring', stiffness: 500, damping: 32, mass: 0.7 }

// ── Reusable variants ──────────────────────────────────────────

/** Fade + 12px slide-up entrance */
export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

/** Stagger container — apply to parent, children use staggerItem */
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.04 } },
}

/** Stagger child item — pairs with staggerContainer */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

/** Scale spring — for hover/press effects */
export const scaleSpring: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  press: { scale: 0.97 },
}
