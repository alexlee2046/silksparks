import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { Screen } from "@/types";

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

// Mock AI Service
vi.mock("@/services/ai", () => ({
  default: {
    generateTarotReading: vi.fn().mockResolvedValue({
      interpretation: "Your past reveals lessons, present shows growth, future promises transformation.",
      cardInterpretations: [
        { cardName: "The Fool", meaning: "New beginnings" },
        { cardName: "The Magician", meaning: "Power and skill" },
        { cardName: "The High Priestess", meaning: "Intuition" },
      ],
      meta: { provider: "mock", model: "test" },
    }),
  },
}));

// Mock TarotService
vi.mock("@/services/TarotService", () => ({
  initSpreadTarot: vi.fn().mockReturnValue({
    seed: "test-seed-spread-123",
    displayCards: Array(7).fill({ id: "hidden" }),
  }),
  selectSpreadCards: vi.fn().mockReturnValue([
    { id: "major-0", name: "The Fool", arcana: "Major", image: "/fool.jpg", isReversed: false },
    { id: "major-1", name: "The Magician", arcana: "Major", image: "/magician.jpg", isReversed: false },
    { id: "major-2", name: "The High Priestess", arcana: "Major", image: "/priestess.jpg", isReversed: true },
  ]),
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

// Mock TarotCard
vi.mock("@/pages/features/TarotCard", () => ({
  TarotCard: ({
    title,
    context,
    position,
  }: {
    title: string;
    context: string;
    position: string;
    subtitle: string;
    image: string;
    delay: number;
    active: boolean;
  }) => (
    <div data-testid={`tarot-card-${position}`}>
      <span>{title}</span>
      <span>{context}</span>
    </div>
  ),
}));

// Mock CardSelector
vi.mock("@/pages/features/CardSelector", () => ({
  CardSelector: ({
    onComplete,
    onCancel,
    isShuffling,
    selectCount,
  }: {
    displayCards: unknown[];
    selectCount: number;
    onComplete: (indices: number[]) => void;
    onCancel: () => void;
    positionLabels: string[];
    isShuffling: boolean;
  }) => (
    <div data-testid="card-selector">
      <span data-testid="select-count">{selectCount}</span>
      {isShuffling ? (
        <span data-testid="shuffling">Shuffling...</span>
      ) : (
        <>
          <button data-testid="select-cards" onClick={() => onComplete([0, 1, 2])}>
            Select 3 Cards
          </button>
          <button data-testid="cancel-select" onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
    </div>
  ),
}));

// Mock UserContext
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
import { TarotSpread } from "@/pages/features/TarotSpread";

describe("TarotSpread", () => {
  const mockSetScreen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(document.body).toBeInTheDocument();
    });

    it("should display title", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(screen.getByText("Past, Present,")).toBeInTheDocument();
      // "Future" appears in multiple places, use getAllByText
      const futureElements = screen.getAllByText("Future");
      expect(futureElements.length).toBeGreaterThanOrEqual(1);
    });

    it("should display Three Card Spread label", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(screen.getByText("Three Card Spread")).toBeInTheDocument();
    });

    it("should show initial prompt message", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(screen.getByText(/Focus on a question/)).toBeInTheDocument();
    });

    it("should show Tap Deck to Shuffle text", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(screen.getByText("Tap Deck to Shuffle")).toBeInTheDocument();
    });

    it("should show Silk & Sparks branding", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(screen.getByText("Silk & Sparks")).toBeInTheDocument();
    });

    it("should show position labels in idle state", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(screen.getByText("Past")).toBeInTheDocument();
      expect(screen.getByText("Present")).toBeInTheDocument();
      // Note: "Future" might be styled differently in the title
    });
  });

  describe("navigation", () => {
    it("should have back button", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("should navigate home when back button clicked", () => {
      render(<TarotSpread setScreen={mockSetScreen} />);
      const backButton = screen.getByText("Back");
      fireEvent.click(backButton);
      expect(mockSetScreen).toHaveBeenCalledWith(Screen.HOME);
    });
  });

  describe("deck interaction", () => {
    it("should show card selector after clicking deck", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      const tapDeck = screen.getByText("Tap Deck to Shuffle");
      const clickableElement = tapDeck.closest(".cursor-pointer");
      fireEvent.click(clickableElement!);

      await waitFor(
        () => {
          expect(screen.getByTestId("card-selector")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should request 3 cards from CardSelector", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      const tapDeck = screen.getByText("Tap Deck to Shuffle");
      fireEvent.click(tapDeck.closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-count")).toHaveTextContent("3");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("cancel selection", () => {
    it("should return to idle when cancel is clicked", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      const tapDeck = screen.getByText("Tap Deck to Shuffle");
      fireEvent.click(tapDeck.closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("cancel-select")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("cancel-select"));

      await waitFor(() => {
        expect(screen.getByText("Tap Deck to Shuffle")).toBeInTheDocument();
      });
    });
  });

  describe("TarotService integration", () => {
    it("should call initSpreadTarot with userId", async () => {
      const { initSpreadTarot } = await import("@/services/TarotService");

      render(<TarotSpread setScreen={mockSetScreen} />);

      const tapDeck = screen.getByText("Tap Deck to Shuffle");
      fireEvent.click(tapDeck.closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(initSpreadTarot).toHaveBeenCalledWith("user-123");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("message updates", () => {
    it("should show different message during selecting", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      const tapDeck = screen.getByText("Tap Deck to Shuffle");
      fireEvent.click(tapDeck.closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText(/Choose three cards/)).toBeInTheDocument();
    });
  });

  describe("card selection flow", () => {
    it("should call selectSpreadCards after selection", async () => {
      const { selectSpreadCards } = await import("@/services/TarotService");

      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(selectSpreadCards).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("full reading flow", () => {
    it("should show three TarotCard components after selection", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByTestId("tarot-card-I")).toBeInTheDocument();
          expect(screen.getByTestId("tarot-card-II")).toBeInTheDocument();
          expect(screen.getByTestId("tarot-card-III")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should show interpretation after reveal", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText(/past reveals lessons/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should add archive after successful reading", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(mockAddArchive).toHaveBeenCalledWith(
            expect.objectContaining({
              type: "Tarot",
              title: expect.stringContaining("Three Card Spread"),
            })
          );
        },
        { timeout: 5000 }
      );
    });
  });

  describe("revealed state UI", () => {
    it("should show Spark AI Interpretation heading", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText("Spark AI Interpretation")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should show Browse Sacred Shop button", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText("Browse Sacred Shop")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should show New Reading button", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText("New Reading")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should navigate to shop when Browse Sacred Shop clicked", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText("Browse Sacred Shop")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      fireEvent.click(screen.getByText("Browse Sacred Shop"));

      expect(mockSetScreen).toHaveBeenCalledWith(Screen.SHOP_LIST);
    });
  });

  describe("reset functionality", () => {
    it("should reset to idle when New Reading is clicked", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText("New Reading")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      fireEvent.click(screen.getByText("New Reading"));

      await waitFor(() => {
        expect(screen.getByText("Tap Deck to Shuffle")).toBeInTheDocument();
      });
    });
  });

  describe("recommendations", () => {
    it("should show recommendations after reading", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText("Recommended for your journey")).toBeInTheDocument();
          expect(screen.getByText("Crystal Ball")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should navigate to product detail when recommendation clicked", async () => {
      render(<TarotSpread setScreen={mockSetScreen} />);

      fireEvent.click(screen.getByText("Tap Deck to Shuffle").closest(".cursor-pointer")!);

      await waitFor(
        () => {
          expect(screen.getByTestId("select-cards")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      fireEvent.click(screen.getByTestId("select-cards"));

      await waitFor(
        () => {
          expect(screen.getByText("Crystal Ball")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      fireEvent.click(screen.getByText("Crystal Ball"));

      expect(mockSetScreen).toHaveBeenCalledWith(Screen.PRODUCT_DETAIL);
    });
  });
});
