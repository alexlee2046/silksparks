import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Layout } from "@/components/layout/Layout";

// Mock Lenis
const mockLenisDestroy = vi.fn();
const mockLenisRaf = vi.fn();

vi.mock("lenis", () => ({
  default: class MockLenis {
    destroy = mockLenisDestroy;
    raf = mockLenisRaf;
    constructor() {}
  },
}));

// Mock Header
vi.mock("@/components/layout/Header", () => ({
  Header: ({ type, onAuthClick }: { type?: string; onAuthClick?: () => void }) => (
    <header data-testid="header" data-type={type}>
      Header
      {onAuthClick && <button onClick={onAuthClick}>Auth</button>}
    </header>
  ),
}));

// Mock Footer
vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock CosmicBackground
vi.mock("@/components/CosmicBackground", () => ({
  CosmicBackground: () => <div data-testid="cosmic-background">CosmicBackground</div>,
}));

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      render(<Layout>Content</Layout>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should render children", () => {
      render(
        <Layout>
          <div data-testid="child">Child Content</div>
        </Layout>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should render Header component", () => {
      render(<Layout>Content</Layout>);
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("should render Footer component", () => {
      render(<Layout>Content</Layout>);
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("should render main content area", () => {
      render(<Layout>Content</Layout>);
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(main.id).toBe("main-content");
    });
  });

  describe("type prop", () => {
    it("should default to public type", () => {
      render(<Layout>Content</Layout>);
      const header = screen.getByTestId("header");
      expect(header.getAttribute("data-type")).toBe("public");
    });

    it("should pass public type to Header", () => {
      render(<Layout type="public">Content</Layout>);
      const header = screen.getByTestId("header");
      expect(header.getAttribute("data-type")).toBe("public");
    });

    it("should pass user type to Header", () => {
      render(<Layout type="user">Content</Layout>);
      const header = screen.getByTestId("header");
      expect(header.getAttribute("data-type")).toBe("user");
    });

    it("should pass admin type to Header", () => {
      render(<Layout type="admin">Content</Layout>);
      const header = screen.getByTestId("header");
      expect(header.getAttribute("data-type")).toBe("admin");
    });
  });

  describe("onAuthClick prop", () => {
    it("should pass onAuthClick to Header", () => {
      const onAuthClick = vi.fn();
      render(<Layout onAuthClick={onAuthClick}>Content</Layout>);

      const authButton = screen.getByText("Auth");
      authButton.click();

      expect(onAuthClick).toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    it("should have flex column layout", () => {
      const { container } = render(<Layout>Content</Layout>);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("flex-col");
    });

    it("should have min-h-screen", () => {
      const { container } = render(<Layout>Content</Layout>);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("min-h-screen");
    });

    it("should have background class", () => {
      const { container } = render(<Layout>Content</Layout>);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("bg-background");
    });

    it("should have foreground text color", () => {
      const { container } = render(<Layout>Content</Layout>);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("text-foreground");
    });

    it("should have isolate class", () => {
      const { container } = render(<Layout>Content</Layout>);

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("isolate");
    });

    it("should have flex-1 on main content", () => {
      render(<Layout>Content</Layout>);

      const main = screen.getByRole("main");
      expect(main.className).toContain("flex-1");
    });

    it("should have z-10 on main content", () => {
      render(<Layout>Content</Layout>);

      const main = screen.getByRole("main");
      expect(main.className).toContain("z-10");
    });
  });

  describe("Lenis smooth scrolling", () => {
    it("should initialize Lenis on mount", () => {
      render(<Layout>Content</Layout>);
      // Lenis is initialized in useEffect
      expect(mockLenisDestroy).not.toHaveBeenCalled();
    });

    it("should destroy Lenis on unmount", () => {
      const { unmount } = render(<Layout>Content</Layout>);
      unmount();
      expect(mockLenisDestroy).toHaveBeenCalled();
    });
  });

  describe("CosmicBackground", () => {
    it("should render CosmicBackground inside Suspense", async () => {
      render(<Layout>Content</Layout>);
      // Wait for lazy load
      const cosmic = await screen.findByTestId("cosmic-background");
      expect(cosmic).toBeInTheDocument();
    });
  });

  describe("multiple children", () => {
    it("should render multiple children", () => {
      render(
        <Layout>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </Layout>
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
    });
  });

  describe("complex content", () => {
    it("should render nested elements", () => {
      render(
        <Layout>
          <section>
            <h1>Title</h1>
            <p>Paragraph</p>
          </section>
        </Layout>
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
    });
  });
});
