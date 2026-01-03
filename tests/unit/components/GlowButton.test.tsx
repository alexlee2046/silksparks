import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlowButton } from "@/components/GlowButton";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      whileHover,
      whileTap,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

describe("GlowButton", () => {
  describe("rendering", () => {
    it("should render children", () => {
      render(<GlowButton>Click Me</GlowButton>);

      expect(screen.getByText("Click Me")).toBeInTheDocument();
    });

    it("should render as a button element", () => {
      render(<GlowButton>Test</GlowButton>);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<GlowButton className="custom-class">Test</GlowButton>);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });
  });

  describe("variants", () => {
    it("should apply primary variant styles by default", () => {
      render(<GlowButton>Primary</GlowButton>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-primary");
      expect(button.className).toContain("text-background-dark");
    });

    it("should apply secondary variant styles", () => {
      render(<GlowButton variant="secondary">Secondary</GlowButton>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("border-surface-border");
    });

    it("should apply ghost variant styles", () => {
      render(<GlowButton variant="ghost">Ghost</GlowButton>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-transparent");
      expect(button.className).toContain("text-text-muted");
    });

    it("should apply cosmic variant styles", () => {
      render(<GlowButton variant="cosmic">Cosmic</GlowButton>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-gradient-to-r");
      expect(button.className).toContain("animate-gradient");
    });
  });

  describe("icon prop", () => {
    it("should render icon when provided", () => {
      render(<GlowButton icon="star">With Icon</GlowButton>);

      const icon = screen.getByText("star");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("material-symbols-outlined");
    });

    it("should not render icon when not provided", () => {
      render(<GlowButton>No Icon</GlowButton>);

      const icons = document.querySelectorAll(".material-symbols-outlined");
      expect(icons.length).toBe(0);
    });
  });

  describe("cosmic variant extras", () => {
    it("should render blur overlay for cosmic variant", () => {
      const { container } = render(<GlowButton variant="cosmic">Cosmic</GlowButton>);

      const blurOverlay = container.querySelector(".blur-lg");
      expect(blurOverlay).toBeInTheDocument();
    });

    it("should not render blur overlay for other variants", () => {
      const { container } = render(<GlowButton variant="primary">Primary</GlowButton>);

      const blurOverlay = container.querySelector(".blur-lg");
      expect(blurOverlay).not.toBeInTheDocument();
    });
  });

  describe("button props", () => {
    it("should handle onClick", () => {
      const handleClick = vi.fn();
      render(<GlowButton onClick={handleClick}>Click</GlowButton>);

      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should pass disabled prop", () => {
      render(<GlowButton disabled>Disabled</GlowButton>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should pass type prop", () => {
      render(<GlowButton type="submit">Submit</GlowButton>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("should have disabled styles when disabled", () => {
      render(<GlowButton disabled>Disabled</GlowButton>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("disabled:opacity-50");
      expect(button.className).toContain("disabled:cursor-not-allowed");
    });
  });

  describe("base styles", () => {
    it("should apply rounded-full style", () => {
      render(<GlowButton>Test</GlowButton>);

      expect(screen.getByRole("button").className).toContain("rounded-full");
    });

    it("should apply padding styles", () => {
      render(<GlowButton>Test</GlowButton>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("px-6");
      expect(button.className).toContain("py-3");
    });

    it("should apply flex styles for alignment", () => {
      render(<GlowButton>Test</GlowButton>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("inline-flex");
      expect(button.className).toContain("items-center");
      expect(button.className).toContain("justify-center");
    });
  });
});
