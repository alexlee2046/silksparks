import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock react-three-fiber Canvas
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas-mock">{children}</div>
  ),
  useFrame: vi.fn(),
}));

// Mock react-three-drei components
vi.mock("@react-three/drei", () => ({
  Stars: () => <div data-testid="stars-mock" />,
  Sparkles: ({ color, count }: { color?: string; count?: number }) => (
    <div data-testid="sparkles-mock" data-color={color} data-count={count} />
  ),
  Float: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="float-mock">{children}</div>
  ),
}));

// Mock ThemeContext
let mockResolvedTheme: "light" | "dark" = "dark";
let mockThemeError = false;

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => {
    if (mockThemeError) {
      throw new Error("ThemeProvider not mounted");
    }
    return { resolvedTheme: mockResolvedTheme };
  },
}));

// Mock PerformanceContext
let mockQualityLevel: "high" | "medium" | "low" | "off" = "high";
let mockPerformanceError = false;

vi.mock("@/context/PerformanceContext", () => ({
  usePerformance: () => {
    if (mockPerformanceError) {
      throw new Error("PerformanceProvider not mounted");
    }
    return {
      qualityLevel: mockQualityLevel,
      settings: {
        stars: mockQualityLevel === "off" ? 0 : 5000,
        sparkles: mockQualityLevel === "off" ? 0 : 450,
        enableSparkles: mockQualityLevel !== "off",
        enableFloat: mockQualityLevel === "high",
        enableFog: mockQualityLevel !== "off",
        dpr: [1, 2] as [number, number],
      },
    };
  },
  QualityLevel: {
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    OFF: "off",
  },
}));

// Import after mocks
import { CosmicBackground } from "@/components/CosmicBackground";

describe("CosmicBackground", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvedTheme = "dark";
    mockQualityLevel = "high";
    mockThemeError = false;
    mockPerformanceError = false;
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<CosmicBackground />);
      expect(container).toBeInTheDocument();
    });

    it("should render Canvas in high quality mode", () => {
      render(<CosmicBackground />);
      expect(screen.getByTestId("canvas-mock")).toBeInTheDocument();
    });

    it("should render with fixed positioning", () => {
      const { container } = render(<CosmicBackground />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("fixed");
      expect(wrapper.className).toContain("inset-0");
    });

    it("should render with negative z-index", () => {
      const { container } = render(<CosmicBackground />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("z-[-1]");
    });

    it("should disable pointer events", () => {
      const { container } = render(<CosmicBackground />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("pointer-events-none");
    });
  });

  describe("theme modes", () => {
    it("should render in dark mode by default", () => {
      mockResolvedTheme = "dark";
      const { container } = render(<CosmicBackground />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render in light mode", () => {
      mockResolvedTheme = "light";
      const { container } = render(<CosmicBackground />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle ThemeProvider not mounted", () => {
      mockThemeError = true;
      const { container } = render(<CosmicBackground />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("quality levels", () => {
    it("should render Canvas for high quality", () => {
      mockQualityLevel = "high";
      render(<CosmicBackground />);
      expect(screen.getByTestId("canvas-mock")).toBeInTheDocument();
    });

    it("should render Canvas for medium quality", () => {
      mockQualityLevel = "medium";
      render(<CosmicBackground />);
      expect(screen.getByTestId("canvas-mock")).toBeInTheDocument();
    });

    it("should render Canvas for low quality", () => {
      mockQualityLevel = "low";
      render(<CosmicBackground />);
      expect(screen.getByTestId("canvas-mock")).toBeInTheDocument();
    });

    it("should render static background when quality is off", () => {
      mockQualityLevel = "off";
      const { container } = render(<CosmicBackground />);
      // Static background renders a div with radial gradient
      const staticBg = container.querySelector(".transition-colors");
      expect(staticBg).toBeInTheDocument();
    });

    it("should not render Canvas when quality is off", () => {
      mockQualityLevel = "off";
      render(<CosmicBackground />);
      expect(screen.queryByTestId("canvas-mock")).not.toBeInTheDocument();
    });

    it("should handle PerformanceProvider not mounted", () => {
      mockPerformanceError = true;
      const { container } = render(<CosmicBackground />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("static background (quality off)", () => {
    it("should render dark gradient for dark mode", () => {
      mockQualityLevel = "off";
      mockResolvedTheme = "dark";
      const { container } = render(<CosmicBackground />);
      const bg = container.firstChild as HTMLElement;
      expect(bg.style.background).toContain("radial-gradient");
    });

    it("should render light gradient for light mode", () => {
      mockQualityLevel = "off";
      mockResolvedTheme = "light";
      const { container } = render(<CosmicBackground />);
      const bg = container.firstChild as HTMLElement;
      expect(bg.style.background).toContain("radial-gradient");
    });

    it("should show star pattern in light mode static background", () => {
      mockQualityLevel = "off";
      mockResolvedTheme = "light";
      const { container } = render(<CosmicBackground />);
      const starPattern = container.querySelector(".opacity-10");
      expect(starPattern).toBeInTheDocument();
    });

    it("should not show star pattern in dark mode static background", () => {
      mockQualityLevel = "off";
      mockResolvedTheme = "dark";
      const { container } = render(<CosmicBackground />);
      const starPattern = container.querySelector(".opacity-10");
      expect(starPattern).not.toBeInTheDocument();
    });
  });

  describe("3D canvas elements", () => {
    it("should render Float component for high quality", () => {
      mockQualityLevel = "high";
      render(<CosmicBackground />);
      expect(screen.getByTestId("float-mock")).toBeInTheDocument();
    });

    it("should render Sparkles components", () => {
      mockQualityLevel = "high";
      render(<CosmicBackground />);
      const sparkles = screen.getAllByTestId("sparkles-mock");
      expect(sparkles.length).toBeGreaterThan(0);
    });

    it("should render Stars component", () => {
      mockQualityLevel = "high";
      render(<CosmicBackground />);
      expect(screen.getByTestId("stars-mock")).toBeInTheDocument();
    });
  });

  describe("overlay elements", () => {
    it("should render gradient overlay", () => {
      const { container } = render(<CosmicBackground />);
      const overlays = container.querySelectorAll(".absolute.inset-0");
      expect(overlays.length).toBeGreaterThan(0);
    });

    it("should render noise texture overlay", () => {
      const { container } = render(<CosmicBackground />);
      const noiseOverlay = container.querySelector("[class*='bg-[url']");
      expect(noiseOverlay).toBeInTheDocument();
    });
  });

  describe("provider fallbacks", () => {
    it("should use default dark theme when ThemeProvider throws", () => {
      mockThemeError = true;
      const { container } = render(<CosmicBackground />);
      // Should still render without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should use default high quality when PerformanceProvider throws", () => {
      mockPerformanceError = true;
      render(<CosmicBackground />);
      // Should render Canvas with default settings
      expect(screen.getByTestId("canvas-mock")).toBeInTheDocument();
    });

    it("should handle both providers throwing", () => {
      mockThemeError = true;
      mockPerformanceError = true;
      const { container } = render(<CosmicBackground />);
      // Should still render with all defaults
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
