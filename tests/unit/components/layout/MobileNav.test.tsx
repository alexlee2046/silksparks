import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      onClick,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div
        {...props}
        onClick={onClick as React.MouseEventHandler<HTMLDivElement>}
      >
        {children}
      </div>
    ),
    nav: ({
      children,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <nav {...props}>{children}</nav>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock i18n messages
vi.mock("@/src/paraglide/messages", () => ({
  "common.appName": () => "Silk & Spark",
  "common.signIn": () => "Sign In",
  "common.signOut": () => "Sign Out",
  "user.defaultName": () => "Seeker",
  "nav.home": () => "Home",
  "nav.shop": () => "Shop",
  "nav.experts": () => "Experts",
  "nav.horoscope": () => "Horoscope",
  "nav.tarot": () => "Tarot",
  "nav.aiChat": () => "AI Chat",
  "nav.dashboard": () => "Dashboard",
  "nav.archives": () => "Archives",
  "nav.orders": () => "Orders",
  "nav.consultations": () => "Consultations",
  "nav.settings": () => "Settings",
  "accessibility.closeMenu": () => "Close menu",
}));

// Mock UserContext
const mockSignOut = vi.fn();
const mockSession = {
  user: { email: "test@example.com" },
};
const mockUser = { name: "John Doe" };

vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    session: mockSession,
    user: mockUser,
    signOut: mockSignOut,
  }),
}));

const renderWithRouter = (
  component: React.ReactNode,
  initialEntries = ["/"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

describe("MobileNav", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    type: "public" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  describe("rendering when closed", () => {
    it("should not render when isOpen is false", () => {
      renderWithRouter(
        <MobileNav {...defaultProps} isOpen={false} />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("rendering when open", () => {
    it("should render when isOpen is true", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should render app name", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(screen.getByText("Silk & Spark")).toBeInTheDocument();
    });

    it("should render close button", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
    });

    it("should have aria-modal attribute", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("should have navigation aria-label", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(
        screen.getByLabelText("Mobile navigation")
      ).toBeInTheDocument();
    });
  });

  describe("public navigation", () => {
    it("should render Home link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />);

      const link = screen.getByRole("link", { name: /Home/ });
      expect(link).toHaveAttribute("href", "/");
    });

    it("should render Shop link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />);

      const link = screen.getByRole("link", { name: /Shop/ });
      expect(link).toHaveAttribute("href", "/shop");
    });

    it("should render Experts link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />);

      const link = screen.getByRole("link", { name: /Experts/ });
      expect(link).toHaveAttribute("href", "/experts");
    });

    it("should render Horoscope link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />);

      const link = screen.getByRole("link", { name: /Horoscope/ });
      expect(link).toHaveAttribute("href", "/horoscope");
    });

    it("should render Tarot link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />);

      const link = screen.getByRole("link", { name: /Tarot/ });
      expect(link).toHaveAttribute("href", "/tarot");
    });

    it("should render AI Chat link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />);

      const link = screen.getByRole("link", { name: /AI Chat/ });
      expect(link).toHaveAttribute("href", "/tarot/spread");
    });
  });

  describe("user navigation", () => {
    it("should render Dashboard link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="user" />);

      const link = screen.getByRole("link", { name: /Dashboard/ });
      expect(link).toHaveAttribute("href", "/dashboard");
    });

    it("should render Archives link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="user" />);

      const link = screen.getByRole("link", { name: /Archives/ });
      expect(link).toHaveAttribute("href", "/dashboard/archives");
    });

    it("should render Orders link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="user" />);

      const link = screen.getByRole("link", { name: /Orders/ });
      expect(link).toHaveAttribute("href", "/dashboard/orders");
    });

    it("should render Consultations link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="user" />);

      const link = screen.getByRole("link", { name: /Consultations/ });
      expect(link).toHaveAttribute("href", "/dashboard/consultations");
    });

    it("should render Settings link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="user" />);

      const link = screen.getByRole("link", { name: /Settings/ });
      expect(link).toHaveAttribute("href", "/dashboard/settings");
    });
  });

  describe("admin navigation", () => {
    it("should render Payments link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="admin" />);

      const link = screen.getByRole("link", { name: /Payments/ });
      expect(link).toHaveAttribute("href", "/manage/payments");
    });

    it("should render Currency link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="admin" />);

      const link = screen.getByRole("link", { name: /Currency/ });
      expect(link).toHaveAttribute("href", "/manage/currency");
    });

    it("should render Shipping link", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="admin" />);

      const link = screen.getByRole("link", { name: /Shipping/ });
      expect(link).toHaveAttribute("href", "/manage/shipping");
    });
  });

  describe("user info when authenticated", () => {
    it("should display user name", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should display user email", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("should display user initial in avatar", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("should render Sign Out button", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });
  });

  describe("close button", () => {
    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn();
      renderWithRouter(<MobileNav {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText("Close menu"));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("backdrop click", () => {
    it("should call onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      const { container } = renderWithRouter(
        <MobileNav {...defaultProps} onClose={onClose} />
      );

      const backdrop = container.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("navigation link click", () => {
    it("should call onClose when a nav link is clicked", () => {
      const onClose = vi.fn();
      renderWithRouter(<MobileNav {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole("link", { name: /Shop/ }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("sign out", () => {
    it("should call signOut and onClose when Sign Out is clicked", () => {
      const onClose = vi.fn();
      renderWithRouter(<MobileNav {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText("Sign Out"));

      expect(mockSignOut).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("body scroll locking", () => {
    it("should set body overflow to hidden when open", () => {
      renderWithRouter(<MobileNav {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should reset body overflow when closed", () => {
      const { rerender } = render(
        <MemoryRouter>
          <MobileNav {...defaultProps} isOpen={true} />
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter>
          <MobileNav {...defaultProps} isOpen={false} />
        </MemoryRouter>
      );

      expect(document.body.style.overflow).toBe("");
    });

    it("should reset body overflow on unmount", () => {
      const { unmount } = renderWithRouter(
        <MobileNav {...defaultProps} isOpen={true} />
      );

      unmount();

      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("escape key handling", () => {
    it("should call onClose when Escape key is pressed", () => {
      const onClose = vi.fn();
      renderWithRouter(<MobileNav {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalled();
    });

    it("should not call onClose for other keys", () => {
      const onClose = vi.fn();
      renderWithRouter(<MobileNav {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: "Enter" });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("active link styling", () => {
    it("should apply active style to current route", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />, ["/"]);

      const homeLink = screen.getByRole("link", { name: /Home/ });
      expect(homeLink.className).toContain("bg-primary/10");
      expect(homeLink.className).toContain("text-primary");
    });

    it("should not apply active style to non-current routes", () => {
      renderWithRouter(<MobileNav {...defaultProps} type="public" />, ["/"]);

      const shopLink = screen.getByRole("link", { name: /Shop/ });
      expect(shopLink.className).toContain("text-text-muted");
    });
  });

  describe("styling", () => {
    it("should have fixed positioning on backdrop", () => {
      const { container } = renderWithRouter(<MobileNav {...defaultProps} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop?.className).toContain("fixed");
      expect(backdrop?.className).toContain("inset-0");
    });

    it("should have high z-index on backdrop", () => {
      const { container } = renderWithRouter(<MobileNav {...defaultProps} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop?.className).toContain("z-[60]");
    });

    it("should have higher z-index on drawer", () => {
      renderWithRouter(<MobileNav {...defaultProps} />);

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("z-[70]");
    });
  });
});
