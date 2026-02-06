import { describe, it, expect } from "vitest";
import {
  transitions,
  variants,
  rituals,
  pageTransition,
  getReducedMotionVariants,
} from "../../../lib/animations";

describe("animations", () => {
  describe("transitions", () => {
    it("has smooth, snappy, and ritual presets", () => {
      expect(transitions.smooth).toBeDefined();
      expect(transitions.smooth.duration).toBe(0.5);
      expect(transitions.snappy).toBeDefined();
      expect(transitions.snappy.duration).toBe(0.3);
      expect(transitions.ritual).toBeDefined();
      expect(transitions.ritual.type).toBe("spring");
    });
  });

  describe("variants", () => {
    it("has fadeIn, slideUp, stagger presets", () => {
      expect(variants.fadeIn.hidden).toHaveProperty("opacity", 0);
      expect(variants.fadeIn.visible).toHaveProperty("opacity", 1);
      expect(variants.slideUp.hidden).toHaveProperty("y", 20);
      expect(variants.stagger.visible.transition).toHaveProperty("staggerChildren");
    });
  });

  describe("rituals", () => {
    it("has cardReveal, generate, save presets", () => {
      expect(rituals.cardReveal).toBeDefined();
      expect(rituals.generate).toBeDefined();
      expect(rituals.save).toBeDefined();
    });
  });

  describe("pageTransition", () => {
    it("has initial, animate, exit states", () => {
      expect(pageTransition.initial).toHaveProperty("opacity", 0);
      expect(pageTransition.animate).toHaveProperty("opacity", 1);
      expect(pageTransition.exit).toHaveProperty("opacity", 0);
    });
  });

  describe("getReducedMotionVariants", () => {
    it("returns static variants for reduced motion", () => {
      const reduced = getReducedMotionVariants(variants.slideUp);
      expect(reduced.hidden).toHaveProperty("opacity", 1);
      expect(reduced.hidden).not.toHaveProperty("y");
      expect(reduced.visible).toHaveProperty("opacity", 1);
    });
  });
});
