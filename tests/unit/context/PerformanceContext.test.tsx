import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PerformanceProvider, usePerformance, QUALITY_PRESETS } from "@/context/PerformanceContext";

// Mock useDevicePerformance hook
vi.mock("@/hooks/useDevicePerformance", () => ({
  useDevicePerformance: vi.fn(() => ({
    tier: "high",
    score: 85,
    metrics: {
      cores: 8,
      memory: 16,
      gpu: "dedicated",
    },
  })),
}));

// Test component
function TestConsumer() {
  const { qualityLevel, setQualityLevel, isAutoDetected, deviceTier, settings, resetToAuto } = usePerformance();
  return (
    <div>
      <span data-testid="quality">{qualityLevel}</span>
      <span data-testid="auto">{isAutoDetected.toString()}</span>
      <span data-testid="tier">{deviceTier}</span>
      <span data-testid="stars">{settings.stars}</span>
      <span data-testid="sparkles">{settings.sparkles}</span>
      <button data-testid="set-high" onClick={() => setQualityLevel("high")}>High</button>
      <button data-testid="set-medium" onClick={() => setQualityLevel("medium")}>Medium</button>
      <button data-testid="set-low" onClick={() => setQualityLevel("low")}>Low</button>
      <button data-testid="set-off" onClick={() => setQualityLevel("off")}>Off</button>
      <button data-testid="reset" onClick={resetToAuto}>Reset</button>
    </div>
  );
}

describe("PerformanceContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("PerformanceProvider", () => {
    it("should render children", () => {
      render(
        <PerformanceProvider>
          <div data-testid="child">Hello</div>
        </PerformanceProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("should auto-detect quality based on device tier", async () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("quality")).toHaveTextContent("high");
        expect(screen.getByTestId("auto")).toHaveTextContent("true");
      });
    });

    it("should load quality from localStorage", async () => {
      localStorage.setItem("silk-spark-quality", "low");

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("quality")).toHaveTextContent("low");
        expect(screen.getByTestId("auto")).toHaveTextContent("false");
      });
    });

    it("should handle invalid localStorage value", async () => {
      localStorage.setItem("silk-spark-quality", "invalid");

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("quality")).toHaveTextContent("high");
        expect(screen.getByTestId("auto")).toHaveTextContent("true");
      });
    });

    it("should provide device tier", () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      expect(screen.getByTestId("tier")).toHaveTextContent("high");
    });

    it("should provide correct settings for quality level", () => {
      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      expect(screen.getByTestId("stars")).toHaveTextContent("5000");
      expect(screen.getByTestId("sparkles")).toHaveTextContent("450");
    });
  });

  describe("setQualityLevel", () => {
    it("should set quality to high", async () => {
      localStorage.setItem("silk-spark-quality", "low");
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await user.click(screen.getByTestId("set-high"));

      expect(screen.getByTestId("quality")).toHaveTextContent("high");
      expect(screen.getByTestId("stars")).toHaveTextContent("5000");
    });

    it("should set quality to medium", async () => {
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await user.click(screen.getByTestId("set-medium"));

      expect(screen.getByTestId("quality")).toHaveTextContent("medium");
      expect(screen.getByTestId("stars")).toHaveTextContent("2000");
    });

    it("should set quality to low", async () => {
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await user.click(screen.getByTestId("set-low"));

      expect(screen.getByTestId("quality")).toHaveTextContent("low");
      expect(screen.getByTestId("stars")).toHaveTextContent("500");
    });

    it("should set quality to off", async () => {
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await user.click(screen.getByTestId("set-off"));

      expect(screen.getByTestId("quality")).toHaveTextContent("off");
      expect(screen.getByTestId("stars")).toHaveTextContent("0");
    });

    it("should persist quality to localStorage", async () => {
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await user.click(screen.getByTestId("set-medium"));

      expect(localStorage.getItem("silk-spark-quality")).toBe("medium");
    });

    it("should set isAutoDetected to false when manually setting", async () => {
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      expect(screen.getByTestId("auto")).toHaveTextContent("true");

      await user.click(screen.getByTestId("set-low"));

      expect(screen.getByTestId("auto")).toHaveTextContent("false");
    });
  });

  describe("resetToAuto", () => {
    it("should reset to auto-detected quality", async () => {
      localStorage.setItem("silk-spark-quality", "low");
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("quality")).toHaveTextContent("low");
      });

      await user.click(screen.getByTestId("reset"));

      expect(screen.getByTestId("quality")).toHaveTextContent("high");
      expect(screen.getByTestId("auto")).toHaveTextContent("true");
    });

    it("should remove localStorage entry", async () => {
      localStorage.setItem("silk-spark-quality", "low");
      const user = userEvent.setup();

      render(
        <PerformanceProvider>
          <TestConsumer />
        </PerformanceProvider>
      );

      await user.click(screen.getByTestId("reset"));

      expect(localStorage.getItem("silk-spark-quality")).toBeNull();
    });
  });

  describe("usePerformance hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("usePerformance must be used within a PerformanceProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("QUALITY_PRESETS", () => {
    it("should have correct high preset", () => {
      expect(QUALITY_PRESETS.high).toEqual({
        stars: 5000,
        sparkles: 450,
        enableSparkles: true,
        enableFloat: true,
        enableFog: true,
        dpr: [1, 2],
      });
    });

    it("should have correct medium preset", () => {
      expect(QUALITY_PRESETS.medium).toEqual({
        stars: 2000,
        sparkles: 200,
        enableSparkles: true,
        enableFloat: true,
        enableFog: true,
        dpr: [1, 1.5],
      });
    });

    it("should have correct low preset", () => {
      expect(QUALITY_PRESETS.low).toEqual({
        stars: 500,
        sparkles: 50,
        enableSparkles: true,
        enableFloat: false,
        enableFog: false,
        dpr: [1, 1],
      });
    });

    it("should have correct off preset", () => {
      expect(QUALITY_PRESETS.off).toEqual({
        stars: 0,
        sparkles: 0,
        enableSparkles: false,
        enableFloat: false,
        enableFog: false,
        dpr: [1, 1],
      });
    });
  });
});
