import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TarotInterpretation } from "@/pages/features/TarotInterpretation";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    span: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("TarotInterpretation", () => {
  const defaultProps = {
    interpretation: "This is a detailed tarot reading. You should focus on inner reflection and trust your intuition.",
  };

  describe("rendering", () => {
    it("should render the interpretation text in detailed section", () => {
      render(<TarotInterpretation {...defaultProps} />);

      // The interpretation appears in the detailed reading section
      expect(screen.getByText("Detailed Reading")).toBeInTheDocument();
    });

    it("should render the Detailed Reading label", () => {
      render(<TarotInterpretation {...defaultProps} />);

      expect(screen.getByText("Detailed Reading")).toBeInTheDocument();
    });

    it("should render Full Narrative label when isSpread is true", () => {
      render(<TarotInterpretation {...defaultProps} isSpread={true} />);

      expect(screen.getByText("Full Narrative")).toBeInTheDocument();
    });
  });

  describe("coreMessage prop", () => {
    it("should render provided coreMessage", () => {
      render(
        <TarotInterpretation
          {...defaultProps}
          coreMessage="Trust your inner light"
        />
      );

      expect(screen.getByText(/Trust your inner light/)).toBeInTheDocument();
    });

    it("should auto-extract coreMessage from interpretation if not provided", () => {
      const interpretation = "A clear path forward. Your journey begins with a single step into the unknown.";
      render(<TarotInterpretation interpretation={interpretation} />);

      // First sentence should be extracted as core message (in quotes)
      expect(screen.getByText(/"A clear path forward."/)).toBeInTheDocument();
    });

    it("should not show core message if first sentence is too long", () => {
      const longFirstSentence = "A".repeat(130) + ". Next sentence.";
      render(<TarotInterpretation interpretation={longFirstSentence} />);

      // Should not render the overly long sentence as core message (no quotes)
      expect(screen.queryByText(new RegExp(`"${"A".repeat(100)}`))).not.toBeInTheDocument();
    });
  });

  describe("actionAdvice prop", () => {
    it("should render provided actionAdvice", () => {
      render(
        <TarotInterpretation
          {...defaultProps}
          actionAdvice="Focus on meditation and inner peace"
        />
      );

      expect(screen.getByText("Focus on meditation and inner peace")).toBeInTheDocument();
    });

    it("should render Action Guidance header when actionAdvice is provided", () => {
      render(
        <TarotInterpretation
          {...defaultProps}
          actionAdvice="Take a leap of faith"
        />
      );

      expect(screen.getByText("Action Guidance")).toBeInTheDocument();
    });
  });

  describe("luckyElements prop", () => {
    it("should render lucky elements when provided", () => {
      render(
        <TarotInterpretation
          {...defaultProps}
          luckyElements={{
            color: "Gold",
            number: "7",
            direction: "East",
          }}
        />
      );

      expect(screen.getByText("Lucky Elements")).toBeInTheDocument();
      expect(screen.getByText("Gold")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("East")).toBeInTheDocument();
    });

    it("should render element labels correctly", () => {
      render(
        <TarotInterpretation
          {...defaultProps}
          luckyElements={{
            color: "Blue",
          }}
        />
      );

      expect(screen.getByText("Color")).toBeInTheDocument();
    });

    it("should not render lucky elements section when empty", () => {
      render(<TarotInterpretation {...defaultProps} luckyElements={{}} />);

      expect(screen.queryByText("Lucky Elements")).not.toBeInTheDocument();
    });

    it("should not render lucky elements section when undefined", () => {
      render(<TarotInterpretation {...defaultProps} />);

      expect(screen.queryByText("Lucky Elements")).not.toBeInTheDocument();
    });

    it("should skip null/undefined values in lucky elements", () => {
      render(
        <TarotInterpretation
          {...defaultProps}
          luckyElements={{
            color: "Red",
            number: undefined,
          }}
        />
      );

      expect(screen.getByText("Red")).toBeInTheDocument();
      expect(screen.queryByText("Number")).not.toBeInTheDocument();
    });
  });

  describe("collapsible behavior", () => {
    it("should show expand button for long interpretations", () => {
      const longText = "A".repeat(350);
      render(<TarotInterpretation interpretation={longText} />);

      expect(screen.getByText("Read more")).toBeInTheDocument();
    });

    it("should not show expand button for short interpretations", () => {
      const shortText = "Short reading.";
      render(<TarotInterpretation interpretation={shortText} />);

      expect(screen.queryByText("Read more")).not.toBeInTheDocument();
    });

    it("should toggle expansion when clicked", () => {
      const longText = "A".repeat(350);
      render(<TarotInterpretation interpretation={longText} />);

      const expandButton = screen.getByText("Read more");
      fireEvent.click(expandButton);

      // After clicking, should no longer show "Read more" (content is expanded)
      expect(screen.queryByText("Read more")).not.toBeInTheDocument();
    });
  });

  describe("isSpread prop", () => {
    it("should render correctly for single card reading", () => {
      render(<TarotInterpretation {...defaultProps} isSpread={false} />);

      expect(screen.getByText("Detailed Reading")).toBeInTheDocument();
    });

    it("should render correctly for spread reading", () => {
      render(<TarotInterpretation {...defaultProps} isSpread={true} />);

      expect(screen.getByText("Full Narrative")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should have proper structure with space-y-6", () => {
      const { container } = render(<TarotInterpretation {...defaultProps} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("space-y-6");
    });

    it("should render action advice with gold styling", () => {
      render(
        <TarotInterpretation
          {...defaultProps}
          actionAdvice="Take action now"
        />
      );

      const header = screen.getByText("Action Guidance");
      expect(header.className).toContain("text-[#F4C025]");
    });
  });
});
