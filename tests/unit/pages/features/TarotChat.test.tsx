import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-hot-toast - hoisted to avoid initialization errors
const { mockToast, mockToastError } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: Object.assign(mockToast, {
    error: mockToastError,
    success: vi.fn(),
  }),
}));

// Mock AI Service
vi.mock("@/services/ai", () => ({
  default: {
    generateTarotReading: vi.fn().mockResolvedValue({
      interpretation: "The universe responds to your question with clarity and insight.",
      cardInterpretations: [],
      meta: { provider: "mock", model: "test" },
    }),
  },
}));

// Mock UserContext
let mockIsPremium = false;
vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    session: { user: { id: "user-123" } },
    profile: { tier: mockIsPremium ? "premium" : "free" },
  }),
}));

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Import component after mocks
import { TarotChat } from "@/pages/features/TarotChat";

describe("TarotChat", () => {
  const mockOnClose = vi.fn();
  const mockDrawnCards = [
    { id: "major-0", name: "The Fool", arcana: "Major" as const, image: "/fool.jpg", isReversed: false },
  ];
  const mockInitialReading = {
    interpretation: "The Fool indicates new beginnings and a fresh start.",
    cardInterpretations: [{ cardName: "The Fool", meaning: "New beginnings" }],
    actionAdvice: "Take a leap of faith",
    meta: { provider: "mock" as const, model: "test" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPremium = false;
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(document.body).toBeInTheDocument();
    });

    it("should display Ask the Cards header", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Ask the Cards")).toBeInTheDocument();
    });

    it("should show card count", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("1 card drawn")).toBeInTheDocument();
    });

    it("should show plural for multiple cards", () => {
      const threeCards = [
        ...mockDrawnCards,
        { id: "major-1", name: "The Magician", arcana: "Major" as const, image: "/magician.jpg", isReversed: false },
        { id: "major-2", name: "The High Priestess", arcana: "Major" as const, image: "/priestess.jpg", isReversed: true },
      ];
      render(
        <TarotChat
          drawnCards={threeCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("3 cards drawn")).toBeInTheDocument();
    });

    it("should display initial reading", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Initial Reading")).toBeInTheDocument();
      expect(screen.getByText(mockInitialReading.interpretation)).toBeInTheDocument();
    });

    it("should display drawn card names", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("The Fool")).toBeInTheDocument();
    });

    it("should show reversed indicator", () => {
      const reversedCard = [
        { id: "major-0", name: "The Fool", arcana: "Major" as const, image: "/fool.jpg", isReversed: true },
      ];
      render(
        <TarotChat
          drawnCards={reversedCard}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("(R)")).toBeInTheDocument();
    });
  });

  describe("free user limits", () => {
    it("should show free questions counter", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Free questions:")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should have input field for questions", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByPlaceholderText("Ask a follow-up question...")).toBeInTheDocument();
    });

    it("should have send button", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find(btn =>
        btn.querySelector(".material-symbols-outlined")?.textContent === "send"
      );
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe("premium user", () => {
    beforeEach(() => {
      mockIsPremium = true;
    });

    it("should show Unlimited badge for premium users", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Unlimited")).toBeInTheDocument();
    });

    it("should not show free questions counter", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      expect(screen.queryByText("Free questions:")).not.toBeInTheDocument();
    });
  });

  describe("close functionality", () => {
    it("should have close button", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      const buttons = screen.getAllByRole("button");
      const closeButton = buttons.find(btn =>
        btn.querySelector(".material-symbols-outlined")?.textContent === "close"
      );
      expect(closeButton).toBeInTheDocument();
    });

    it("should call onClose when close button clicked", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      const buttons = screen.getAllByRole("button");
      const closeButton = buttons.find(btn =>
        btn.querySelector(".material-symbols-outlined")?.textContent === "close"
      );
      fireEvent.click(closeButton!);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when backdrop clicked", () => {
      const { container } = render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      // Click on the backdrop (the outer div with onClick={onClose})
      const backdrop = container.querySelector(".fixed.inset-0");
      fireEvent.click(backdrop!);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not close when dialog content clicked", () => {
      const { container } = render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      // Click on the dialog content
      const dialogContent = container.querySelector(".max-w-2xl");
      fireEvent.click(dialogContent!);
      // onClose should not be called because stopPropagation is used
      expect(mockOnClose).toHaveBeenCalledTimes(0);
    });
  });

  describe("sending messages", () => {
    it("should allow typing in input", () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );
      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "What does this mean?" } });
      expect(input).toHaveValue("What does this mean?");
    });

    it("should send message on button click", async () => {
      const AIService = (await import("@/services/ai")).default;

      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "What does this mean?" } });

      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find(btn =>
        btn.querySelector(".material-symbols-outlined")?.textContent === "send"
      );
      fireEvent.click(sendButton!);

      await waitFor(() => {
        expect(AIService.generateTarotReading).toHaveBeenCalled();
      });
    });

    it("should send message on Enter key", async () => {
      const AIService = (await import("@/services/ai")).default;

      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "What does this mean?" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(AIService.generateTarotReading).toHaveBeenCalled();
      });
    });

    it("should clear input after sending", async () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "What does this mean?" } });

      const buttons = screen.getAllByRole("button");
      const sendButton = buttons.find(btn =>
        btn.querySelector(".material-symbols-outlined")?.textContent === "send"
      );
      fireEvent.click(sendButton!);

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("should show user message in chat", async () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "What does this mean?" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText("What does this mean?")).toBeInTheDocument();
      });
    });

    it("should show AI response in chat", async () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "What does this mean?" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText(/universe responds/)).toBeInTheDocument();
      });
    });
  });

  describe("follow-up limits", () => {
    it("should decrement counter after each question", async () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      // Initially shows 2
      expect(screen.getByText("2")).toBeInTheDocument();

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "Question 1" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("should show upgrade prompt when limit reached", async () => {
      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");

      // Send first question
      fireEvent.change(input, { target: { value: "Question 1" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });

      // Wait for input to be available again
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });

      // Send second question
      fireEvent.change(input, { target: { value: "Question 2" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText("You've used all free follow-up questions")).toBeInTheDocument();
        expect(screen.getByText("Upgrade for Unlimited")).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should show error message on AI failure", async () => {
      const AIService = (await import("@/services/ai")).default;
      vi.mocked(AIService.generateTarotReading).mockRejectedValueOnce(
        new Error("AI service error")
      );

      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "Question" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText(/cosmic connection is unstable/)).toBeInTheDocument();
      });
    });

    it("should call toast.error on failure", async () => {
      const AIService = (await import("@/services/ai")).default;
      vi.mocked(AIService.generateTarotReading).mockRejectedValueOnce(
        new Error("AI service error")
      );

      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "Question" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Failed to get response. Please try again."
        );
      });
    });
  });

  describe("loading state", () => {
    it("should show loading indicator while waiting for response", async () => {
      const AIService = (await import("@/services/ai")).default;
      vi.mocked(AIService.generateTarotReading).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          interpretation: "Response",
          cardInterpretations: [],
          meta: { provider: "mock" as const, model: "test" },
        }), 100))
      );

      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "Question" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText("Consulting the stars")).toBeInTheDocument();
      });
    });

    it("should disable input while loading", async () => {
      const AIService = (await import("@/services/ai")).default;
      vi.mocked(AIService.generateTarotReading).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          interpretation: "Response",
          cardInterpretations: [],
          meta: { provider: "mock" as const, model: "test" },
        }), 100))
      );

      render(
        <TarotChat
          drawnCards={mockDrawnCards}
          initialReading={mockInitialReading}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText("Ask a follow-up question...");
      fireEvent.change(input, { target: { value: "Question" } });
      fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });
  });
});
