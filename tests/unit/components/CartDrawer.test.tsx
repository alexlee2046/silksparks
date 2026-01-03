import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartDrawer } from "@/components/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      whileHover,
      whileTap,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock PaymentService
vi.mock("@/services/PaymentService", () => ({
  PaymentService: {
    isConfigured: vi.fn(() => true),
    checkInventory: vi.fn(() => Promise.resolve({ available: true, failedItems: [] })),
    createCheckoutSession: vi.fn(() =>
      Promise.resolve({ success: true, url: "https://checkout.stripe.com/test" })
    ),
    redirectToCheckout: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Supabase
vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { user: { id: "user-123" } } } })
      ),
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "user-123" } } })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock CartContext with controllable state
const mockCartContext = {
  isCartOpen: true,
  setIsCartOpen: vi.fn(),
  items: [],
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  cartTotal: 0,
  cartCount: 0,
  clearCart: vi.fn(),
};

vi.mock("@/context/CartContext", async () => {
  const actual = await vi.importActual("@/context/CartContext");
  return {
    ...actual,
    useCart: () => mockCartContext,
  };
});

// Mock UserContext
vi.mock("@/context/UserContext", async () => {
  const actual = await vi.importActual("@/context/UserContext");
  return {
    ...actual,
    useUser: () => ({
      session: { user: { id: "user-123" } },
      user: null,
      loading: false,
      isAdmin: false,
      error: null,
    }),
  };
});

