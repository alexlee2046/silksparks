import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmallScreen,
  useIsTouchDevice,
  usePrefersReducedMotion,
  useBreakpoint,
} from "@/hooks/useMediaQuery";

describe("useMediaQuery", () => {
  let originalMatchMedia: typeof window.matchMedia;
  let listeners: Map<string, ((e: MediaQueryListEvent) => void)[]>;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    listeners = new Map();

    // Create mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => {
        if (!listeners.has(query)) {
          listeners.set(query, []);
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
            if (event === "change") {
              listeners.get(query)?.push(handler);
            }
          }),
          removeEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
            if (event === "change") {
              const handlers = listeners.get(query);
              if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) handlers.splice(index, 1);
              }
            }
          }),
          dispatchEvent: vi.fn(),
        };
      }),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
    listeners.clear();
  });

  describe("useMediaQuery hook", () => {
    it("should return false when query does not match", () => {
      const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
      expect(result.current).toBe(false);
    });

    it("should return true when query matches", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
      expect(result.current).toBe(true);
    });

    it("should update when media query changes", () => {
      let currentMatches = false;
      let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          get matches() {
            return currentMatches;
          },
          media: query,
          addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
            if (event === "change") changeHandler = handler;
          }),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        currentMatches = true;
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      expect(result.current).toBe(true);
    });

    it("should clean up listener on unmount", () => {
      const removeEventListener = vi.fn();

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener,
        })),
      });

      const { unmount } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
      unmount();

      expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("should update when query changes", () => {
      const { result, rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: "(min-width: 768px)" } }
      );

      expect(result.current).toBe(false);

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(min-width: 640px)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      rerender({ query: "(min-width: 640px)" });
      expect(result.current).toBe(true);
    });
  });

  describe("useIsMobile", () => {
    it("should return true for mobile width", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(max-width: 767px)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it("should return false for desktop width", () => {
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe("useIsTablet", () => {
    it("should return true for tablet width", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes("768px") && query.includes("1023px"),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });
  });

  describe("useIsDesktop", () => {
    it("should return true for desktop width", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(min-width: 1024px)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });
  });

  describe("useIsSmallScreen", () => {
    it("should return true for small screen", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(max-width: 639px)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useIsSmallScreen());
      expect(result.current).toBe(true);
    });
  });

  describe("useIsTouchDevice", () => {
    it("should return true when ontouchstart is available", () => {
      Object.defineProperty(window, "ontouchstart", {
        value: {},
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);

      // Clean up
      delete (window as { ontouchstart?: unknown }).ontouchstart;
    });

    it("should return true when maxTouchPoints > 0", () => {
      const originalNavigator = window.navigator;
      Object.defineProperty(window, "navigator", {
        value: { ...originalNavigator, maxTouchPoints: 5 },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);

      // Restore
      Object.defineProperty(window, "navigator", {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it("should return false for non-touch device", () => {
      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(false);
    });
  });

  describe("usePrefersReducedMotion", () => {
    it("should return true when reduced motion is preferred", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(true);
    });

    it("should return false when reduced motion is not preferred", () => {
      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);
    });
  });

  describe("useBreakpoint", () => {
    it('should return "xl" for extra large screens', () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes("1280px") || query.includes("1024px") || query.includes("768px") || query.includes("640px"),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("xl");
    });

    it('should return "xs" for extra small screens', () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("xs");
    });

    it('should return "md" for medium screens', () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes("768px") || query.includes("640px"),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("md");
    });
  });
});
