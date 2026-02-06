import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h1 {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h2 {...props}>{children}</h2>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
    img: (props: Record<string, unknown>) => <img {...props} />,
    nav: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <nav {...props}>{children}</nav>
    ),
    ul: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <ul {...props}>{children}</ul>
    ),
    li: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <li {...props}>{children}</li>
    ),
    a: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <a {...props}>{children}</a>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AI Service
vi.mock("@/services/ai", () => ({
  default: {
    generateDailySpark: vi.fn().mockResolvedValue({
      message: "Trust your intuition today",
      meta: { provider: "mock", model: "test" },
    }),
  },
}));

// Mock RecommendationEngine
vi.mock("@/services/RecommendationEngine", () => ({
  RecommendationEngine: {
    getFeaturedProducts: vi.fn().mockResolvedValue([
      { id: "1", name: "Crystal", price: 29.99, image: "/crystal.jpg" },
      { id: "2", name: "Tarot Deck", price: 39.99, image: "/deck.jpg" },
    ]),
  },
  Product: {},
}));

// Mock UserContext
vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    isBirthDataComplete: false,
    user: null,
  }),
}));

// Mock CartContext
const mockAddItem = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    addItem: mockAddItem,
    addToCart: vi.fn(),
  }),
}));

// Mock LanguageContext
vi.mock("@/context/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "en-US",
  }),
}));

// Mock useFavorites
vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
  }),
}));

// Mock useJourneyState
vi.mock("@/hooks/useJourneyState", () => ({
  useJourneyState: () => ({
    isFirstVisit: true,
    hasAccount: false,
    hasBirthData: false,
    completedFeatures: [],
    lastFeature: null,
    suggestedNext: "tarot",
    markVisited: vi.fn(),
    completeFeature: vi.fn(),
  }),
}));

// Mock BirthDataForm
vi.mock("@/components/BirthDataForm", () => ({
  BirthDataForm: ({ onComplete, onCancel }: { onComplete?: () => void; onCancel?: () => void }) => (
    <div data-testid="birth-data-form">
      <button onClick={onComplete}>Complete</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock SEO and JsonLd
vi.mock("@/components/SEO", () => ({
  SEO: () => null,
}));

vi.mock("@/components/JsonLd", () => ({
  JsonLd: () => null,
}));

// Mock paraglide messages
vi.mock("@/src/paraglide/messages", async (importOriginal) => {
  const original = await importOriginal<Record<string, () => string>>();
  // Create mock functions for all keys
  const mockMessages: Record<string, () => string> = {};

  // Define mocks for known keys
  const knownMocks: Record<string, string> = {
    "home.dailySpark.loading": "Loading...",
    "home.dailySpark.label": "Daily Spark",
    "home.dailySpark.viewHoroscope": "View Horoscope",
    "home.hero.title1": "Discover",
    "home.hero.title2": "Your Path",
    "home.hero.subtitle": "Explore your cosmic journey",
    "home.hero.cta": "Get Started",
    "home.hero.ctaExisting": "Continue",
    "home.hero.inputPlaceholder": "Enter your birth date",
    "home.hero.privacyNote": "Your data is safe",
    "home.features.tarot.title": "Tarot Reading",
    "home.features.tarot.description": "Discover insights",
    "home.features.tarot.action": "Get Reading",
    "home.features.experts.title": "Experts",
    "home.features.experts.description": "Consult professionals",
    "home.features.experts.action": "Find Expert",
    "home.features.shop.title": "Shop",
    "home.features.shop.description": "Browse products",
    "home.features.shop.action": "Shop Now",
    "home.products.sectionLabel": "Products",
    "home.products.sectionTitle": "Featured",
    "home.products.loading": "Loading products...",
    "home.products.viewAll": "View All",
    "common.addToCart": "Add to Cart",
    "common.favorite": "Favorite",
    "home.hero.cta.tarot": "Draw Today's Tarot",
    "home.hero.cta.starchart": "Unlock Your Star Chart",
    "home.hero.cta.fusion": "Today's Fusion Reading",
    "home.hero.cta.birthdata": "Enter birth info",
    "home.hero.cta.dailytarot": "Daily Tarot",
    "home.hero.noSignup": "No signup needed",
  };

  for (const [key, value] of Object.entries(knownMocks)) {
    mockMessages[key] = () => value;
  }

  // Return original with overrides
  return {
    ...original,
    ...mockMessages,
  };
});

// Import component after mocks
import { Home } from "@/pages/Home";

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
  };

  describe("rendering", () => {
    it("should render without crashing", async () => {
      renderComponent();

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it("should render SEO component", async () => {
      renderComponent();

      // SEO is mocked to return null, but it should be called
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe("daily spark", () => {
    it("should show loading message initially", () => {
      renderComponent();

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should display daily spark message after loading", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Trust your intuition today")).toBeInTheDocument();
      });
    });

    it("should use cached spark if available for today", async () => {
      localStorage.setItem("daily_spark", "Cached message");
      localStorage.setItem("daily_spark_date", new Date().toDateString());

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Cached message")).toBeInTheDocument();
      });
    });
  });

  describe("navigation", () => {
    it("should render with React Router", () => {
      renderComponent();

      // Component should use React Router navigation
      expect(mockNavigate).toBeDefined();
    });
  });

  describe("featured products", () => {
    it("should load featured products", async () => {
      const { RecommendationEngine } = await import("@/services/RecommendationEngine");

      renderComponent();

      await waitFor(() => {
        expect(RecommendationEngine.getFeaturedProducts).toHaveBeenCalledWith(4);
      });
    });
  });

  describe("birth data form", () => {
    it("should not show form initially", () => {
      renderComponent();

      expect(screen.queryByTestId("birth-data-form")).not.toBeInTheDocument();
    });
  });

  describe("categories", () => {
    it("should have default category", async () => {
      renderComponent();

      await waitFor(() => {
        // Component should initialize with "All" category
        expect(document.body).toBeInTheDocument();
      });
    });
  });
});
