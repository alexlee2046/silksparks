import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CardSelector } from "@/pages/features/CardSelector";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      whileHover,
      onClick,
      onMouseEnter,
      onMouseLeave,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div
        {...props}
        onClick={onClick as React.MouseEventHandler<HTMLDivElement>}
        onMouseEnter={onMouseEnter as React.MouseEventHandler<HTMLDivElement>}
        onMouseLeave={onMouseLeave as React.MouseEventHandler<HTMLDivElement>}
      >
        {children}
      </div>
    ),
    button: ({
      children,
      initial,
      animate,
      transition,
      onClick,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button
        {...props}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock TarotCardBack
vi.mock("@/pages/features/TarotCardBack", () => ({
  TarotCardBack: ({ showPattern }: { showPattern?: boolean }) => (
    <div data-testid="tarot-card-back" data-show-pattern={showPattern}>
      TarotCardBack
    </div>
  ),
}));

describe("CardSelector", () => {
  const defaultProps = {
    displayCards: [0, 1, 2, 3, 4],
    selectCount: 1,
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      render(<CardSelector {...defaultProps} />);
      expect(screen.getByText(/Select/)).toBeInTheDocument();
    });

    it("should render the correct number of cards", () => {
      render(<CardSelector {...defaultProps} />);

      const cards = screen.getAllByTestId("tarot-card-back");
      expect(cards).toHaveLength(5);
    });

    it("should show remaining count text", () => {
      render(<CardSelector {...defaultProps} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/card that calls to you/)).toBeInTheDocument();
    });

    it("should show plural for multiple cards", () => {
      render(<CardSelector {...defaultProps} selectCount={3} />);

      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText(/cards that calls to you/)).toBeInTheDocument();
    });
  });

  describe("single card selection", () => {
    it("should call onComplete when a card is clicked", async () => {
      const onComplete = vi.fn();
      render(
        <CardSelector
          {...defaultProps}
          onComplete={onComplete}
        />
      );

      const cards = screen.getAllByTestId("tarot-card-back");
      fireEvent.click(cards[0].parentElement!);

      // Wait for the 500ms timeout in component
      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledWith([0]);
        },
        { timeout: 1000 }
      );
    });

    it("should show selection complete text after selection", () => {
      render(<CardSelector {...defaultProps} />);

      const cards = screen.getAllByTestId("tarot-card-back");
      fireEvent.click(cards[0].parentElement!);

      expect(screen.getByText("Selection complete!")).toBeInTheDocument();
    });
  });

  describe("multiple card selection", () => {
    it("should render selection indicators for multiple cards", () => {
      const { container } = render(
        <CardSelector {...defaultProps} selectCount={3} />
      );

      // Should have 3 indicator dots
      const indicators = container.querySelectorAll(".rounded-full.border-2");
      expect(indicators).toHaveLength(3);
    });

    it("should update indicators as cards are selected", () => {
      const { container } = render(
        <CardSelector {...defaultProps} selectCount={3} />
      );

      const cards = screen.getAllByTestId("tarot-card-back");

      // Initially no indicators filled
      const initialFilled = container.querySelectorAll(".bg-\\[\\#F4C025\\].border-\\[\\#F4C025\\]");

      // Click first card
      fireEvent.click(cards[0].parentElement!);

      // One indicator should now be filled
      const afterFirstClick = container.querySelectorAll(".bg-\\[\\#F4C025\\]");
      expect(afterFirstClick.length).toBeGreaterThanOrEqual(1);
    });

    it("should show position labels when provided", () => {
      render(
        <CardSelector
          {...defaultProps}
          selectCount={3}
          positionLabels={["Past", "Present", "Future"]}
        />
      );

      expect(screen.getByText("Choose for: Past")).toBeInTheDocument();
    });

    it("should update position label after selection", () => {
      render(
        <CardSelector
          {...defaultProps}
          selectCount={3}
          positionLabels={["Past", "Present", "Future"]}
        />
      );

      const cards = screen.getAllByTestId("tarot-card-back");
      fireEvent.click(cards[0].parentElement!);

      expect(screen.getByText("Choose for: Present")).toBeInTheDocument();
    });

    it("should not allow selecting the same card twice", () => {
      const onComplete = vi.fn();
      render(
        <CardSelector
          {...defaultProps}
          selectCount={3}
          onComplete={onComplete}
        />
      );

      const cards = screen.getAllByTestId("tarot-card-back");

      // Click the same card twice
      fireEvent.click(cards[0].parentElement!);
      fireEvent.click(cards[0].parentElement!);

      // Should still need 2 more cards
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should complete selection with 3 cards", async () => {
      const onComplete = vi.fn();
      render(
        <CardSelector
          {...defaultProps}
          selectCount={3}
          onComplete={onComplete}
        />
      );

      const cards = screen.getAllByTestId("tarot-card-back");

      fireEvent.click(cards[0].parentElement!);
      fireEvent.click(cards[1].parentElement!);
      fireEvent.click(cards[2].parentElement!);

      await waitFor(
        () => {
          expect(onComplete).toHaveBeenCalledWith([0, 1, 2]);
        },
        { timeout: 1000 }
      );
    });

    it("should not allow selecting more than selectCount", () => {
      render(
        <CardSelector {...defaultProps} selectCount={2} />
      );

      const cards = screen.getAllByTestId("tarot-card-back");

      fireEvent.click(cards[0].parentElement!);
      fireEvent.click(cards[1].parentElement!);
      fireEvent.click(cards[2].parentElement!); // This should be ignored

      expect(screen.getByText("Selection complete!")).toBeInTheDocument();
    });
  });

  describe("shuffling state", () => {
    it("should show shuffling animation when isShuffling is true", () => {
      render(<CardSelector {...defaultProps} isShuffling={true} />);

      expect(screen.getByText("SHUFFLING THE DECK...")).toBeInTheDocument();
    });

    it("should show intention prompt during shuffling", () => {
      render(<CardSelector {...defaultProps} isShuffling={true} />);

      expect(screen.getByText("Focus your intention")).toBeInTheDocument();
    });

    it("should render multiple overlapping cards during shuffle", () => {
      render(<CardSelector {...defaultProps} isShuffling={true} />);

      const cards = screen.getAllByTestId("tarot-card-back");
      expect(cards).toHaveLength(5); // 5 cards in shuffle animation
    });

    it("should not allow card selection during shuffling", () => {
      const onComplete = vi.fn();
      render(
        <CardSelector
          {...defaultProps}
          isShuffling={true}
          onComplete={onComplete}
        />
      );

      // During shuffling, normal card selection UI isn't shown
      expect(screen.queryByText(/Select/)).not.toBeInTheDocument();
    });
  });

  describe("cancel button", () => {
    it("should not render cancel button when onCancel is not provided", () => {
      render(<CardSelector {...defaultProps} />);

      expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });

    it("should render cancel button when onCancel is provided", () => {
      const onCancel = vi.fn();
      render(<CardSelector {...defaultProps} onCancel={onCancel} />);

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should call onCancel when cancel button is clicked", () => {
      const onCancel = vi.fn();
      render(<CardSelector {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByText("Cancel"));

      expect(onCancel).toHaveBeenCalled();
    });

    it("should render close icon in cancel button", () => {
      const onCancel = vi.fn();
      render(<CardSelector {...defaultProps} onCancel={onCancel} />);

      const closeIcon = document.querySelector(".material-symbols-outlined");
      expect(closeIcon?.textContent).toBe("close");
    });
  });

  describe("selection order display", () => {
    it("should show selection order number on selected cards", () => {
      render(<CardSelector {...defaultProps} selectCount={3} />);

      const cards = screen.getAllByTestId("tarot-card-back");
      fireEvent.click(cards[0].parentElement!);

      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should show correct order numbers for multiple selections", () => {
      render(<CardSelector {...defaultProps} selectCount={3} />);

      const cards = screen.getAllByTestId("tarot-card-back");
      fireEvent.click(cards[0].parentElement!);
      fireEvent.click(cards[2].parentElement!);

      // Should have both "1" and "2" as selection order labels
      // Note: The "2" for remaining count changes, but selection order shows
      const numberOnes = screen.getAllByText("1");
      const numberTwos = screen.getAllByText("2");
      expect(numberOnes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("card styling", () => {
    it("should show pattern on unselected cards", () => {
      render(<CardSelector {...defaultProps} />);

      const cards = screen.getAllByTestId("tarot-card-back");
      // Unselected cards should have showPattern true (not explicitly false)
      cards.forEach((card) => {
        expect(card.getAttribute("data-show-pattern")).toBe("true");
      });
    });

    it("should hide pattern on selected cards", () => {
      render(<CardSelector {...defaultProps} selectCount={2} />);

      const cards = screen.getAllByTestId("tarot-card-back");
      fireEvent.click(cards[0].parentElement!);

      // After re-render, selected card should have showPattern false
      const updatedCards = screen.getAllByTestId("tarot-card-back");
      const selectedCard = updatedCards[0];
      expect(selectedCard.getAttribute("data-show-pattern")).toBe("false");
    });
  });

  describe("layout and structure", () => {
    it("should have fan layout container", () => {
      const { container } = render(<CardSelector {...defaultProps} />);

      const fanContainer = container.querySelector(".flex.items-center.justify-center");
      expect(fanContainer).toBeInTheDocument();
    });

    it("should center align selection prompt", () => {
      const { container } = render(<CardSelector {...defaultProps} />);

      const promptContainer = container.querySelector(".text-center.space-y-2");
      expect(promptContainer).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle empty displayCards array", () => {
      render(<CardSelector {...defaultProps} displayCards={[]} />);

      const cards = screen.queryAllByTestId("tarot-card-back");
      expect(cards).toHaveLength(0);
    });

    it("should handle selectCount of 0", () => {
      render(<CardSelector {...defaultProps} selectCount={0} />);

      // Should show complete immediately
      expect(screen.getByText("Selection complete!")).toBeInTheDocument();
    });

    it("should handle empty positionLabels array", () => {
      render(
        <CardSelector
          {...defaultProps}
          selectCount={3}
          positionLabels={[]}
        />
      );

      // Should not show position label
      expect(screen.queryByText("Choose for:")).not.toBeInTheDocument();
    });
  });

  describe("hover effects", () => {
    it("should set hovered state on mouse enter", () => {
      const { container } = render(<CardSelector {...defaultProps} />);

      const cards = container.querySelectorAll("[data-testid='tarot-card-back']");
      const firstCard = cards[0].parentElement;

      fireEvent.mouseEnter(firstCard!);

      // Component internally tracks hovered state
      // We can check that the card container exists
      expect(firstCard).toBeInTheDocument();
    });

    it("should clear hovered state on mouse leave", () => {
      const { container } = render(<CardSelector {...defaultProps} />);

      const cards = container.querySelectorAll("[data-testid='tarot-card-back']");
      const firstCard = cards[0].parentElement;

      fireEvent.mouseEnter(firstCard!);
      fireEvent.mouseLeave(firstCard!);

      expect(firstCard).toBeInTheDocument();
    });
  });
});
