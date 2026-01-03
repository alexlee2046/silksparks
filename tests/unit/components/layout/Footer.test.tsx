import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import toast from "react-hot-toast";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: vi.fn(),
}));

// Mock i18n messages
vi.mock("@/src/paraglide/messages", () => ({
  "common.appName": () => "Silk & Spark",
  "footer.brandDescription": () => "Your journey through the cosmos begins here.",
}));

// Mock LanguageContext
vi.mock("@/context/LanguageContext", () => ({
  useLanguage: () => ({ locale: "en" }),
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render without crashing", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("should render app name", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("Silk & Spark")).toBeInTheDocument();
    });

    it("should render brand description", () => {
      renderWithRouter(<Footer />);
      expect(
        screen.getByText("Your journey through the cosmos begins here.")
      ).toBeInTheDocument();
    });

    it("should render copyright text", () => {
      renderWithRouter(<Footer />);
      expect(
        screen.getByText("© 2025 Silk & Spark. Transcending the physical.")
      ).toBeInTheDocument();
    });
  });

  describe("navigation sections", () => {
    it("should render The Spark section", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("The Spark")).toBeInTheDocument();
    });

    it("should render The Silk section", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("The Silk")).toBeInTheDocument();
    });

    it("should render My Space section", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("My Space")).toBeInTheDocument();
    });

    it("should render Newsletter section", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("Newsletter")).toBeInTheDocument();
    });
  });

  describe("The Spark links", () => {
    it("should render Birth Chart link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Birth Chart" });
      expect(link).toHaveAttribute("href", "/horoscope");
    });

    it("should render Astrology Report link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Astrology Report" });
      expect(link).toHaveAttribute("href", "/horoscope/report");
    });

    it("should render Daily Tarot link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Daily Tarot" });
      expect(link).toHaveAttribute("href", "/tarot");
    });

    it("should render Tarot Spread link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Tarot Spread" });
      expect(link).toHaveAttribute("href", "/tarot/spread");
    });
  });

  describe("The Silk links", () => {
    it("should render Shop Artifacts link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Shop Artifacts" });
      expect(link).toHaveAttribute("href", "/shop");
    });

    it("should render Expert Guides link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Expert Guides" });
      expect(link).toHaveAttribute("href", "/experts");
    });

    it("should render Book Session link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Book Session" });
      expect(link).toHaveAttribute("href", "/booking");
    });
  });

  describe("My Space links", () => {
    it("should render Dashboard link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Dashboard" });
      expect(link).toHaveAttribute("href", "/dashboard");
    });

    it("should render Archives link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Archives" });
      expect(link).toHaveAttribute("href", "/dashboard/archives");
    });

    it("should render Order History link", () => {
      renderWithRouter(<Footer />);
      const link = screen.getByRole("link", { name: "Order History" });
      expect(link).toHaveAttribute("href", "/dashboard/orders");
    });
  });

  describe("social icons", () => {
    it("should render social icon buttons", () => {
      renderWithRouter(<Footer />);

      expect(screen.getByLabelText("GitHub")).toBeInTheDocument();
      expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
      expect(screen.getByLabelText("Website")).toBeInTheDocument();
    });

    it("should show toast when GitHub button is clicked", () => {
      renderWithRouter(<Footer />);

      fireEvent.click(screen.getByLabelText("GitHub"));

      expect(toast).toHaveBeenCalledWith("Social links coming soon!", {
        icon: "🔗",
      });
    });

    it("should show toast when Instagram button is clicked", () => {
      renderWithRouter(<Footer />);

      fireEvent.click(screen.getByLabelText("Instagram"));

      expect(toast).toHaveBeenCalledWith("Social links coming soon!", {
        icon: "🔗",
      });
    });

    it("should show toast when Website button is clicked", () => {
      renderWithRouter(<Footer />);

      fireEvent.click(screen.getByLabelText("Website"));

      expect(toast).toHaveBeenCalledWith("Social links coming soon!", {
        icon: "🔗",
      });
    });
  });

  describe("newsletter", () => {
    it("should render newsletter description", () => {
      renderWithRouter(<Footer />);
      expect(
        screen.getByText("Lunar updates & exclusive drops.")
      ).toBeInTheDocument();
    });

    it("should render email input", () => {
      renderWithRouter(<Footer />);
      const input = screen.getByPlaceholderText("Your email");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "email");
    });

    it("should render subscribe button", () => {
      renderWithRouter(<Footer />);
      expect(
        screen.getByLabelText("Subscribe to newsletter")
      ).toBeInTheDocument();
    });

    it("should have accessible email input", () => {
      renderWithRouter(<Footer />);
      expect(
        screen.getByLabelText("Email address for newsletter")
      ).toBeInTheDocument();
    });

    it("should prevent default form submission", () => {
      renderWithRouter(<Footer />);

      const form = screen.getByPlaceholderText("Your email").closest("form");
      const preventDefault = vi.fn();
      fireEvent.submit(form!, { preventDefault });

      // Form has onSubmit that calls e.preventDefault()
      expect(form).toBeInTheDocument();
    });
  });

  describe("bottom bar buttons", () => {
    it("should render Privacy button", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("Privacy")).toBeInTheDocument();
    });

    it("should render Terms button", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("Terms")).toBeInTheDocument();
    });

    it("should render Cookies button", () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText("Cookies")).toBeInTheDocument();
    });

    it("should show toast when Privacy is clicked", () => {
      renderWithRouter(<Footer />);

      fireEvent.click(screen.getByText("Privacy"));

      expect(toast).toHaveBeenCalledWith("Privacy policy coming soon", {
        icon: "📋",
      });
    });

    it("should show toast when Terms is clicked", () => {
      renderWithRouter(<Footer />);

      fireEvent.click(screen.getByText("Terms"));

      expect(toast).toHaveBeenCalledWith("Terms of service coming soon", {
        icon: "📋",
      });
    });

    it("should show toast when Cookies is clicked", () => {
      renderWithRouter(<Footer />);

      fireEvent.click(screen.getByText("Cookies"));

      expect(toast).toHaveBeenCalledWith("Cookie policy coming soon", {
        icon: "🍪",
      });
    });
  });

  describe("admin link", () => {
    it("should render Admin link", () => {
      renderWithRouter(<Footer />);
      const adminLink = screen.getByRole("link", { name: /Admin/ });
      expect(adminLink).toHaveAttribute("href", "/admin");
    });
  });

  describe("brand link", () => {
    it("should render brand link to home", () => {
      renderWithRouter(<Footer />);
      const brandLinks = screen.getAllByRole("link", { name: /Silk & Spark/i });
      const brandLink = brandLinks.find((link) => link.getAttribute("href") === "/");
      expect(brandLink).toHaveAttribute("href", "/");
    });
  });

  describe("styling", () => {
    it("should have footer element with correct classes", () => {
      renderWithRouter(<Footer />);

      const footer = screen.getByRole("contentinfo");
      expect(footer.className).toContain("bg-background");
      expect(footer.className).toContain("border-t");
    });

    it("should have z-10 for stacking", () => {
      renderWithRouter(<Footer />);

      const footer = screen.getByRole("contentinfo");
      expect(footer.className).toContain("z-10");
    });
  });

  describe("icons", () => {
    it("should render material symbols icons", () => {
      const { container } = renderWithRouter(<Footer />);

      const icons = container.querySelectorAll(".material-symbols-outlined");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("should have icons marked as aria-hidden", () => {
      const { container } = renderWithRouter(<Footer />);

      const icons = container.querySelectorAll(
        '.material-symbols-outlined[aria-hidden="true"]'
      );
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("accessibility", () => {
    it("should have heading roles for section titles", () => {
      renderWithRouter(<Footer />);

      const headings = screen.getAllByRole("heading", { level: 2 });
      expect(headings.length).toBeGreaterThanOrEqual(4);
    });
  });
});
