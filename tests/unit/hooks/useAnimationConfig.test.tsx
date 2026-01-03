import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnimationConfig, useAnimationsEnabled } from "@/hooks/useAnimationConfig";
import { PerformanceProvider } from "@/context/PerformanceContext";
import React from "react";

// Mock useDevicePerformance
vi.mock("@/hooks/useDevicePerformance", () => ({
  useDevicePerformance: vi.fn(() => ({
    tier: "high",
    isMobile: false,
    hasReducedMotion: false,
    gpuTier: "high",
    memory: 16,
    cores: 8,
  })),
}));

// Mock usePrefersReducedMotion
const mockPrefersReducedMotion = vi.fn(() => false);
vi.mock("@/hooks/useMediaQuery", () => ({
  usePrefersReducedMotion: () => mockPrefersReducedMotion(),
}));

// Wrapper with PerformanceProvider
function createWrapper(qualityLevel: "high" | "medium" | "low" | "off" = "high") {
  // Mock localStorage to set initial quality
  localStorage.setItem("silk-spark-quality", qualityLevel);

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <PerformanceProvider>{children}</PerformanceProvider>;
  };
}

describe("useAnimationConfig", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPrefersReducedMotion.mockReturnValue(false);
  });

  describe("with animations enabled", () => {
    it("should return animation configuration object", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current).toHaveProperty("shouldReduceMotion");
      expect(result.current).toHaveProperty("duration");
      expect(result.current).toHaveProperty("spring");
      expect(result.current).toHaveProperty("variants");
      expect(result.current).toHaveProperty("hover");
      expect(result.current).toHaveProperty("tap");
    });

    it("should return shouldReduceMotion as false for high quality", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.shouldReduceMotion).toBe(false);
    });

    it("should return correct durations when animations enabled", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.duration.fast).toBe(0.15);
      expect(result.current.duration.normal).toBe(0.3);
      expect(result.current.duration.slow).toBe(0.5);
    });

    it("should return spring configuration when animations enabled", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.spring.type).toBe("spring");
      expect(result.current.spring).toHaveProperty("stiffness");
      expect(result.current.spring).toHaveProperty("damping");
    });

    it("should return animation variants for fadeIn", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.variants.fadeIn.initial).toEqual({ opacity: 0 });
      expect(result.current.variants.fadeIn.animate).toEqual({ opacity: 1 });
    });

    it("should return animation variants for slideUp", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.variants.slideUp.initial).toEqual({ opacity: 0, y: 20 });
      expect(result.current.variants.slideUp.animate).toEqual({ opacity: 1, y: 0 });
    });

    it("should return hover and tap animations", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.hover).toEqual({ scale: 1.02 });
      expect(result.current.tap).toEqual({ scale: 0.98 });
    });
  });

  describe("with reduced motion preference", () => {
    it("should reduce motion when user prefers reduced motion", () => {
      mockPrefersReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.shouldReduceMotion).toBe(true);
      expect(result.current.duration.fast).toBe(0);
      expect(result.current.duration.normal).toBe(0);
      expect(result.current.duration.slow).toBe(0);
    });

    it("should disable spring animations when reduced motion", () => {
      mockPrefersReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.spring.type).toBe("tween");
      expect(result.current.spring).toHaveProperty("duration", 0);
    });

    it("should return static variants when reduced motion", () => {
      mockPrefersReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.variants.fadeIn.initial).toEqual({ opacity: 1 });
      expect(result.current.variants.fadeIn.animate).toEqual({ opacity: 1 });
    });

    it("should disable hover/tap when reduced motion", () => {
      mockPrefersReducedMotion.mockReturnValue(true);

      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("high"),
      });

      expect(result.current.hover).toEqual({});
      expect(result.current.tap).toEqual({});
    });
  });

  describe("with low quality level", () => {
    it("should reduce motion when quality is low", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("low"),
      });

      expect(result.current.shouldReduceMotion).toBe(true);
    });

    it("should reduce motion when quality is off", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("off"),
      });

      expect(result.current.shouldReduceMotion).toBe(true);
    });

    it("should not reduce motion when quality is medium", () => {
      const { result } = renderHook(() => useAnimationConfig(), {
        wrapper: createWrapper("medium"),
      });

      expect(result.current.shouldReduceMotion).toBe(false);
    });
  });
});

describe("useAnimationsEnabled", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPrefersReducedMotion.mockReturnValue(false);
  });

  it("should return true when animations are enabled", () => {
    const { result } = renderHook(() => useAnimationsEnabled(), {
      wrapper: createWrapper("high"),
    });

    expect(result.current).toBe(true);
  });

  it("should return false when reduced motion is preferred", () => {
    mockPrefersReducedMotion.mockReturnValue(true);

    const { result } = renderHook(() => useAnimationsEnabled(), {
      wrapper: createWrapper("high"),
    });

    expect(result.current).toBe(false);
  });

  it("should return false when quality is low", () => {
    const { result } = renderHook(() => useAnimationsEnabled(), {
      wrapper: createWrapper("low"),
    });

    expect(result.current).toBe(false);
  });

  it("should return false when quality is off", () => {
    const { result } = renderHook(() => useAnimationsEnabled(), {
      wrapper: createWrapper("off"),
    });

    expect(result.current).toBe(false);
  });

  it("should return true when quality is medium", () => {
    const { result } = renderHook(() => useAnimationsEnabled(), {
      wrapper: createWrapper("medium"),
    });

    expect(result.current).toBe(true);
  });
});
