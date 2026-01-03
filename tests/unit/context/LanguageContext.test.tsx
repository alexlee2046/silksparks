import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage, LOCALES, BASE_LOCALE, LOCALE_NAMES } from "@/context/LanguageContext";

// Mock paraglide runtime
vi.mock("@/src/paraglide/runtime.js", () => ({
  setLocale: vi.fn(),
  getLocale: vi.fn(() => "en"),
}));

// Test component
function TestConsumer() {
  const { locale, setLocale, locales, isReady } = useLanguage();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="is-ready">{isReady.toString()}</span>
      <span data-testid="locales">{JSON.stringify(locales)}</span>
      <button data-testid="set-en" onClick={() => setLocale("en")}>English</button>
      <button data-testid="set-zh" onClick={() => setLocale("zh")}>中文</button>
    </div>
  );
}

describe("LanguageContext", () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "";

    // Save original navigator
    originalNavigator = window.navigator;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("LanguageProvider", () => {
    it("should render children", () => {
      render(
        <LanguageProvider>
          <div data-testid="child">Hello</div>
        </LanguageProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("should default to base locale (en)", async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("locale")).toHaveTextContent("en");
      });
    });

    it("should load locale from localStorage", async () => {
      localStorage.setItem("silk-spark-locale", "zh");

      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("locale")).toHaveTextContent("zh");
      });
    });

    it("should handle invalid localStorage value", async () => {
      localStorage.setItem("silk-spark-locale", "invalid");

      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("locale")).toHaveTextContent("en");
      });
    });

    it("should set isReady to true after initialization", async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-ready")).toHaveTextContent("true");
      });
    });

    it("should provide list of available locales", () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      expect(screen.getByTestId("locales")).toHaveTextContent('["en","zh"]');
    });

    it("should update HTML lang attribute", async () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.lang).toBe("en");
      });
    });
  });

  describe("setLocale", () => {
    it("should change locale to Chinese", async () => {
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await user.click(screen.getByTestId("set-zh"));

      expect(screen.getByTestId("locale")).toHaveTextContent("zh");
    });

    it("should change locale to English", async () => {
      localStorage.setItem("silk-spark-locale", "zh");
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("locale")).toHaveTextContent("zh");
      });

      await user.click(screen.getByTestId("set-en"));

      expect(screen.getByTestId("locale")).toHaveTextContent("en");
    });

    it("should persist locale to localStorage", async () => {
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await user.click(screen.getByTestId("set-zh"));

      expect(localStorage.getItem("silk-spark-locale")).toBe("zh");
    });

    it("should update HTML lang attribute on change", async () => {
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      await user.click(screen.getByTestId("set-zh"));

      expect(document.documentElement.lang).toBe("zh");
    });
  });

  describe("useLanguage hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useLanguage must be used within a LanguageProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("constants", () => {
    it("should export correct LOCALES", () => {
      expect(LOCALES).toEqual(["en", "zh"]);
    });

    it("should export correct BASE_LOCALE", () => {
      expect(BASE_LOCALE).toBe("en");
    });

    it("should export correct LOCALE_NAMES", () => {
      expect(LOCALE_NAMES.en).toEqual({ native: "English", english: "English" });
      expect(LOCALE_NAMES.zh).toEqual({ native: "中文", english: "Chinese" });
    });
  });
});
