import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ElementBar } from "@/pages/features/ElementBar";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      transition,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div
        {...props}
        style={{
          ...(props.style as object),
          width: typeof animate === "object" && "width" in animate ? (animate as { width: string }).width : undefined,
        }}
      >
        {children}
      </div>
    ),
  },
}));

describe("ElementBar", () => {
  const defaultProps = {
    icon: "local_fire_department",
    label: "Fire",
    percent: "45%",
    color: "bg-red-500",
  };

  describe("rendering", () => {
    it("should render the icon", () => {
      render(<ElementBar {...defaultProps} />);

      expect(screen.getByText("local_fire_department")).toBeInTheDocument();
    });

    it("should render the label", () => {
      render(<ElementBar {...defaultProps} />);

      expect(screen.getByText("Fire")).toBeInTheDocument();
    });

    it("should render the percent value", () => {
      render(<ElementBar {...defaultProps} />);

      expect(screen.getByText("45%")).toBeInTheDocument();
    });

    it("should apply color class to progress bar", () => {
      const { container } = render(<ElementBar {...defaultProps} />);

      const progressBar = container.querySelector(".bg-red-500");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("different element types", () => {
    it("should render Fire element correctly", () => {
      render(
        <ElementBar
          icon="local_fire_department"
          label="Fire"
          percent="30%"
          color="bg-red-500"
        />
      );

      expect(screen.getByText("Fire")).toBeInTheDocument();
      expect(screen.getByText("30%")).toBeInTheDocument();
    });

    it("should render Earth element correctly", () => {
      render(
        <ElementBar
          icon="landscape"
          label="Earth"
          percent="25%"
          color="bg-amber-600"
        />
      );

      expect(screen.getByText("Earth")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
    });

    it("should render Metal element correctly", () => {
      render(
        <ElementBar
          icon="diamond"
          label="Metal"
          percent="20%"
          color="bg-gray-400"
        />
      );

      expect(screen.getByText("Metal")).toBeInTheDocument();
      expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("should render Water element correctly", () => {
      render(
        <ElementBar
          icon="water_drop"
          label="Water"
          percent="15%"
          color="bg-blue-500"
        />
      );

      expect(screen.getByText("Water")).toBeInTheDocument();
      expect(screen.getByText("15%")).toBeInTheDocument();
    });

    it("should render Wood element correctly", () => {
      render(
        <ElementBar
          icon="forest"
          label="Wood"
          percent="10%"
          color="bg-green-500"
        />
      );

      expect(screen.getByText("Wood")).toBeInTheDocument();
      expect(screen.getByText("10%")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should have flex layout", () => {
      const { container } = render(<ElementBar {...defaultProps} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("items-center");
    });

    it("should have gap between elements", () => {
      const { container } = render(<ElementBar {...defaultProps} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("gap-4");
    });

    it("should have group class for hover effects", () => {
      const { container } = render(<ElementBar {...defaultProps} />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("group");
    });

    it("should have rounded progress bar container", () => {
      const { container } = render(<ElementBar {...defaultProps} />);

      const barContainer = container.querySelector(".rounded-full");
      expect(barContainer).toBeInTheDocument();
    });

    it("should have fixed width for label container", () => {
      const { container } = render(<ElementBar {...defaultProps} />);

      const labelContainer = container.querySelector(".w-20");
      expect(labelContainer).toBeInTheDocument();
    });
  });

  describe("percentage display", () => {
    it("should render 0% correctly", () => {
      render(<ElementBar {...defaultProps} percent="0%" />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should render 100% correctly", () => {
      render(<ElementBar {...defaultProps} percent="100%" />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should render decimal percentages", () => {
      render(<ElementBar {...defaultProps} percent="33.33%" />);

      expect(screen.getByText("33.33%")).toBeInTheDocument();
    });
  });

  describe("icon styling", () => {
    it("should apply material-symbols-outlined class to icon", () => {
      render(<ElementBar {...defaultProps} />);

      const icon = screen.getByText(defaultProps.icon);
      expect(icon.className).toContain("material-symbols-outlined");
    });

    it("should apply small text size to icon", () => {
      render(<ElementBar {...defaultProps} />);

      const icon = screen.getByText(defaultProps.icon);
      expect(icon.className).toContain("text-sm");
    });
  });

  describe("percentage text styling", () => {
    it("should apply font-mono to percentage", () => {
      render(<ElementBar {...defaultProps} />);

      const percentText = screen.getByText(defaultProps.percent);
      expect(percentText.className).toContain("font-mono");
    });

    it("should apply muted text color", () => {
      render(<ElementBar {...defaultProps} />);

      const percentText = screen.getByText(defaultProps.percent);
      expect(percentText.className).toContain("text-text-muted");
    });
  });
});
