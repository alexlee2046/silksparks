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
    generateTarotReading: vi.fn().mockResolvedValue({
      interpretation: "The Fool indicates new beginnings and taking a leap of faith.",
      cardInterpretations: [{ cardName: "The Fool", meaning: "New beginnings" }],
      meta: { provider: "mock", model: "test" },
    }),
  },
}));

// Mock TarotService
vi.mock("@/services/TarotService", () => ({
  initDailyTarot: vi.fn().mockReturnValue({
    seed: "test-seed-123",
    displayCards: [
      { id: "hidden-0" },
      { id: "hidden-1" },
      { id: "hidden-2" },
    ],
  }),
  selectDailyCard: vi.fn().mockReturnValue({
    id: "major-0",
    name: "The Fool",
    arcana: "Major",
    image: "/cards/fool.jpg",
    isReversed: false,
  }),
}));

// Mock RecommendationEngine
vi.mock("@/services/RecommendationEngine", () => ({
  RecommendationEngine: {
    getRecommendations: vi.fn().mockResolvedValue([
      { id: "1", name: "Crystal Ball", price: 49.99, image: "/crystal.jpg" },
    ]),
  },
  Product: {},
}));

// Mock tarotUtils
vi.mock("@/pages/features/tarotUtils", () => ({
  getCardNumberDisplay: vi.fn(() => "0"),
  GOLD_FOIL_FILTER: "sepia(100%)",
}));

// Mock CardSelector
vi.mock("@/pages/features/CardSelector", () => ({
  CardSelector: ({
    onComplete,
    onCancel,
    isShuffling,
  }: {
    displayCards: unknown[];
    selectCount: number;
    onComplete: (indices: number[]) => void;
    onCancel: () => void;
    isShuffling: boolean;
  }) => (
    <div data-testid="card-selector">
      {isShuffling ? (
        <span data-testid="shuffling">Shuffling...</span>
      ) : (
        <>
          <button data-testid="select-card" onClick={() => onComplete([0])}>
            Select Card
          </button>
          <button data-testid="cancel-select" onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
    </div>
  ),
}));

// Mock useAnimationConfig
vi.mock("@/hooks/useAnimationConfig", () => ({
  useAnimationsEnabled: () => false,
  useAnimationConfig: () => ({
    shouldReduceMotion: true,
    duration: { fast: 0, normal: 0, slow: 0 },
    spring: { type: "tween", duration: 0 },
    variants: {},
    hover: {},
    tap: {},
  }),
}));

// Mock lib/animations
vi.mock("@/lib/animations", () => ({
  rituals: {
    cardReveal: {
      hidden: { opacity: 0 },
      float: { opacity: 1 },
      flip: { opacity: 1 },
      settle: { opacity: 1 },
    },
  },
  transitions: {},
  variants: {},
}));

// Mock useJourneyState and useJourneyTrack
vi.mock("@/hooks/useJourneyState", () => ({
  useJourneyState: () => ({
    completeFeature: vi.fn(),
    completed: new Set(),
    isComplete: false,
  }),
}));

vi.mock("@/hooks/useJourneyTrack", () => ({
  useJourneyTrack: () => ({ track: vi.fn() }),
}));

// Mock PerformanceContext
vi.mock("@/context/PerformanceContext", () => ({
  usePerformance: () => ({ qualityLevel: "high" }),
  PerformanceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock UserContext - hoisted to avoid initialization errors
const { mockAddArchive } = vi.hoisted(() => ({
  mockAddArchive: vi.fn(),
}));

vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    addArchive: mockAddArchive,
    session: { user: { id: "user-123" } },
  }),
}));

// Import component after mocks
import { TarotDaily } from "@/pages/features/TarotDaily";

