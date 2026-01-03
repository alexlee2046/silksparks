import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

// Test component
function TestConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button data-testid="set-light" onClick={() => setTheme("light")}>Light</button>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>Dark</button>
      <button data-testid="set-system" onClick={() => setTheme("system")}>System</button>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe("ThemeContext", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");

    // Save original matchMedia
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    // Restore original matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
  });

  describe("ThemeProvider", () => {
    it("should render children", () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("should default to dark theme", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    });

    it("should load theme from localStorage", () => {
      localStorage.setItem("silk-spark-theme", "light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    it("should apply dark class to document element", () => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should remove dark class for light theme", () => {
      localStorage.setItem("silk-spark-theme", "light");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should handle invalid localStorage value", () => {
      localStorage.setItem("silk-spark-theme", "invalid");

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });
  });

  describe("setTheme", () => {
    it("should set theme to light", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-light"));

      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    it("should set theme to dark", async () => {
      localStorage.setItem("silk-spark-theme", "light");
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-dark"));

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    });

    it("should set theme to system", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-system"));

      expect(screen.getByTestId("theme")).toHaveTextContent("system");
      // System defaults to dark in our mock
      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    });

    it("should persist theme to localStorage", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-light"));

      expect(localStorage.getItem("silk-spark-theme")).toBe("light");
    });
  });

  describe("toggleTheme", () => {
    it("should toggle from dark to light", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");

      await user.click(screen.getByTestId("toggle"));

      expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    });

    it("should toggle from light to dark", async () => {
      localStorage.setItem("silk-spark-theme", "light");
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId("resolved")).toHaveTextContent("light");

      await user.click(screen.getByTestId("toggle"));

      expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    });
  });

  describe("system theme", () => {
    it("should resolve system theme based on prefers-color-scheme", async () => {
      const user = userEvent.setup();

      // Mock prefers dark
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-system"));

      await waitFor(() => {
        expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
      });
    });

    it("should resolve to light when system prefers light", async () => {
      const user = userEvent.setup();

      // Mock prefers light
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false, // prefers-color-scheme: dark = false means light
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-system"));

      await waitFor(() => {
        expect(screen.getByTestId("resolved")).toHaveTextContent("light");
      });
    });
  });

  describe("useTheme hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useTheme must be used within a ThemeProvider");

      consoleSpy.mockRestore();
    });
  });
});
