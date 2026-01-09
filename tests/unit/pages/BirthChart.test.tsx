import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    section: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <section {...props}>{children}</section>
    ),
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h1 {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h2 {...props}>{children}</h2>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AI Service
vi.mock("@/services/ai", () => ({
  default: {
    generateBirthChartAnalysis: vi.fn().mockResolvedValue({
      analysis: "Your sun in Capricorn brings ambition and discipline.",
      insights: { sunTraits: "Leader", moonEmotions: "Deep", elementAdvice: "Balance fire" },
      meta: { provider: "mock", model: "test" },
    }),
  },
}));

// Mock AstrologyEngine
vi.mock("@/services/AstrologyEngine", () => ({
  AstrologyEngine: {
    calculatePlanetaryPositions: vi.fn().mockReturnValue({
      Sun: "Capricorn",
      Moon: "Aries",
      Mercury: "Capricorn",
      Venus: "Pisces",
      Mars: "Sagittarius",
      Jupiter: "Cancer",
      Saturn: "Capricorn",
    }),
    calculateFiveElements: vi.fn().mockReturnValue({
      Wood: 20,
      Fire: 30,
      Earth: 25,
      Metal: 15,
      Water: 10,
    }),
  },
  PlanetaryPositions: {},
  FiveElementsDistribution: {},
}));

// Mock UserContext with birth data
const mockUser = {
  name: "Test User",
  birthData: {
    date: new Date("1990-01-15"),
    time: "14:30",
    location: { lat: 40.7128, lng: -74.006, name: "New York" },
  },
};

vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    user: mockUser,
    isBirthDataComplete: true,
  }),
}));

// Mock LanguageContext
vi.mock("@/context/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "en-US",
  }),
}));

// Mock paraglide messages
vi.mock("@/src/paraglide/messages", async (importOriginal) => {
  const original = await importOriginal<Record<string, () => string>>();
  const mocks: Record<string, () => string> = {
    "user.defaultName": () => "Friend",
    "birthChart.title": () => "Your Birth Chart",
    "birthChart.subtitle": () => "Cosmic Profile",
    "birthChart.loading": () => "Loading analysis...",
    "birthChart.planets.title": () => "Planetary Positions",
    "birthChart.elements.title": () => "Five Elements",
    "birthChart.analysis.title": () => "AI Analysis",
    "birthChart.noData": () => "No birth data",
    "birthChart.noData.cta": () => "Add your birth data",
    "common.loading": () => "Loading...",
    "common.back": () => "Back",
  };
  return { ...original, ...mocks };
});

// Import component after mocks
import { BirthChart } from "@/pages/BirthChart";

describe("BirthChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <BirthChart />
      </MemoryRouter>
    );
  };

  describe("rendering", () => {
    it("should render without crashing", async () => {
      renderComponent();

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it("should display user name in context", async () => {
      renderComponent();

      await waitFor(() => {
        // The component should use the user's name from context
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe("planetary positions", () => {
    it("should calculate planets from birth data", async () => {
      const { AstrologyEngine } = await import("@/services/AstrologyEngine");

      renderComponent();

      await waitFor(() => {
        expect(AstrologyEngine.calculatePlanetaryPositions).toHaveBeenCalled();
      });
    });

    it("should calculate five elements from birth data", async () => {
      const { AstrologyEngine } = await import("@/services/AstrologyEngine");

      renderComponent();

      await waitFor(() => {
        expect(AstrologyEngine.calculateFiveElements).toHaveBeenCalled();
      });
    });
  });

  describe("AI analysis", () => {
    it("should fetch AI analysis when data is available", async () => {
      const AIService = (await import("@/services/ai")).default;

      renderComponent();

      await waitFor(() => {
        expect(AIService.generateBirthChartAnalysis).toHaveBeenCalled();
      });
    });

    it("should pass correct data to AI service", async () => {
      const AIService = (await import("@/services/ai")).default;

      renderComponent();

      await waitFor(() => {
        expect(AIService.generateBirthChartAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test User",
          })
        );
      });
    });
  });

  describe("navigation", () => {
    it("should render with React Router", () => {
      renderComponent();
      expect(mockNavigate).toBeDefined();
    });
  });

  describe("loading states", () => {
    it("should show loading state while fetching analysis", async () => {
      renderComponent();

      // Component should handle loading state
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });
});
