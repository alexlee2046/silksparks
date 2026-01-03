import { describe, it, expect } from "vitest";
import {
  PATHS,
  getRouteMetadata,
  extractIdFromPath,
  matchPath,
} from "@/lib/paths";

describe("paths", () => {
  describe("PATHS constants", () => {
    describe("public pages", () => {
      it("should have HOME path", () => {
        expect(PATHS.HOME).toBe("/");
      });

      it("should have HOROSCOPE path", () => {
        expect(PATHS.HOROSCOPE).toBe("/horoscope");
      });

      it("should have HOROSCOPE_REPORT path", () => {
        expect(PATHS.HOROSCOPE_REPORT).toBe("/horoscope/report");
      });

      it("should have TAROT path", () => {
        expect(PATHS.TAROT).toBe("/tarot");
      });

      it("should have TAROT_SPREAD path", () => {
        expect(PATHS.TAROT_SPREAD).toBe("/tarot/spread");
      });
    });

    describe("shop pages", () => {
      it("should have SHOP path", () => {
        expect(PATHS.SHOP).toBe("/shop");
      });

      it("should generate PRODUCT path with string id", () => {
        expect(PATHS.PRODUCT("abc123")).toBe("/shop/abc123");
      });

      it("should generate PRODUCT path with numeric id", () => {
        expect(PATHS.PRODUCT(42)).toBe("/shop/42");
      });
    });

    describe("expert pages", () => {
      it("should have EXPERTS path", () => {
        expect(PATHS.EXPERTS).toBe("/experts");
      });

      it("should generate EXPERT path with string id", () => {
        expect(PATHS.EXPERT("expert1")).toBe("/experts/expert1");
      });

      it("should generate EXPERT path with numeric id", () => {
        expect(PATHS.EXPERT(5)).toBe("/experts/5");
      });

      it("should have BOOKING path", () => {
        expect(PATHS.BOOKING).toBe("/booking");
      });

      it("should have BOOKING_INTAKE path", () => {
        expect(PATHS.BOOKING_INTAKE).toBe("/booking/intake");
      });

      it("should have BOOKING_DELIVERY path", () => {
        expect(PATHS.BOOKING_DELIVERY).toBe("/booking/delivery");
      });
    });

    describe("dashboard pages", () => {
      it("should have DASHBOARD path", () => {
        expect(PATHS.DASHBOARD).toBe("/dashboard");
      });

      it("should have DASHBOARD_ARCHIVES path", () => {
        expect(PATHS.DASHBOARD_ARCHIVES).toBe("/dashboard/archives");
      });

      it("should have DASHBOARD_ORDERS path", () => {
        expect(PATHS.DASHBOARD_ORDERS).toBe("/dashboard/orders");
      });

      it("should have DASHBOARD_CONSULTATIONS path", () => {
        expect(PATHS.DASHBOARD_CONSULTATIONS).toBe("/dashboard/consultations");
      });

      it("should have DASHBOARD_SETTINGS path", () => {
        expect(PATHS.DASHBOARD_SETTINGS).toBe("/dashboard/settings");
      });

      it("should have DASHBOARD_FAVORITES path", () => {
        expect(PATHS.DASHBOARD_FAVORITES).toBe("/dashboard/favorites");
      });
    });

    describe("manage pages (legacy)", () => {
      it("should have MANAGE_PAYMENTS path", () => {
        expect(PATHS.MANAGE_PAYMENTS).toBe("/manage/payments");
      });

      it("should have MANAGE_CURRENCY path", () => {
        expect(PATHS.MANAGE_CURRENCY).toBe("/manage/currency");
      });

      it("should have MANAGE_SHIPPING path", () => {
        expect(PATHS.MANAGE_SHIPPING).toBe("/manage/shipping");
      });

      it("should have MANAGE_SETTINGS path", () => {
        expect(PATHS.MANAGE_SETTINGS).toBe("/manage/settings");
      });
    });

    describe("admin pages", () => {
      it("should have ADMIN path", () => {
        expect(PATHS.ADMIN).toBe("/admin");
      });
    });
  });

  describe("getRouteMetadata", () => {
    describe("public routes", () => {
      it("should return public layout for home page", () => {
        const metadata = getRouteMetadata("/");
        expect(metadata.layoutType).toBe("public");
        expect(metadata.requiresAuth).toBe(false);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return public layout for horoscope page", () => {
        const metadata = getRouteMetadata("/horoscope");
        expect(metadata.layoutType).toBe("public");
        expect(metadata.requiresAuth).toBe(false);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return public layout for tarot page", () => {
        const metadata = getRouteMetadata("/tarot");
        expect(metadata.layoutType).toBe("public");
        expect(metadata.requiresAuth).toBe(false);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return public layout for shop page", () => {
        const metadata = getRouteMetadata("/shop");
        expect(metadata.layoutType).toBe("public");
        expect(metadata.requiresAuth).toBe(false);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return public layout for experts page", () => {
        const metadata = getRouteMetadata("/experts");
        expect(metadata.layoutType).toBe("public");
        expect(metadata.requiresAuth).toBe(false);
        expect(metadata.requiresAdmin).toBe(false);
      });
    });

    describe("user routes", () => {
      it("should return user layout for dashboard", () => {
        const metadata = getRouteMetadata("/dashboard");
        expect(metadata.layoutType).toBe("user");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return user layout for dashboard/archives", () => {
        const metadata = getRouteMetadata("/dashboard/archives");
        expect(metadata.layoutType).toBe("user");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return user layout for dashboard/orders", () => {
        const metadata = getRouteMetadata("/dashboard/orders");
        expect(metadata.layoutType).toBe("user");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return user layout for dashboard/consultations", () => {
        const metadata = getRouteMetadata("/dashboard/consultations");
        expect(metadata.layoutType).toBe("user");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return user layout for dashboard/settings", () => {
        const metadata = getRouteMetadata("/dashboard/settings");
        expect(metadata.layoutType).toBe("user");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(false);
      });

      it("should return user layout for dashboard/favorites", () => {
        const metadata = getRouteMetadata("/dashboard/favorites");
        expect(metadata.layoutType).toBe("user");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(false);
      });
    });

    describe("admin routes", () => {
      it("should return admin layout for /admin", () => {
        const metadata = getRouteMetadata("/admin");
        expect(metadata.layoutType).toBe("admin");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(true);
      });

      it("should return admin layout for admin subpages", () => {
        const metadata = getRouteMetadata("/admin/users");
        expect(metadata.layoutType).toBe("admin");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(true);
      });

      it("should return admin layout for manage pages", () => {
        const metadata = getRouteMetadata("/manage/payments");
        expect(metadata.layoutType).toBe("admin");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(true);
      });

      it("should return admin layout for manage/currency", () => {
        const metadata = getRouteMetadata("/manage/currency");
        expect(metadata.layoutType).toBe("admin");
        expect(metadata.requiresAuth).toBe(true);
        expect(metadata.requiresAdmin).toBe(true);
      });
    });
  });

  describe("extractIdFromPath", () => {
    it("should extract ID from shop product path", () => {
      const id = extractIdFromPath("/shop/abc123", "/shop/:id");
      expect(id).toBe("abc123");
    });

    it("should extract ID from expert path", () => {
      const id = extractIdFromPath("/experts/42", "/experts/:id");
      expect(id).toBe("42");
    });

    it("should extract ID with UUID format", () => {
      const id = extractIdFromPath(
        "/shop/550e8400-e29b-41d4-a716-446655440000",
        "/shop/:id"
      );
      expect(id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should return null for non-matching path", () => {
      const id = extractIdFromPath("/shop", "/shop/:id");
      expect(id).toBeNull();
    });

    it("should return null for completely different path", () => {
      const id = extractIdFromPath("/horoscope", "/shop/:id");
      expect(id).toBeNull();
    });

    it("should handle nested paths", () => {
      const id = extractIdFromPath("/users/123/posts", "/users/:id/posts");
      expect(id).toBe("123");
    });
  });

  describe("matchPath", () => {
    it("should match exact path", () => {
      expect(matchPath("/shop", "/shop")).toBe(true);
    });

    it("should match path with param", () => {
      expect(matchPath("/shop/abc123", "/shop/:id")).toBe(true);
    });

    it("should match expert path with param", () => {
      expect(matchPath("/experts/42", "/experts/:id")).toBe(true);
    });

    it("should not match different base path", () => {
      expect(matchPath("/horoscope", "/shop/:id")).toBe(false);
    });

    it("should not match shorter path", () => {
      expect(matchPath("/shop", "/shop/:id")).toBe(false);
    });

    it("should not match longer path", () => {
      expect(matchPath("/shop/abc/extra", "/shop/:id")).toBe(false);
    });

    it("should match path with multiple params", () => {
      expect(matchPath("/users/123/posts/456", "/users/:userId/posts/:postId")).toBe(
        true
      );
    });

    it("should match root path", () => {
      expect(matchPath("/", "/")).toBe(true);
    });

    it("should not match root against non-root pattern", () => {
      expect(matchPath("/", "/shop")).toBe(false);
    });
  });
});
