import type { Variants, Transition } from "framer-motion";

// ============ 3 Transition Rhythms ============

export const transitions = {
  /** Pages, cards, content sections */
  smooth: {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,

  /** Buttons, micro-interactions, toggles */
  snappy: {
    duration: 0.3,
    ease: "easeOut",
  } as Transition,

  /** Card reveal, report generation, save — high-impact moments */
  ritual: {
    type: "spring",
    stiffness: 80,
    damping: 12,
    mass: 1,
  } as Transition,
};

// ============ Regular Variants ============

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.smooth },
  } as Variants,

  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: transitions.smooth },
  } as Variants,

  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  } as Variants,

  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.smooth,
    },
  } as Variants,
};

// ============ Ritual Variants ============

export const rituals = {
  /** Tarot card reveal: float up -> flip -> halo -> settle */
  cardReveal: {
    hidden: { opacity: 0, y: 40, scale: 0.9, rotateY: 180 },
    float: { opacity: 1, y: -20, scale: 1.05, rotateY: 180, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    flip: { opacity: 1, y: 0, scale: 1.1, rotateY: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    settle: { opacity: 1, y: 0, scale: 1, rotateY: 0, transition: transitions.ritual },
  } as Variants,

  /** Report generation: pulse -> expand -> content appear */
  generate: {
    hidden: { opacity: 0, scale: 0.8 },
    pulse: { opacity: 1, scale: [1, 1.05, 1], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
    expand: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    visible: { opacity: 1, scale: 1 },
  } as Variants,

  /** Save to grimoire: shrink -> fly -> feedback */
  save: {
    idle: { opacity: 1, scale: 1, x: 0, y: 0 },
    shrink: { opacity: 0.8, scale: 0.6, transition: { duration: 0.3 } },
    fly: { opacity: 0, scale: 0.3, x: 0, y: -200, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  } as Variants,
};

// ============ Page Transition ============

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

// ============ Reduced Motion Support ============

/**
 * Returns a copy of the given variants with all motion stripped,
 * keeping only opacity: 1 for both hidden and visible states.
 */
export function getReducedMotionVariants(v: Variants): Variants {
  const result: Variants = {};
  for (const key of Object.keys(v)) {
    result[key] = { opacity: 1 };
  }
  return result;
}
