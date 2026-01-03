import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TarotCard } from "@/pages/features/TarotCard";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      whileInView,
      transition,
      viewport,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock tarot cards data
vi.mock("@/src/data/tarot_cards.json", () => ({
  default: [
    { id: "m00", name: "The Fool", arcana: "Major" },
    { id: "m01", name: "The Magician", arcana: "Major" },
    { id: "m10", name: "Wheel of Fortune", arcana: "Major" },
    { id: "wands-01", name: "Ace of Wands", arcana: "Minor" },
    { id: "cups-02", name: "Two of Cups", arcana: "Minor" },
  ],
}));

describe("TarotCard", () => {
  const defaultProps = {
    title: "The Fool",
    position: "1",
    context: "Past",
    image: "/cards/the-fool.jpg",
  };

  describe("rendering", () => {
    it("should render the card title", () => {
      render(<TarotCard {...defaultProps} />);

      expect(screen.getByText("The Fool")).toBeInTheDocument();
    });

    it("should render the position label", () => {
      render(<TarotCard {...defaultProps} />);

      expect(screen.getByText("Position 1")).toBeInTheDocument();
    });

    it("should render the context", () => {
      render(<TarotCard {...defaultProps} />);

      expect(screen.getByText("Past")).toBeInTheDocument();
    });

    it("should render the card number for Major Arcana", () => {
      render(<TarotCard {...defaultProps} />);

      // The Fool is card 0
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("different cards", () => {
    it("should display I for The Magician", () => {
      render(<TarotCard {...defaultProps} title="The Magician" />);

      expect(screen.getByText("I")).toBeInTheDocument();
    });

    it("should display X for Wheel of Fortune", () => {
      render(<TarotCard {...defaultProps} title="Wheel of Fortune" />);

      expect(screen.getByText("X")).toBeInTheDocument();
    });

    it("should display I for Ace of Wands (Minor Arcana)", () => {
      render(<TarotCard {...defaultProps} title="Ace of Wands" />);

      expect(screen.getByText("I")).toBeInTheDocument();
    });

    it("should display II for Two of Cups (Minor Arcana)", () => {
      render(<TarotCard {...defaultProps} title="Two of Cups" />);

      expect(screen.getByText("II")).toBeInTheDocument();
    });

    it("should handle unknown card titles", () => {
      render(<TarotCard {...defaultProps} title="Unknown Card" />);

      expect(screen.getByText("Unknown Card")).toBeInTheDocument();
    });
  });

  describe("subtitle prop", () => {
    it("should render Reversed subtitle when provided", () => {
      render(<TarotCard {...defaultProps} subtitle="Reversed" />);

      expect(screen.getByText("Reversed")).toBeInTheDocument();
    });

    it("should not render subtitle when not Reversed", () => {
      render(<TarotCard {...defaultProps} subtitle="Upright" />);

      expect(screen.queryByText("Reversed")).not.toBeInTheDocument();
    });

    it("should not render subtitle when undefined", () => {
      render(<TarotCard {...defaultProps} />);

      expect(screen.queryByText("Reversed")).not.toBeInTheDocument();
    });
  });

  describe("active state", () => {
    it("should apply active styling when active is true", () => {
      const { container } = render(<TarotCard {...defaultProps} active={true} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("md:-mt-8");
    });

    it("should not apply active styling when active is false", () => {
      const { container } = render(<TarotCard {...defaultProps} active={false} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).not.toContain("md:-mt-8");
    });

    it("should apply gold color to context when active", () => {
      render(<TarotCard {...defaultProps} active={true} />);

      const context = screen.getByText("Past");
      expect(context.className).toContain("text-[#F4C025]");
    });

    it("should apply foreground color to context when inactive", () => {
      render(<TarotCard {...defaultProps} active={false} />);

      const context = screen.getByText("Past");
      expect(context.className).toContain("text-foreground");
    });
  });

  describe("image rendering", () => {
    it("should set background image style", () => {
      const { container } = render(<TarotCard {...defaultProps} />);

      // Find element with inline style containing backgroundImage
      const allDivs = container.querySelectorAll("div");
      const imageDiv = Array.from(allDivs).find(
        (div) => div.style.backgroundImage?.includes(defaultProps.image)
      );
      expect(imageDiv).toBeDefined();
    });
  });

  describe("position values", () => {
    it("should render position 1", () => {
      render(<TarotCard {...defaultProps} position="1" />);

      expect(screen.getByText("Position 1")).toBeInTheDocument();
    });

    it("should render position 2", () => {
      render(<TarotCard {...defaultProps} position="2" />);

      expect(screen.getByText("Position 2")).toBeInTheDocument();
    });

    it("should render position 3", () => {
      render(<TarotCard {...defaultProps} position="3" />);

      expect(screen.getByText("Position 3")).toBeInTheDocument();
    });
  });

  describe("context values", () => {
    it("should render Past context", () => {
      render(<TarotCard {...defaultProps} context="Past" />);

      expect(screen.getByText("Past")).toBeInTheDocument();
    });

    it("should render Present context", () => {
      render(<TarotCard {...defaultProps} context="Present" />);

      expect(screen.getByText("Present")).toBeInTheDocument();
    });

    it("should render Future context", () => {
      render(<TarotCard {...defaultProps} context="Future" />);

      expect(screen.getByText("Future")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should have flex layout on wrapper", () => {
      const { container } = render(<TarotCard {...defaultProps} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("flex-col");
      expect(wrapper?.className).toContain("items-center");
    });

    it("should have group class for hover effects", () => {
      const { container } = render(<TarotCard {...defaultProps} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("group");
    });

    it("should have z-10 class", () => {
      const { container } = render(<TarotCard {...defaultProps} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("z-10");
    });

    it("should apply uppercase to title", () => {
      render(<TarotCard {...defaultProps} />);

      const title = screen.getByText("The Fool");
      expect(title.className).toContain("uppercase");
    });
  });
});
