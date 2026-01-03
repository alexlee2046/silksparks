import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlassCard } from "@/components/GlassCard";

describe("GlassCard", () => {
  // Helper to get the outer container (root element)
  const getContainer = (text: string) => {
    const content = screen.getByText(text);
    const innerWrapper = content.closest(".z-10");
    return innerWrapper?.parentElement;
  };

  describe("rendering", () => {
    it("should render children", () => {
      render(
        <GlassCard>
          <span data-testid="child">Test Content</span>
        </GlassCard>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should apply base styles", () => {
      render(<GlassCard>Content</GlassCard>);

      const card = getContainer("Content");
      expect(card?.className).toContain("backdrop-blur-md");
      expect(card?.className).toContain("rounded-2xl");
      expect(card?.className).toContain("border");
      expect(card?.className).toContain("overflow-hidden");
    });

    it("should apply custom className", () => {
      render(<GlassCard className="custom-class">Content</GlassCard>);

      const card = getContainer("Content");
      expect(card?.className).toContain("custom-class");
    });
  });

  describe("intensity prop", () => {
    it("should apply low intensity styles", () => {
      render(
        <GlassCard intensity="low">
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).toContain("bg-surface/30");
    });

    it("should apply medium intensity styles by default", () => {
      render(
        <GlassCard>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).toContain("bg-surface/60");
    });

    it("should apply high intensity styles", () => {
      render(
        <GlassCard intensity="high">
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).toContain("bg-surface/90");
    });
  });

  describe("hover effects", () => {
    it("should not apply hover styles by default", () => {
      render(
        <GlassCard>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).not.toContain("hover:-translate-y-1");
    });

    it("should apply hover styles when hoverEffect is true", () => {
      render(
        <GlassCard hoverEffect>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).toContain("hover:-translate-y-1");
    });
  });

  describe("interactive mode", () => {
    it("should apply cursor pointer when interactive", () => {
      render(
        <GlassCard interactive>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).toContain("cursor-pointer");
    });

    it("should not apply cursor pointer when not interactive", () => {
      render(
        <GlassCard>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).not.toContain("cursor-pointer");
    });

    it("should apply hover styles when interactive", () => {
      render(
        <GlassCard interactive>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(card?.className).toContain("hover:-translate-y-1");
    });
  });

  describe("onClick handler", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(
        <GlassCard onClick={handleClick}>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      fireEvent.click(card!);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not throw when clicked without onClick handler", () => {
      render(
        <GlassCard>
          <span>Content</span>
        </GlassCard>
      );

      const card = getContainer("Content");
      expect(() => fireEvent.click(card!)).not.toThrow();
    });
  });

  describe("overlay and structure", () => {
    it("should render glossy gradient overlay", () => {
      const { container } = render(
        <GlassCard>
          <span>Content</span>
        </GlassCard>
      );

      // Check for gradient overlay div
      const overlay = container.querySelector(".bg-gradient-to-br");
      expect(overlay).toBeInTheDocument();
    });

    it("should render content with z-10 wrapper", () => {
      const { container } = render(
        <GlassCard>
          <span>Content</span>
        </GlassCard>
      );

      const contentWrapper = container.querySelector(".z-10");
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper?.textContent).toBe("Content");
    });

    it("should have pointer-events-none on gradient overlay", () => {
      const { container } = render(
        <GlassCard>
          <span>Content</span>
        </GlassCard>
      );

      const overlay = container.querySelector(".bg-gradient-to-br");
      expect(overlay?.className).toContain("pointer-events-none");
    });
  });
});
