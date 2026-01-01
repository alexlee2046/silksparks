import { useMemo } from "react";
import { usePrefersReducedMotion } from "./useMediaQuery";
import { usePerformance } from "../context/PerformanceContext";

/**
 * Animation configuration hook that respects:
 * - User's prefers-reduced-motion setting
 * - Device performance level
 */
export function useAnimationConfig() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { qualityLevel } = usePerformance();

  return useMemo(() => {
    const shouldReduceMotion =
      prefersReducedMotion ||
      qualityLevel === "low" ||
      qualityLevel === "off";

    return {
      shouldReduceMotion,
      // Transition durations
      duration: {
        fast: shouldReduceMotion ? 0 : 0.15,
        normal: shouldReduceMotion ? 0 : 0.3,
        slow: shouldReduceMotion ? 0 : 0.5,
      },
      // Spring configs
      spring: shouldReduceMotion
        ? { type: "tween" as const, duration: 0 }
        : { type: "spring" as const, stiffness: 200, damping: 20 },
      // Common animation variants
      variants: {
        fadeIn: shouldReduceMotion
          ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
          : { initial: { opacity: 0 }, animate: { opacity: 1 } },
        slideUp: shouldReduceMotion
          ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
          : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
        slideIn: shouldReduceMotion
          ? { initial: { opacity: 1, x: 0 }, animate: { opacity: 1, x: 0 } }
          : { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
        scale: shouldReduceMotion
          ? { initial: { scale: 1 }, animate: { scale: 1 } }
          : { initial: { scale: 0.95 }, animate: { scale: 1 } },
      },
      // Hover/tap animations (for Framer Motion)
      hover: shouldReduceMotion ? {} : { scale: 1.02 },
      tap: shouldReduceMotion ? {} : { scale: 0.98 },
    };
  }, [prefersReducedMotion, qualityLevel]);
}

/**
 * Simple hook for components that just need to know if animations are enabled
 */
export function useAnimationsEnabled(): boolean {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { qualityLevel } = usePerformance();

  return useMemo(() => {
    return (
      !prefersReducedMotion &&
      qualityLevel !== "low" &&
      qualityLevel !== "off"
    );
  }, [prefersReducedMotion, qualityLevel]);
}
