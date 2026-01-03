import { describe, it, expect } from "vitest";
import { Layout, Header, Footer, NotificationsDropdown } from "@/components/Layouts";
import type { LayoutProps } from "@/components/Layouts";

/**
 * Layouts.tsx is a re-export module that aggregates layout components.
 * These tests verify that all exports are properly available.
 */
describe("Layouts re-exports", () => {
  describe("component exports", () => {
    it("should export Layout component", () => {
      expect(Layout).toBeDefined();
      expect(typeof Layout).toBe("function");
    });

    it("should export Header component", () => {
      expect(Header).toBeDefined();
      expect(typeof Header).toBe("function");
    });

    it("should export Footer component", () => {
      expect(Footer).toBeDefined();
      expect(typeof Footer).toBe("function");
    });

    it("should export NotificationsDropdown component", () => {
      expect(NotificationsDropdown).toBeDefined();
      expect(typeof NotificationsDropdown).toBe("function");
    });
  });

  describe("type exports", () => {
    it("should allow LayoutProps type usage", () => {
      // TypeScript compilation test - if this compiles, the type is exported correctly
      const testProps: LayoutProps = {
        children: null,
      };
      expect(testProps).toBeDefined();
    });

    it("should accept optional LayoutProps properties", () => {
      const testProps: LayoutProps = {
        children: "Test content",
        className: "test-class",
      };
      expect(testProps.children).toBe("Test content");
      expect(testProps.className).toBe("test-class");
    });
  });

  describe("module structure", () => {
    it("should have all four main layout components", () => {
      const exports = { Layout, Header, Footer, NotificationsDropdown };
      expect(Object.keys(exports).length).toBe(4);
    });

    it("should not export undefined values", () => {
      expect(Layout).not.toBeUndefined();
      expect(Header).not.toBeUndefined();
      expect(Footer).not.toBeUndefined();
      expect(NotificationsDropdown).not.toBeUndefined();
    });
  });
});
