import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TarotShareCard } from "@/components/TarotShareCard";
import type { TarotCard } from "@/services/ai/types";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock html2canvas
vi.mock("html2canvas", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toBlob: (callback: (blob: Blob | null) => void) =>
        callback(new Blob(["test"], { type: "image/png" })),
    })
  ),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TarotShareCard", () => {
  const mockCard: TarotCard = {
    id: "the-fool",
    name: "The Fool",
    arcana: "Major",
    image: "/cards/the-fool.jpg",
    isReversed: false,
    position: "present",
  };

  const mockInterpretation = "A new beginning awaits you. Trust your intuition and embrace the journey ahead.";
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.share and canShare
    Object.defineProperty(navigator, "share", {
      value: vi.fn(),
      writable: true,
    });
    Object.defineProperty(navigator, "canShare", {
      value: vi.fn(() => true),
      writable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn(() => Promise.resolve()) },
      writable: true,
    });
  });

  describe("rendering", () => {
    it("should render card name", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("The Fool")).toBeInTheDocument();
    });

    it("should render Daily Tarot label", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Daily Tarot")).toBeInTheDocument();
    });

    it("should render interpretation text", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/"A new beginning/)).toBeInTheDocument();
    });

    it("should render brand name", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Silk & Sparks")).toBeInTheDocument();
    });

    it("should render website URL", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("silksparks.com")).toBeInTheDocument();
    });

    it("should render card image", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const img = screen.getByAltText("The Fool");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/cards/the-fool.jpg");
    });

    it("should show Upright for non-reversed card", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Upright/)).toBeInTheDocument();
    });

    it("should show Reversed for reversed card", () => {
      const reversedCard = { ...mockCard, isReversed: true };

      render(
        <TarotShareCard
          card={reversedCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Reversed/)).toBeInTheDocument();
    });

    it("should show arcana type", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Major Arcana/)).toBeInTheDocument();
    });
  });

  describe("action buttons", () => {
    it("should render Share Image button", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("Share Image")).toBeInTheDocument();
    });

    it("should render copy button", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const copyIcon = document.querySelector('.material-symbols-outlined');
      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasCopyIcon = Array.from(icons).some((el) => el.textContent === "content_copy");
      expect(hasCopyIcon).toBe(true);
    });

    it("should render close button", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasCloseIcon = Array.from(icons).some((el) => el.textContent === "close");
      expect(hasCloseIcon).toBe(true);
    });
  });

  describe("interactions", () => {
    it("should call onClose when clicking backdrop", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      // Click on backdrop
      const backdrop = document.querySelector(".backdrop-blur-md");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("should call onClose when clicking close button", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      // Find close button by icon
      const buttons = document.querySelectorAll("button");
      const closeButton = Array.from(buttons).find((btn) =>
        btn.querySelector('.material-symbols-outlined')?.textContent === "close"
      );

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("should not close when clicking card content", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      // Click on card title
      fireEvent.click(screen.getByText("The Fool"));

      // onClose should not be called
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("date formatting", () => {
    it("should format custom date", () => {
      const customDate = new Date("2024-01-15");

      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          date={customDate}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
    });
  });

  describe("core message", () => {
    it("should use core message when provided", () => {
      const coreMessage = "Embrace new beginnings!";

      render(
        <TarotShareCard
          card={mockCard}
          coreMessage={coreMessage}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/"Embrace new beginnings!"/)).toBeInTheDocument();
    });

    it("should truncate long interpretation when no core message", () => {
      const longInterpretation = "A".repeat(150);

      render(
        <TarotShareCard
          card={mockCard}
          interpretation={longInterpretation}
          onClose={mockOnClose}
        />
      );

      // Should truncate to ~100 chars + "..."
      const text = screen.getByText(/"A+\.\.\."/).textContent;
      expect(text).toBeDefined();
    });
  });

  describe("reversed card styling", () => {
    it("should apply rotate-180 class for reversed card", () => {
      const reversedCard = { ...mockCard, isReversed: true };

      render(
        <TarotShareCard
          card={reversedCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const img = screen.getByAltText("The Fool");
      expect(img.className).toContain("rotate-180");
    });

    it("should show R badge for reversed card", () => {
      const reversedCard = { ...mockCard, isReversed: true };

      render(
        <TarotShareCard
          card={reversedCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("R")).toBeInTheDocument();
    });

    it("should not show R badge for upright card", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText("R")).not.toBeInTheDocument();
    });
  });

  describe("handleShare", () => {
    it("should show generating state when share clicked", async () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const shareButton = screen.getByText("Share Image");
      fireEvent.click(shareButton);

      expect(screen.getByText("Generating...")).toBeInTheDocument();
    });

    it("should call html2canvas when share clicked", async () => {
      const html2canvasModule = await import("html2canvas");
      const html2canvas = vi.mocked(html2canvasModule.default);

      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const shareButton = screen.getByText("Share Image");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalled();
      });
    });

    it("should show error toast when share fails", async () => {
      const html2canvasModule = await import("html2canvas");
      const html2canvas = vi.mocked(html2canvasModule.default);
      const toastModule = await import("react-hot-toast");
      const toast = toastModule.default;

      html2canvas.mockRejectedValueOnce(new Error("Canvas failed"));

      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const shareButton = screen.getByText("Share Image");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to generate share image");
      });
    });

    it("should disable share button while generating", async () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const shareButton = screen.getByText("Share Image");
      fireEvent.click(shareButton);

      const generatingButton = screen.getByText("Generating...").closest("button");
      expect(generatingButton).toBeDisabled();
    });

    it("should show share icon when not generating", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const icons = document.querySelectorAll('.material-symbols-outlined');
      const hasShareIcon = Array.from(icons).some((el) => el.textContent === "share");
      expect(hasShareIcon).toBe(true);
    });
  });

  describe("handleCopyText", () => {
    it("should copy text to clipboard when copy button clicked", async () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      // Find copy button
      const buttons = document.querySelectorAll("button");
      const copyButton = Array.from(buttons).find((btn) =>
        btn.querySelector('.material-symbols-outlined')?.textContent === "content_copy"
      );

      expect(copyButton).toBeDefined();

      if (copyButton) {
        fireEvent.click(copyButton);

        // The navigator.clipboard mock was set in beforeEach
        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
      }
    });

    it("should include card name in copied text", async () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const buttons = document.querySelectorAll("button");
      const copyButton = Array.from(buttons).find((btn) =>
        btn.querySelector('.material-symbols-outlined')?.textContent === "content_copy"
      );

      if (copyButton) {
        fireEvent.click(copyButton);

        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining("The Fool")
          );
        });
      }
    });

    it("should include (Reversed) in copied text for reversed card", async () => {
      const reversedCard = { ...mockCard, isReversed: true };

      render(
        <TarotShareCard
          card={reversedCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const buttons = document.querySelectorAll("button");
      const copyButton = Array.from(buttons).find((btn) =>
        btn.querySelector('.material-symbols-outlined')?.textContent === "content_copy"
      );

      if (copyButton) {
        fireEvent.click(copyButton);

        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining("(Reversed)")
          );
        });
      }
    });

    it("should include brand name in copied text", async () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const buttons = document.querySelectorAll("button");
      const copyButton = Array.from(buttons).find((btn) =>
        btn.querySelector('.material-symbols-outlined')?.textContent === "content_copy"
      );

      if (copyButton) {
        fireEvent.click(copyButton);

        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining("Silk & Sparks")
          );
        });
      }
    });
  });

  describe("accessibility", () => {
    it("should have crossorigin on image for CORS", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const img = screen.getByAltText("The Fool");
      expect(img).toHaveAttribute("crossorigin", "anonymous");
    });

    it("should have appropriate button styling", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const shareButton = screen.getByText("Share Image").closest("button");
      expect(shareButton).toHaveClass("bg-primary");
    });
  });

  describe("styling", () => {
    it("should have backdrop blur", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const backdrop = document.querySelector(".backdrop-blur-md");
      expect(backdrop).toBeInTheDocument();
    });

    it("should have gradient decoration", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      const gradient = document.querySelector(".bg-gradient-to-r");
      expect(gradient).toBeInTheDocument();
    });

    it("should have star icon for brand", () => {
      render(
        <TarotShareCard
          card={mockCard}
          interpretation={mockInterpretation}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText("✦")).toBeInTheDocument();
    });
  });
});
