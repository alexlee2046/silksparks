import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppNavigate, useScreenNavigation } from "@/hooks/useAppNavigate";
import { MemoryRouter } from "react-router-dom";
import { Screen } from "@/types";
import React from "react";

// Mock routes module
vi.mock("@/routes", () => ({
  getPathForScreen: vi.fn((screen: Screen, params?: Record<string, string>) => {
    const paths: Record<Screen, string> = {
      [Screen.HOME]: "/",
      [Screen.BIRTH_CHART]: "/birth-chart",
      [Screen.REPORT]: "/report",
      [Screen.TAROT_DAILY]: "/tarot/daily",
      [Screen.TAROT_SPREAD]: "/tarot/spread",
      [Screen.SHOP_LIST]: "/shop",
      [Screen.PRODUCT_DETAIL]: params?.id ? `/shop/product/${params.id}` : "/shop/product",
      [Screen.EXPERTS]: "/experts",
      [Screen.EXPERT_PROFILE]: params?.id ? `/experts/${params.id}` : "/experts/profile",
      [Screen.BOOKING]: "/booking",
      [Screen.INTAKE]: "/intake",
      [Screen.DELIVERY]: "/delivery",
      [Screen.USER_DASHBOARD]: "/user",
      [Screen.ARCHIVES]: "/user/archives",
      [Screen.ORDERS]: "/user/orders",
      [Screen.CONSULTATIONS]: "/user/consultations",
      [Screen.SETTINGS]: "/user/settings",
      [Screen.ADMIN_PAYMENTS]: "/admin/payments",
      [Screen.ADMIN_CURRENCY]: "/admin/currency",
      [Screen.ADMIN_SHIPPING]: "/admin/shipping",
      [Screen.ADMIN_SETTINGS]: "/admin/settings",
    };
    return paths[screen] || "/";
  }),
  getScreenForPath: vi.fn((path: string) => {
    const screenMap: Record<string, Screen> = {
      "/": Screen.HOME,
      "/birth-chart": Screen.BIRTH_CHART,
      "/tarot/daily": Screen.TAROT_DAILY,
      "/shop": Screen.SHOP_LIST,
      "/user": Screen.USER_DASHBOARD,
    };
    return screenMap[path] || Screen.HOME;
  }),
  getRouteConfig: vi.fn(() => ({
    layoutType: "public",
  })),
}));

// Mock window.scrollTo
vi.stubGlobal("scrollTo", vi.fn());

function createWrapper(initialRoute = "/") {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>;
  };
}

describe("useAppNavigate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should return navigation utilities", () => {
      const { result } = renderHook(() => useAppNavigate(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("navigateTo");
      expect(result.current).toHaveProperty("currentScreen");
      expect(result.current).toHaveProperty("params");
      expect(result.current).toHaveProperty("layoutType");
      expect(result.current).toHaveProperty("goBack");
      expect(result.current).toHaveProperty("replaceTo");
    });

    it("should return current screen based on path", () => {
      const { result } = renderHook(() => useAppNavigate(), {
        wrapper: createWrapper("/"),
      });

      expect(result.current.currentScreen).toBe(Screen.HOME);
    });

    it("should return layout type", () => {
      const { result } = renderHook(() => useAppNavigate(), {
        wrapper: createWrapper(),
      });

      expect(result.current.layoutType).toBe("public");
    });
  });

  describe("navigateTo", () => {
    it("should navigate to a screen", () => {
      const { result } = renderHook(() => useAppNavigate(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.navigateTo(Screen.BIRTH_CHART);
      });

      // Should scroll to top
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    });

    it("should navigate with params", () => {
      const { result } = renderHook(() => useAppNavigate(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.navigateTo(Screen.PRODUCT_DETAIL, { id: "123" });
      });

      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  describe("replaceTo", () => {
    it("should replace current route", () => {
      const { result } = renderHook(() => useAppNavigate(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.replaceTo(Screen.SHOP_LIST);
      });

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    });
  });

  describe("goBack", () => {
    it("should navigate back", () => {
      const { result } = renderHook(() => useAppNavigate(), {
        wrapper: createWrapper(),
      });

      // First navigate somewhere
      act(() => {
        result.current.navigateTo(Screen.SHOP_LIST);
      });

      // Then go back
      act(() => {
        result.current.goBack();
      });

      // Should not throw
      expect(result.current.currentScreen).toBeDefined();
    });
  });
});

describe("useScreenNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return setScreen and currentScreen", () => {
    const { result } = renderHook(() => useScreenNavigation(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("setScreen");
    expect(result.current).toHaveProperty("currentScreen");
  });

  it("should set screen via setScreen", () => {
    const { result } = renderHook(() => useScreenNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setScreen(Screen.BIRTH_CHART);
    });

    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("should return current screen", () => {
    const { result } = renderHook(() => useScreenNavigation(), {
      wrapper: createWrapper("/"),
    });

    expect(result.current.currentScreen).toBe(Screen.HOME);
  });
});
