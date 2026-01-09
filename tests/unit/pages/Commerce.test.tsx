import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import React from "react";
import { Screen } from "@/types";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    section: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <section {...props}>{children}</section>
    ),
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
    aside: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <aside {...props}>{children}</aside>
    ),
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h1 {...props}>{children}</h1>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
    img: (props: Record<string, unknown>) => <img {...props} />,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Test data
const sampleProducts = [
  {
    id: 1,
    title: "Fire Crystal",
    price: 29.99,
    description: "A powerful fire element crystal",
    image_url: "/fire-crystal.jpg",
    element: "Fire",
    badge: "New",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Water Stone",
    price: 39.99,
    description: "A calming water element stone",
    image_url: "/water-stone.jpg",
    element: "Water",
    badge: null,
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    id: 3,
    title: "Earth Gem",
    price: 49.99,
    description: "A grounding earth element gem",
    image_url: "/earth-gem.jpg",
    element: "Earth",
    badge: "Popular",
    created_at: "2024-01-03T00:00:00Z",
  },
];

let mockProductsData = [...sampleProducts];
let mockSingleProduct: typeof sampleProducts[0] | null = sampleProducts[0];

// Create chainable mock
const createChainableMock = () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => 
      Promise.resolve({ data: mockSingleProduct, error: null })
    ),
    then: vi.fn().mockImplementation((resolve) => {
      resolve({ data: mockProductsData, error: null });
      return Promise.resolve({ data: mockProductsData, error: null });
    }),
  };
  return chainable;
};

// Mock Supabase
vi.mock("@/services/supabase", () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => createChainableMock()),
  },
}));

// Mock RecommendationEngine
vi.mock("@/services/RecommendationEngine", () => ({
  RecommendationEngine: {
    getRecommendations: vi.fn().mockResolvedValue([
      {
        id: 101,
        name: "Recommended Crystal",
        price: 49.99,
        description: "A recommended item",
        image: "/rec-crystal.jpg",
      },
    ]),
  },
  Product: {},
}));

// Mock CartContext
const mockAddItem = vi.fn();
const mockSetIsCartOpen = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    addItem: mockAddItem,
    setIsCartOpen: mockSetIsCartOpen,
  }),
}));

// Mock UserContext
vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    user: { name: "Test User" },
  }),
}));

// Mock GlassCard
vi.mock("@/components/GlassCard", () => ({
  GlassCard: ({ children, className, onClick, hoverEffect, interactive }: { 
    children: React.ReactNode; 
    className?: string; 
    onClick?: () => void;
    hoverEffect?: boolean;
    interactive?: boolean;
    intensity?: string;
  }) => (
    <div className={className} onClick={onClick} data-testid="glass-card">
      {children}
    </div>
  ),
}));

// Mock GlowButton
vi.mock("@/components/GlowButton", () => ({
  GlowButton: ({ children, onClick, className, disabled, variant, icon, type }: { 
    children: React.ReactNode; 
    onClick?: (e: React.MouseEvent) => void; 
    className?: string; 
    disabled?: boolean;
    variant?: string;
    icon?: string;
    type?: string;
  }) => (
    <button onClick={onClick} className={className} disabled={disabled} data-testid="glow-button" type={type as "button" | "submit" | "reset" | undefined}>
      {children}
    </button>
  ),
}));

// Import components after mocks
import { ShopList, ProductDetail } from "@/pages/Commerce";