describe("TarotDaily", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <TarotDaily />
      </MemoryRouter>
    );
  };

  describe("rendering", () => {
    it("should render without crashing", () => {
      renderComponent();
      expect(document.body).toBeInTheDocument();
    });

    it("should display title", () => {
      renderComponent();
      expect(screen.getByText("Your Energy")).toBeInTheDocument();
      expect(screen.getByText("Revealed")).toBeInTheDocument();
    });

    it("should display Daily Guidance label", () => {
      renderComponent();
      expect(screen.getByText("Daily Guidance")).toBeInTheDocument();
    });

    it("should display initial prompt message", () => {
      renderComponent();
      expect(screen.getByText(/Focus your intention/)).toBeInTheDocument();
    });

    it("should show Tap to Begin text", () => {
      renderComponent();
      expect(screen.getByText("Tap to Begin")).toBeInTheDocument();
    });

    it("should show card deck visual", () => {
      renderComponent();
      expect(screen.getByText("Silk & Sparks")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should have back button", () => {
      renderComponent();
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("should navigate home when back button clicked", () => {
      renderComponent();
      const backButton = screen.getByText("Back");
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("idle state", () => {
    it("should show auto_awesome icon", () => {
      renderComponent();
      const icons = document.querySelectorAll(".material-symbols-outlined");
      const hasAutoAwesome = Array.from(icons).some(
        icon => icon.textContent === "auto_awesome"
      );
      expect(hasAutoAwesome).toBe(true);
    });

    it("should have clickable card deck", () => {
      renderComponent();
      const tapToBegin = screen.getByText("Tap to Begin");
      expect(tapToBegin).toBeInTheDocument();
    });
  });

  describe("starting reading", () => {
    it("should show card selector after clicking deck", async () => {
      renderComponent();

      // Find the clickable deck - it has cursor-pointer class
      const tapToBegin = screen.getByText("Tap to Begin");
      // Traverse up to find the element with onClick handler (has cursor-pointer class)
      const clickableElement = tapToBegin.closest(".cursor-pointer");
      fireEvent.click(clickableElement!);

      await waitFor(
        () => {
          expect(screen.getByTestId("card-selector")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should enter reading flow when deck is clicked", async () => {
      renderComponent();

      const tapToBegin = screen.getByText("Tap to Begin");
      const clickableElement = tapToBegin.closest(".cursor-pointer");
      fireEvent.click(clickableElement!);

      // After click, "Tap to Begin" should disappear as we enter reading flow
      await waitFor(
        () => {
          expect(screen.queryByText("Tap to Begin")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("cancel selection", () => {
    it("should return to idle when cancel is clicked", async () => {
      renderComponent();

      // Start reading
      const tapToBegin = screen.getByText("Tap to Begin");
      fireEvent.click(tapToBegin.closest(".cursor-pointer")!);

      // Wait for shuffle to complete (2000ms)
      await waitFor(
        () => {
          expect(screen.getByTestId("cancel-select")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Cancel
      fireEvent.click(screen.getByTestId("cancel-select"));

      // Should return to idle
      await waitFor(() => {
        expect(screen.getByText("Tap to Begin")).toBeInTheDocument();
      });
    });
  });

  describe("TarotService integration", () => {
    it("should call initDailyTarot with userId", async () => {
      const { initDailyTarot } = await import("@/services/TarotService");

      renderComponent();

      const tapToBegin = screen.getByText("Tap to Begin");
      fireEvent.click(tapToBegin.closest(".cursor-pointer")!);

      // Wait for init call after the 2s shuffle timeout
      await waitFor(
        () => {
          expect(initDailyTarot).toHaveBeenCalledWith("user-123");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("component structure", () => {
    it("should render main container", () => {
      const { container } = renderComponent();
      expect(container.querySelector(".flex-1")).toBeInTheDocument();
    });

    it("should have max-width container", () => {
      const { container } = renderComponent();
      expect(container.querySelector(".max-w-\\[1100px\\]")).toBeInTheDocument();
    });
  });

  describe("message updates", () => {
    it("should show different message during selecting", async () => {
      renderComponent();

      const tapToBegin = screen.getByText("Tap to Begin");
      fireEvent.click(tapToBegin.closest(".cursor-pointer")!);

      // Wait for selecting state
      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Message should change
      expect(screen.getByText(/Trust your intuition/)).toBeInTheDocument();
    });
  });

  describe("card selection flow", () => {
    it("should handle card selection callback", async () => {
      const { selectDailyCard } = await import("@/services/TarotService");

      renderComponent();

      // Start reading
      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      // Wait for selection UI
      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Select card
      fireEvent.click(screen.getByTestId("select-card"));

      // Wait for card selection to be called
      await waitFor(
        () => {
          expect(selectDailyCard).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("full reading flow", () => {
    it("should complete reading and show revealed card", async () => {
      renderComponent();

      // Start reading
      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      // Wait for selection UI (after 2s shuffle timeout)
      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Select card
      fireEvent.click(screen.getByTestId("select-card"));

      // Wait for revealed state (after 1.5s flip animation + AI call)
      // Card name appears in multiple places, use getAllByText
      await waitFor(
        () => {
          const cardNames = screen.getAllByText("The Fool");
          expect(cardNames.length).toBeGreaterThanOrEqual(1);
        },
        { timeout: 3000 }
      );
    });

    it("should show interpretation after reveal", async () => {
      renderComponent();

      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-card"));

      await waitFor(
        () => {
          expect(screen.getByText(/leap of faith/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should add archive after successful reading", async () => {
      renderComponent();

      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-card"));

      await waitFor(
        () => {
          expect(mockAddArchive).toHaveBeenCalledWith(
            expect.objectContaining({
              type: "Tarot",
              title: "Daily Draw: The Fool",
            })
          );
        },
        { timeout: 5000 }
      );
    });
  });

  describe("revealed state UI", () => {
    it("should show Draw Another Card button", async () => {
      renderComponent();

      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-card"));

      await waitFor(
        () => {
          expect(screen.getByText("Draw Another Card")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should show AI Interpretation section", async () => {
      renderComponent();

      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-card"));

      await waitFor(
        () => {
          expect(screen.getByText("AI Interpretation")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should show tags", async () => {
      renderComponent();

      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-card"));

      await waitFor(
        () => {
          expect(screen.getByText("#Destiny")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("reset functionality", () => {
    it("should reset to idle when Draw Another Card is clicked", async () => {
      renderComponent();

      fireEvent.click(screen.getByText("Tap to Begin").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-card")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-card"));

      await waitFor(
        () => {
          expect(screen.getByText("Draw Another Card")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      fireEvent.click(screen.getByText("Draw Another Card"));

      await waitFor(() => {
        expect(screen.getByText("Tap to Begin")).toBeInTheDocument();
      });
    });
  });
});
