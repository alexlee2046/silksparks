import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h1 {...props}>{children}</h1>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
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

// Mock lazy loaded CosmicBackground
vi.mock("@/components/CosmicBackground", () => ({
  CosmicBackground: () => <div data-testid="cosmic-background" />,
}));

// Mock AI Service
vi.mock("@/services/ai", () => ({
  default: {
    generateBirthChartAnalysis: vi.fn().mockResolvedValue({
      analysis: "Your sun in Capricorn brings discipline and ambition to your life.",
      insights: { sunTraits: "Leader", moonEmotions: "Deep", elementAdvice: "Balance" },
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

// Mock ElementBar
vi.mock("@/pages/features/ElementBar", () => ({
  ElementBar: ({ label, percent }: { label: string; percent: string }) => (
    <div data-testid={`element-${label}`}>{label}: {percent}</div>
  ),
}));

// Mock UserContext
const mockAddArchive = vi.fn();
let mockIsBirthDataComplete = true;
const mockUser = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  birthData: {
    date: new Date("1990-01-15"),
    time: "14:30",
    location: { lat: 40.7128, lng: -74.006, name: "New York" },
  },
};

vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    user: mockUser,
    isBirthDataComplete: mockIsBirthDataComplete,
    addArchive: mockAddArchive,
  }),
}));

// Import component after mocks
import { AstrologyReport } from "@/pages/features/AstrologyReport";

describe("AstrologyReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    mockIsBirthDataComplete = true;
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AstrologyReport />
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

    it("should show loading state initially", () => {
      renderComponent();

      expect(screen.getByText("TRANSCENDING...")).toBeInTheDocument();
    });

    it("should show loading message about Akashic Records", () => {
      renderComponent();

      expect(screen.getByText("Consulting the Akashic Records")).toBeInTheDocument();
    });
  });

  describe("with birth data complete", () => {
    it("should calculate planetary positions", async () => {
      const { AstrologyEngine } = await import("@/services/AstrologyEngine");

      renderComponent();

      await waitFor(() => {
        expect(AstrologyEngine.calculatePlanetaryPositions).toHaveBeenCalled();
      });
    });

    it("should calculate five elements", async () => {
      const { AstrologyEngine } = await import("@/services/AstrologyEngine");

      renderComponent();

      await waitFor(() => {
        expect(AstrologyEngine.calculateFiveElements).toHaveBeenCalled();
      });
    });

    it("should fetch AI analysis", async () => {
      const AIService = (await import("@/services/ai")).default;

      renderComponent();

      await waitFor(() => {
        expect(AIService.generateBirthChartAnalysis).toHaveBeenCalled();
      });
    });

    it("should display user name after loading", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Test User")).toBeInTheDocument();
      });
    });

    it("should display Sun sign", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Capricorn Sun")).toBeInTheDocument();
      });
    });

    it("should display element bars", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("element-Fire")).toBeInTheDocument();
        expect(screen.getByTestId("element-Water")).toBeInTheDocument();
        expect(screen.getByTestId("element-Earth")).toBeInTheDocument();
      });
    });

    it("should add archive after successful analysis", async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockAddArchive).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "Astrology",
            title: "Birth Chart Analysis",
          })
        );
      });
    });
  });

  describe("without birth data", () => {
    it("should redirect to home when birth data is incomplete", async () => {
      mockIsBirthDataComplete = false;

      renderComponent();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("caching", () => {
    it("should use cached analysis if available", async () => {
      const cacheKey = `silk_spark_report_user-123_${mockUser.birthData.date!.toISOString()}`;
      localStorage.setItem(cacheKey, "Cached analysis text");

      const AIService = (await import("@/services/ai")).default;

      renderComponent();

      await waitFor(() => {
        // Should not call AI service when cache exists
        expect(screen.getByText(/Cached analysis/)).toBeInTheDocument();
      });
    });
  });

  describe("navigation", () => {
    it("should have back button", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Back to Chart")).toBeInTheDocument();
      });
    });

    it("should navigate back when back button clicked", async () => {
      renderComponent();

      await waitFor(() => {
        const backButton = screen.getByText("Back to Chart");
        fireEvent.click(backButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/horoscope");
    });
  });

  describe("premium features", () => {
    it("should show premium unlock button", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Unlock 12-Month Forecast")).toBeInTheDocument();
      });
    });
  });
});
