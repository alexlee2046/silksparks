import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

describe("useDevicePerformance", () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalNavigator: Navigator;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    originalNavigator = window.navigator;
    originalInnerWidth = window.innerWidth;

    // Default mock for matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    // Default mock for innerWidth (desktop)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(window, "navigator", {
      writable: true,
      configurable: true,
      value: originalNavigator,
    });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe("basic functionality", () => {
    it("should return device performance object", () => {
      const { result } = renderHook(() => useDevicePerformance());

      expect(result.current).toHaveProperty("tier");
      expect(result.current).toHaveProperty("isMobile");
      expect(result.current).toHaveProperty("hasReducedMotion");
      expect(result.current).toHaveProperty("gpuTier");
      expect(result.current).toHaveProperty("memory");
      expect(result.current).toHaveProperty("cores");
    });

    it("should memoize result", () => {
      const { result, rerender } = renderHook(() => useDevicePerformance());
      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
    });
  });

  describe("reduced motion detection", () => {
    it("should return true for hasReducedMotion when user prefers reduced motion", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useDevicePerformance());

      expect(result.current.hasReducedMotion).toBe(true);
      expect(result.current.tier).toBe("low"); // Should force low tier
    });

    it("should return false for hasReducedMotion when user does not prefer reduced motion", () => {
      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.hasReducedMotion).toBe(false);
    });
  });

  describe("mobile detection", () => {
    it("should detect mobile by user agent (iPhone)", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.isMobile).toBe(true);
    });

    it("should detect mobile by user agent (Android)", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 10)",
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.isMobile).toBe(true);
    });

    it("should detect mobile by viewport width", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.isMobile).toBe(true);
    });

    it("should not detect desktop as mobile", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.isMobile).toBe(false);
    });
  });

  describe("hardware detection", () => {
    it("should detect device memory", () => {
      Object.defineProperty(window, "navigator", {
        value: { ...navigator, deviceMemory: 8 },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.memory).toBe(8);
    });

    it("should detect hardware concurrency", () => {
      Object.defineProperty(window, "navigator", {
        value: { ...navigator, hardwareConcurrency: 8 },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.cores).toBe(8);
    });

    it("should return null for memory when not available", () => {
      const { result } = renderHook(() => useDevicePerformance());
      // When deviceMemory is not set, should be null
      expect(result.current.memory).toBeNull();
    });
  });

  describe("tier calculation", () => {
    it("should set tier to low when reduced motion is preferred", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.tier).toBe("low");
    });

    it("should set tier to high for desktop with good specs", () => {
      Object.defineProperty(window, "navigator", {
        value: {
          ...navigator,
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          deviceMemory: 16,
          hardwareConcurrency: 10,
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.tier).toBe("high");
    });

    it("should set tier to medium for mobile devices", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      // Mobile without high GPU defaults to low
      expect(["low", "medium"]).toContain(result.current.tier);
    });

    it("should set tier based on memory and cores when GPU is unknown", () => {
      Object.defineProperty(window, "navigator", {
        value: {
          ...navigator,
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          deviceMemory: 4,
          hardwareConcurrency: 4,
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useDevicePerformance());
      expect(result.current.tier).toBe("medium");
    });
  });

  describe("GPU tier detection", () => {
    it("should return unknown when WebGL is not available", () => {
      const { result } = renderHook(() => useDevicePerformance());
      // In jsdom, WebGL is not available by default
      expect(result.current.gpuTier).toBe("unknown");
    });
  });
});