describe("CartDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCartContext.isCartOpen = true;
    mockCartContext.items = [];
    mockCartContext.cartTotal = 0;
  });

  describe("rendering when closed", () => {
    it("should not render content when cart is closed", () => {
      mockCartContext.isCartOpen = false;

      render(<CartDrawer />);

      expect(screen.queryByText("Cosmic Cart")).not.toBeInTheDocument();
    });
  });

  describe("rendering when open", () => {
    it("should render cart header", () => {
      render(<CartDrawer />);

      expect(screen.getByText("Cosmic Cart")).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(<CartDrawer />);

      expect(screen.getByLabelText("Close cart")).toBeInTheDocument();
    });

    it("should render empty cart message when no items", () => {
      render(<CartDrawer />);

      expect(screen.getByText("Your vessel is empty.")).toBeInTheDocument();
    });

    it("should render Explore Artifacts button when empty", () => {
      render(<CartDrawer />);

      expect(screen.getByText("Explore Artifacts")).toBeInTheDocument();
    });
  });

  describe("with items in cart", () => {
    beforeEach(() => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Crystal Ball",
          price: 49.99,
          quantity: 2,
          image: "/crystal.jpg",
        },
        {
          id: "2",
          name: "Tarot Deck",
          price: 29.99,
          quantity: 1,
          image: "/tarot.jpg",
        },
      ];
      mockCartContext.cartTotal = 129.97;
    });

    it("should render cart items", () => {
      render(<CartDrawer />);

      expect(screen.getByText("Crystal Ball")).toBeInTheDocument();
      expect(screen.getByText("Tarot Deck")).toBeInTheDocument();
    });

    it("should render item prices", () => {
      render(<CartDrawer />);

      expect(screen.getByText("$49.99")).toBeInTheDocument();
      expect(screen.getByText("$29.99")).toBeInTheDocument();
    });

    it("should render quantity controls", () => {
      render(<CartDrawer />);

      const increaseButtons = screen.getAllByLabelText("Increase quantity");
      const decreaseButtons = screen.getAllByLabelText("Decrease quantity");

      expect(increaseButtons.length).toBe(2);
      expect(decreaseButtons.length).toBe(2);
    });

    it("should render remove buttons", () => {
      render(<CartDrawer />);

      expect(screen.getByLabelText("Remove Crystal Ball from cart")).toBeInTheDocument();
      expect(screen.getByLabelText("Remove Tarot Deck from cart")).toBeInTheDocument();
    });

    it("should render cart total", () => {
      render(<CartDrawer />);

      // Total appears twice: subtotal and total
      const totals = screen.getAllByText("$129.97");
      expect(totals.length).toBeGreaterThanOrEqual(1);
    });

    it("should render checkout button", () => {
      render(<CartDrawer />);

      expect(screen.getByText("Checkout with Stripe")).toBeInTheDocument();
    });

    it("should render Stripe security badge", () => {
      render(<CartDrawer />);

      expect(screen.getByText("Secured by Stripe")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    beforeEach(() => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Crystal Ball",
          price: 49.99,
          quantity: 2,
          image: "/crystal.jpg",
        },
      ];
      mockCartContext.cartTotal = 99.98;
    });

    it("should call setIsCartOpen on close button click", () => {
      render(<CartDrawer />);

      fireEvent.click(screen.getByLabelText("Close cart"));

      expect(mockCartContext.setIsCartOpen).toHaveBeenCalledWith(false);
    });

    it("should call updateQuantity when increase button clicked", () => {
      render(<CartDrawer />);

      fireEvent.click(screen.getByLabelText("Increase quantity"));

      expect(mockCartContext.updateQuantity).toHaveBeenCalledWith("1", 3);
    });

    it("should call updateQuantity when decrease button clicked", () => {
      render(<CartDrawer />);

      fireEvent.click(screen.getByLabelText("Decrease quantity"));

      expect(mockCartContext.updateQuantity).toHaveBeenCalledWith("1", 1);
    });

    it("should call removeItem when remove button clicked", () => {
      render(<CartDrawer />);

      fireEvent.click(screen.getByLabelText("Remove Crystal Ball from cart"));

      expect(mockCartContext.removeItem).toHaveBeenCalledWith("1");
    });

    it("should close drawer on backdrop click", () => {
      render(<CartDrawer />);

      // Find backdrop by class
      const backdrop = document.querySelector(".bg-black\\/60");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockCartContext.setIsCartOpen).toHaveBeenCalledWith(false);
      }
    });

    it("should close drawer on Explore Artifacts click", () => {
      mockCartContext.items = [];

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Explore Artifacts"));

      expect(mockCartContext.setIsCartOpen).toHaveBeenCalledWith(false);
    });
  });

  describe("item images", () => {
    it("should render item images with alt text", () => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Crystal Ball",
          price: 49.99,
          quantity: 1,
          image: "/crystal.jpg",
        },
      ];
      mockCartContext.cartTotal = 49.99;

      render(<CartDrawer />);

      const img = screen.getByAltText("Crystal Ball");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/crystal.jpg");
    });

    it("should have lazy loading on images", () => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Crystal Ball",
          price: 49.99,
          quantity: 1,
          image: "/crystal.jpg",
        },
      ];
      mockCartContext.cartTotal = 49.99;

      render(<CartDrawer />);

      const img = screen.getByAltText("Crystal Ball");
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  describe("checkout flow", () => {
    // Import the mocked modules
    let PaymentService: {
      isConfigured: ReturnType<typeof vi.fn>;
      checkInventory: ReturnType<typeof vi.fn>;
      createCheckoutSession: ReturnType<typeof vi.fn>;
      redirectToCheckout: ReturnType<typeof vi.fn>;
    };
    let toast: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

    beforeAll(async () => {
      const paymentModule = await import("@/services/PaymentService");
      PaymentService = paymentModule.PaymentService as typeof PaymentService;
      const toastModule = await import("react-hot-toast");
      toast = toastModule.default as typeof toast;
    });

    beforeEach(() => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Crystal Ball",
          price: 49.99,
          quantity: 1,
          image: "/crystal.jpg",
        },
      ];
      mockCartContext.cartTotal = 49.99;
      vi.clearAllMocks();
      // Reset PaymentService mock
      PaymentService.isConfigured.mockReturnValue(true);
      PaymentService.checkInventory.mockResolvedValue({ available: true, failedItems: [] });
      PaymentService.createCheckoutSession.mockResolvedValue({ success: true, url: "https://checkout.stripe.com/test" });
    });

    it("should show error when user is not signed in", async () => {
      // Override UserContext mock for this test
      vi.doMock("@/context/UserContext", () => ({
        useUser: () => ({
          session: null,
          user: null,
          loading: false,
          isAdmin: false,
          error: null,
        }),
      }));

      // Re-import to get fresh mock
      vi.resetModules();
      const { CartDrawer: CartDrawerFresh } = await import("@/components/CartDrawer");

      render(<CartDrawerFresh />);

      const checkoutButton = screen.getByText("Checkout with Stripe");
      fireEvent.click(checkoutButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Please sign in to complete your purchase."
        );
      });
    });

    it("should show error when payment is not configured", async () => {
      PaymentService.isConfigured.mockReturnValue(false);

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Payment system is not configured. Please contact support."
        );
      });
    });

    it("should show error when inventory check fails", async () => {
      PaymentService.checkInventory.mockResolvedValue({
        available: false,
        failedItems: ["Crystal Ball"],
      });

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Some items are unavailable: Crystal Ball"
        );
      });
    });

    it("should show error when checkout session creation fails", async () => {
      PaymentService.createCheckoutSession.mockResolvedValue({
        success: false,
        error: "Unable to create session",
      });

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Checkout failed: Unable to create session"
        );
      });
    });

    it("should clear cart on successful checkout", async () => {
      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(mockCartContext.clearCart).toHaveBeenCalled();
      });
    });

    it("should close drawer on successful checkout", async () => {
      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(mockCartContext.setIsCartOpen).toHaveBeenCalledWith(false);
      });
    });

    it("should redirect to checkout URL when available", async () => {
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(mockLocation.href).toBe("https://checkout.stripe.com/test");
      });
    });

    it("should use redirectToCheckout fallback when no URL", async () => {
      PaymentService.createCheckoutSession.mockResolvedValue({
        success: true,
        sessionId: "cs_test_123",
      });

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(PaymentService.redirectToCheckout).toHaveBeenCalledWith("cs_test_123");
      });
    });

    it("should show processing state during checkout", async () => {
      // Make checkout slow
      PaymentService.checkInventory.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ available: true, failedItems: [] }), 100))
      );

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    it("should disable checkout button while processing", async () => {
      PaymentService.checkInventory.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ available: true, failedItems: [] }), 100))
      );

      render(<CartDrawer />);

      const checkoutButton = screen.getByText("Checkout with Stripe");
      fireEvent.click(checkoutButton);

      await waitFor(() => {
        expect(screen.getByText("Processing...").closest("button")).toBeDisabled();
      });
    });

    it("should handle checkout exception gracefully", async () => {
      PaymentService.createCheckoutSession.mockRejectedValue(new Error("Network error"));

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Checkout failed: Network error");
      });
    });

    it("should handle non-Error exceptions", async () => {
      PaymentService.createCheckoutSession.mockRejectedValue("Unknown error");

      render(<CartDrawer />);

      fireEvent.click(screen.getByText("Checkout with Stripe"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Checkout failed: Checkout failed");
      });
    });
  });

  describe("styling", () => {
    it("should have backdrop with blur", () => {
      render(<CartDrawer />);

      const backdrop = document.querySelector(".backdrop-blur-sm");
      expect(backdrop).toBeInTheDocument();
    });

    it("should have drawer with max-width", () => {
      render(<CartDrawer />);

      const drawer = document.querySelector(".max-w-md");
      expect(drawer).toBeInTheDocument();
    });

    it("should have shopping bag icon", () => {
      render(<CartDrawer />);

      const icon = screen.getByText("shopping_bag");
      expect(icon).toBeInTheDocument();
    });

    it("should have remove_shopping_cart icon when empty", () => {
      mockCartContext.items = [];

      render(<CartDrawer />);

      const icon = screen.getByText("remove_shopping_cart");
      expect(icon).toBeInTheDocument();
    });

    it("should show quantity in item display", () => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Crystal Ball",
          price: 49.99,
          quantity: 3,
          image: "/crystal.jpg",
        },
      ];
      mockCartContext.cartTotal = 149.97;

      render(<CartDrawer />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Crystal Ball",
          price: 49.99,
          quantity: 1,
          image: "/crystal.jpg",
        },
      ];
      mockCartContext.cartTotal = 49.99;
    });

    it("should have accessible close button", () => {
      render(<CartDrawer />);

      expect(screen.getByLabelText("Close cart")).toBeInTheDocument();
    });

    it("should have accessible remove buttons", () => {
      render(<CartDrawer />);

      expect(
        screen.getByLabelText("Remove Crystal Ball from cart")
      ).toBeInTheDocument();
    });

    it("should have accessible quantity buttons", () => {
      render(<CartDrawer />);

      expect(screen.getByLabelText("Increase quantity")).toBeInTheDocument();
      expect(screen.getByLabelText("Decrease quantity")).toBeInTheDocument();
    });

    it("should have async decoding on images", () => {
      render(<CartDrawer />);

      const img = screen.getByAltText("Crystal Ball");
      expect(img).toHaveAttribute("decoding", "async");
    });
  });

  describe("pricing display", () => {
    it("should display subtotal label", () => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Item",
          price: 10,
          quantity: 1,
          image: "/img.jpg",
        },
      ];
      mockCartContext.cartTotal = 10;

      render(<CartDrawer />);

      expect(screen.getByText("Subtotal")).toBeInTheDocument();
    });

    it("should display shipping info", () => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Item",
          price: 10,
          quantity: 1,
          image: "/img.jpg",
        },
      ];
      mockCartContext.cartTotal = 10;

      render(<CartDrawer />);

      expect(screen.getByText("Shipping")).toBeInTheDocument();
      expect(screen.getByText("Calculated at checkout")).toBeInTheDocument();
    });

    it("should display total label", () => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Item",
          price: 10,
          quantity: 1,
          image: "/img.jpg",
        },
      ];
      mockCartContext.cartTotal = 10;

      render(<CartDrawer />);

      expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("should format prices with 2 decimal places", () => {
      mockCartContext.items = [
        {
          id: "1",
          name: "Item",
          price: 10,
          quantity: 1,
          image: "/img.jpg",
        },
      ];
      mockCartContext.cartTotal = 10;

      render(<CartDrawer />);

      expect(screen.getAllByText("$10.00").length).toBeGreaterThan(0);
    });
  });
});
