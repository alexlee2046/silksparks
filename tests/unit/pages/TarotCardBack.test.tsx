import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TarotCardBack } from "@/pages/features/TarotCardBack";

describe("TarotCardBack", () => {
  describe("rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<TarotCardBack />);
      expect(container.firstElementChild).toBeInTheDocument();
    });

    it("should render Divine Guidance text", () => {
      render(<TarotCardBack />);
      expect(screen.getByText("Divine Guidance")).toBeInTheDocument();
    });

    it("should render Silk&Sparks brand", () => {
      const { container } = render(<TarotCardBack />);

      // Brand text is rendered as Silk<span>&</span>Sparks
      const brandContainer = container.querySelector(".bottom-5 span");
      expect(brandContainer?.textContent).toContain("Silk");
      expect(brandContainer?.textContent).toContain("&");
      expect(brandContainer?.textContent).toContain("Sparks");
    });
  });

  describe("showPattern prop", () => {
    it("should default showPattern to true", () => {
      const { container } = render(<TarotCardBack />);

      // Find SVG with higher opacity (0.9 when showPattern is true)
      const svgs = container.querySelectorAll("svg");
      const flowerSvg = Array.from(svgs).find(
        (svg) => svg.getAttribute("viewBox") === "0 0 200 200"
      );
      expect(flowerSvg?.style.opacity).toBe("0.9");
    });

    it("should show pattern with higher opacity when showPattern is true", () => {
      const { container } = render(<TarotCardBack showPattern={true} />);

      const svgs = container.querySelectorAll("svg");
      const flowerSvg = Array.from(svgs).find(
        (svg) => svg.getAttribute("viewBox") === "0 0 200 200"
      );
      expect(flowerSvg?.style.opacity).toBe("0.9");
    });

    it("should show pattern with lower opacity when showPattern is false", () => {
      const { container } = render(<TarotCardBack showPattern={false} />);

      const svgs = container.querySelectorAll("svg");
      const flowerSvg = Array.from(svgs).find(
        (svg) => svg.getAttribute("viewBox") === "0 0 200 200"
      );
      expect(flowerSvg?.style.opacity).toBe("0.35");
    });
  });

  describe("styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(<TarotCardBack />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("rounded-2xl");
    });

    it("should have dark background gradient", () => {
      const { container } = render(<TarotCardBack />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("bg-gradient-to-b");
    });

    it("should have gold border", () => {
      const { container } = render(<TarotCardBack />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("border");
      expect(wrapper?.className).toContain("border-[#F4C025]/40");
    });

    it("should have overflow hidden", () => {
      const { container } = render(<TarotCardBack />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("overflow-hidden");
    });

    it("should have shadow", () => {
      const { container } = render(<TarotCardBack />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("shadow-2xl");
    });

    it("should have flex layout centered", () => {
      const { container } = render(<TarotCardBack />);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("flex-col");
      expect(wrapper?.className).toContain("items-center");
      expect(wrapper?.className).toContain("justify-center");
    });
  });

  describe("SVG elements", () => {
    it("should render the Flower of Life SVG", () => {
      const { container } = render(<TarotCardBack />);

      const svgs = container.querySelectorAll("svg");
      const flowerSvg = Array.from(svgs).find(
        (svg) => svg.getAttribute("viewBox") === "0 0 200 200"
      );
      expect(flowerSvg).toBeInTheDocument();
    });

    it("should render center circle", () => {
      const { container } = render(<TarotCardBack />);

      const circles = container.querySelectorAll("circle");
      const centerCircle = Array.from(circles).find(
        (c) => c.getAttribute("cx") === "100" && c.getAttribute("cy") === "100" && c.getAttribute("r") === "30"
      );
      expect(centerCircle).toBeInTheDocument();
    });

    it("should render multiple circles for Flower of Life pattern", () => {
      const { container } = render(<TarotCardBack />);

      const circles = container.querySelectorAll("circle");
      // Should have many circles: center + 6 first ring + 6 second ring + 6 outer + outer boundaries + other decorative
      expect(circles.length).toBeGreaterThan(15);
    });

    it("should render corner ornaments", () => {
      const { container } = render(<TarotCardBack />);

      // 4 corner ornaments with rotation
      const cornerDivs = container.querySelectorAll(".pointer-events-none.w-6.h-6");
      expect(cornerDivs.length).toBe(4);
    });

    it("should render star icon in top decoration", () => {
      const { container } = render(<TarotCardBack />);

      const starPaths = container.querySelectorAll("path");
      const hasStar = Array.from(starPaths).some((path) =>
        path.getAttribute("d")?.includes("L12 2")
      );
      expect(hasStar).toBe(true);
    });
  });

  describe("decorative elements", () => {
    it("should render background gradient overlay", () => {
      const { container } = render(<TarotCardBack />);

      const gradientOverlay = container.querySelector(".bg-gradient-to-br");
      expect(gradientOverlay).toBeInTheDocument();
    });

    it("should render dot pattern", () => {
      const { container } = render(<TarotCardBack />);

      // Find element with radial-gradient background
      const allDivs = container.querySelectorAll("div");
      const dotPattern = Array.from(allDivs).find((div) =>
        div.style.backgroundImage?.includes("radial-gradient")
      );
      expect(dotPattern).toBeDefined();
    });

    it("should render outer decorative border", () => {
      const { container } = render(<TarotCardBack />);

      const outerBorder = container.querySelector(".inset-2.border");
      expect(outerBorder).toBeInTheDocument();
    });

    it("should render inner frame", () => {
      const { container } = render(<TarotCardBack />);

      const innerFrame = container.querySelector(".inset-4.border-2");
      expect(innerFrame).toBeInTheDocument();
    });

    it("should render top decoration element", () => {
      const { container } = render(<TarotCardBack />);

      const topDecor = container.querySelector(".top-6");
      expect(topDecor).toBeInTheDocument();
    });

    it("should render bottom logo element", () => {
      const { container } = render(<TarotCardBack />);

      const bottomDecor = container.querySelector(".bottom-5");
      expect(bottomDecor).toBeInTheDocument();
    });
  });

  describe("hover effects setup", () => {
    it("should have glow effect container", () => {
      const { container } = render(<TarotCardBack />);

      const glowEffect = container.querySelector(".blur-2xl");
      expect(glowEffect).toBeInTheDocument();
    });

    it("should have ambient shine effect container", () => {
      const { container } = render(<TarotCardBack />);

      const shineEffect = container.querySelector(".via-white\\/\\[0\\.02\\]");
      expect(shineEffect).toBeInTheDocument();
    });

    it("should have transition classes for hover effects", () => {
      const { container } = render(<TarotCardBack />);

      const transitionElements = container.querySelectorAll("[class*='transition']");
      expect(transitionElements.length).toBeGreaterThan(0);
    });
  });

  describe("Divine Guidance styling", () => {
    it("should have uppercase text", () => {
      render(<TarotCardBack />);

      const text = screen.getByText("Divine Guidance");
      expect(text.className).toContain("uppercase");
    });

    it("should have tracking (letter-spacing)", () => {
      render(<TarotCardBack />);

      const text = screen.getByText("Divine Guidance");
      expect(text.className).toContain("tracking-");
    });

    it("should have serif font", () => {
      render(<TarotCardBack />);

      const text = screen.getByText("Divine Guidance");
      expect(text.className).toContain("font-serif");
    });
  });

  describe("brand styling", () => {
    it("should have brand text with gold color", () => {
      const { container } = render(<TarotCardBack />);

      // Brand is contained in span elements with gold color
      const brandSpans = container.querySelectorAll("span");
      const hasGoldText = Array.from(brandSpans).some(
        (span) => span.className.includes("text-[#F4C025]")
      );
      expect(hasGoldText).toBe(true);
    });

    it("should have ampersand as separate styled element", () => {
      const { container } = render(<TarotCardBack />);

      // Look for a span that contains just "&"
      const spans = container.querySelectorAll("span");
      const ampersandSpan = Array.from(spans).find(
        (span) => span.textContent === "&"
      );
      expect(ampersandSpan).toBeDefined();
    });
  });
});
