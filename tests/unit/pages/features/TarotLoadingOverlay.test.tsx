import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TarotLoadingOverlay } from "@/pages/features/TarotLoadingOverlay";

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
    p: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("TarotLoadingOverlay", () => {
  describe("visibility", () => {
    it("should not render when isLoading is false", () => {
      const { container } = render(<TarotLoadingOverlay isLoading={false} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render when isLoading is true", () => {
      render(<TarotLoadingOverlay isLoading={true} />);

      expect(screen.getByText("Preparing your reading...")).toBeInTheDocument();
    });
  });

  describe("loading phases", () => {
    it("should show phase 1 message initially", () => {
      render(<TarotLoadingOverlay isLoading={true} />);

      // Phase 1 messages include these options
      const phase1Messages = [
        "Gazing into your card...",
        "The stars begin to align...",
        "Sensing the cosmic energy...",
      ];

      const foundMessage = phase1Messages.some((msg) =>
        screen.queryByText(msg)
      );
      expect(foundMessage).toBe(true);
    });
  });

  describe("card keywords", () => {
    it("should not show keywords immediately (elapsed < 2000ms)", () => {
      const cards = [{ id: "m00", name: "The Fool", image: "/fool.jpg", isReversed: false }];
      render(<TarotLoadingOverlay isLoading={true} cards={cards} />);

      // Initially (elapsed = 0), keywords should not show
      expect(screen.queryByText("Card Keywords")).not.toBeInTheDocument();
    });

    it("should show keywords when startTime indicates elapsed > 2000ms", async () => {
      const cards = [{ id: "m00", name: "The Fool", image: "/fool.jpg", isReversed: false }];
      // Set startTime to 3 seconds ago
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} cards={cards} startTime={startTime} />);

      // Wait for the interval to fire and state to update
      await waitFor(() => {
        expect(screen.getByText("Card Keywords")).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it("should display keywords for The Fool when elapsed > 2000ms", async () => {
      const cards = [{ id: "m00", name: "The Fool", image: "/fool.jpg", isReversed: false }];
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} cards={cards} startTime={startTime} />);

      // The Fool keywords: New Beginnings, Spontaneity, Leap of Faith
      await waitFor(() => {
        expect(screen.getByText("New Beginnings")).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it("should show reversed indicator for reversed cards", async () => {
      const cards = [{ id: "m00", name: "The Fool", image: "/fool.jpg", isReversed: true }];
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} cards={cards} startTime={startTime} />);

      await waitFor(() => {
        expect(screen.getByText("New Beginnings (Reversed)")).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it("should handle multiple cards", async () => {
      const cards = [
        { id: "m00", name: "The Fool", image: "/fool.jpg", isReversed: false },
        { id: "m01", name: "The Magician", image: "/magician.jpg", isReversed: false },
      ];
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} cards={cards} startTime={startTime} />);

      // Should show keywords from both cards
      await waitFor(() => {
        expect(screen.getByText("New Beginnings")).toBeInTheDocument();
        expect(screen.getByText("Manifestation")).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it("should limit displayed keywords to 6", async () => {
      const cards = [
        { id: "m00", name: "The Fool", image: "/fool.jpg", isReversed: false },
        { id: "m01", name: "The Magician", image: "/magician.jpg", isReversed: false },
        { id: "m02", name: "The High Priestess", image: "/priestess.jpg", isReversed: false },
      ];
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} cards={cards} startTime={startTime} />);

      // Each card has 3 keywords, so 9 total, but limited to 6
      await waitFor(() => {
        const keywords = screen.getAllByText(/New Beginnings|Spontaneity|Leap of Faith|Manifestation|Power|Skill/);
        expect(keywords.length).toBeLessThanOrEqual(6);
      }, { timeout: 500 });
    });
  });

  describe("progress indicators", () => {
    it("should render progress dots", () => {
      const { container } = render(<TarotLoadingOverlay isLoading={true} />);

      // Check for elements with the progress dot styling
      const progressSection = container.querySelector(".flex.gap-1\\.5");
      expect(progressSection).toBeInTheDocument();
    });
  });

  describe("empty cards", () => {
    it("should not show keywords section when no cards provided", async () => {
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} cards={[]} startTime={startTime} />);

      // Wait a bit to ensure state has updated
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(screen.queryByText("Card Keywords")).not.toBeInTheDocument();
    });

    it("should not show keywords section when cards is undefined", async () => {
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} startTime={startTime} />);

      // Wait a bit to ensure state has updated
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(screen.queryByText("Card Keywords")).not.toBeInTheDocument();
    });
  });

  describe("startTime prop", () => {
    it("should show Almost there when startTime indicates elapsed > 5000ms", async () => {
      const startTime = Date.now() - 6000;
      render(<TarotLoadingOverlay isLoading={true} startTime={startTime} />);

      await waitFor(() => {
        expect(screen.getByText("Almost there...")).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it("should show Preparing your reading when elapsed < 5000ms", () => {
      render(<TarotLoadingOverlay isLoading={true} />);

      // Initially elapsed = 0
      expect(screen.getByText("Preparing your reading...")).toBeInTheDocument();
    });
  });

  describe("state reset", () => {
    it("should not render content when isLoading becomes false", () => {
      const { rerender, container } = render(<TarotLoadingOverlay isLoading={true} />);

      // Verify it's rendering
      expect(screen.getByText("Preparing your reading...")).toBeInTheDocument();

      // Change to not loading
      rerender(<TarotLoadingOverlay isLoading={false} />);

      // Should not render anything
      expect(container.firstChild).toBeNull();
    });
  });

  describe("styling", () => {
    it("should have flex layout", () => {
      const { container } = render(<TarotLoadingOverlay isLoading={true} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("flex-col");
    });

    it("should have proper padding", () => {
      const { container } = render(<TarotLoadingOverlay isLoading={true} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("py-8");
    });
  });

  describe("unknown card handling", () => {
    it("should handle cards not in CARD_KEYWORDS gracefully", async () => {
      const cards = [{ id: "unknown", name: "Unknown Card", image: "/unknown.jpg", isReversed: false }];
      const startTime = Date.now() - 3000;
      render(<TarotLoadingOverlay isLoading={true} cards={cards} startTime={startTime} />);

      // Wait a bit to ensure state has updated
      await new Promise(resolve => setTimeout(resolve, 200));
      // Should not crash and should not show Card Keywords if no keywords found
      expect(screen.queryByText("Card Keywords")).not.toBeInTheDocument();
    });
  });
});