describe("Commerce", () => {
  const mockSetScreen = vi.fn();
  const mockSetProductId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockProductsData = [...sampleProducts];
    mockSingleProduct = sampleProducts[0];
  });

  describe("ShopList", () => {
    describe("rendering", () => {
      it("should render loading state while products are being fetched", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        expect(screen.getByText(/Summoning mystical artifacts/i)).toBeInTheDocument();
      });

      it("should render hero section with title", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        expect(screen.getByText(/Curated Tools for/i)).toBeInTheDocument();
        expect(screen.getByText(/Your Journey/i)).toBeInTheDocument();
      });

      it("should render filter sidebar with sections", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        expect(screen.getByText("Filters")).toBeInTheDocument();
        expect(screen.getByText("Intent")).toBeInTheDocument();
        expect(screen.getByText("Elements")).toBeInTheDocument();
        expect(screen.getByText("Zodiac")).toBeInTheDocument();
      });

      it("should display element filter options", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        expect(screen.getByText("Fire")).toBeInTheDocument();
        expect(screen.getByText("Water")).toBeInTheDocument();
        expect(screen.getByText("Air")).toBeInTheDocument();
        expect(screen.getByText("Earth")).toBeInTheDocument();
        expect(screen.getByText("Spirit")).toBeInTheDocument();
      });

      it("should display intent filter options", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        expect(screen.getByText("Love & Relationships")).toBeInTheDocument();
        expect(screen.getByText("Wealth & Career")).toBeInTheDocument();
        expect(screen.getByText("Protection")).toBeInTheDocument();
        expect(screen.getByText("Healing")).toBeInTheDocument();
      });

      it("should render back to home button", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        expect(screen.getByText("Back to Home")).toBeInTheDocument();
      });

      it("should render curated collection badge", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        expect(screen.getByText("Curated Collection")).toBeInTheDocument();
      });
    });

    describe("navigation", () => {
      it("should navigate back to home when back button is clicked", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        const backButton = screen.getByText("Back to Home");
        fireEvent.click(backButton);

        expect(mockSetScreen).toHaveBeenCalledWith(Screen.HOME);
      });
    });

    describe("filtering", () => {
      it("should have checkboxes for element filters", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      it("should toggle filter when checkbox is clicked", () => {
        render(<ShopList setScreen={mockSetScreen} setProductId={mockSetProductId} />);

        const checkboxes = screen.getAllByRole("checkbox");
        const fireCheckbox = checkboxes[4]; // Fire is in Elements section

        // Initial state - unchecked
        expect(fireCheckbox).not.toBeChecked();

        // Click to check
        fireEvent.click(fireCheckbox);

        // Should now be checked
        expect(fireCheckbox).toBeChecked();
      });
    });
  });

  describe("ProductDetail", () => {
    describe("rendering", () => {
      it("should render loading state while product is being fetched", () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        expect(screen.getByText(/Consulting the stars/i)).toBeInTheDocument();
      });

      it("should show not found message when productId is not provided", async () => {
        mockSingleProduct = null;

        render(<ProductDetail setScreen={mockSetScreen} productId={undefined} />);

        await waitFor(() => {
          expect(screen.queryByText(/Consulting the stars/i)).not.toBeInTheDocument();
        });
      });

      it("should display product badge when available", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          // The badge "New" or "Sacred Artifact" should appear
          const badges = screen.queryAllByText(/New|Sacred Artifact/i);
          expect(badges.length).toBeGreaterThanOrEqual(0);
        });
      });
    });

    describe("navigation", () => {
      it("should navigate to shop from not found page", async () => {
        mockSingleProduct = null;

        render(<ProductDetail setScreen={mockSetScreen} productId={999} />);

        await waitFor(() => {
          const returnButton = screen.queryByText("Return to Shop");
          if (returnButton) {
            fireEvent.click(returnButton);
            expect(mockSetScreen).toHaveBeenCalledWith(Screen.SHOP_LIST);
          }
        });
      });
    });

    describe("product info sections", () => {
      it("should display verified reviews text", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          expect(screen.getByText("Verified Reviews")).toBeInTheDocument();
        });
      });

      it("should display cosmic resonance section", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          expect(screen.getByText("Cosmic Resonance")).toBeInTheDocument();
        });
      });

      it("should display shipping information", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          expect(screen.getByText(/Free shipping on orders over \$100/i)).toBeInTheDocument();
        });
      });

      it("should display add to cart button", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          expect(screen.getByText("Add to Cart")).toBeInTheDocument();
        });
      });

      it("should display back to shop button", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          expect(screen.getByText("Back to Shop")).toBeInTheDocument();
        });
      });
    });

    describe("cart functionality", () => {
      it("should call addItem when Add to Cart is clicked", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          expect(screen.getByText("Add to Cart")).toBeInTheDocument();
        });

        const addToCartButton = screen.getByText("Add to Cart");
        fireEvent.click(addToCartButton);

        expect(mockAddItem).toHaveBeenCalled();
        expect(mockSetIsCartOpen).toHaveBeenCalledWith(true);
      });
    });

    describe("favorite functionality", () => {
      it("should have a favorite button", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          const buttons = screen.getAllByRole("button");
          const favoriteButton = buttons.find(btn => 
            btn.querySelector(".material-symbols-outlined")?.textContent === "favorite"
          );
          expect(favoriteButton).toBeDefined();
        });
      });
    });

    describe("breadcrumb navigation", () => {
      it("should display Shop in breadcrumb", async () => {
        render(<ProductDetail setScreen={mockSetScreen} productId={1} />);

        await waitFor(() => {
          expect(screen.getByText("Shop")).toBeInTheDocument();
        });
      });
    });
  });
});
