import React, { ReactElement, ReactNode } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// Import providers
import { AuthProvider } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { PerformanceProvider } from "@/context/PerformanceContext";

// Import mock factories
import {
  createMockSession,
  createMockProfile,
  MockSession,
  MockProfile,
} from "../mocks/supabase";

// ============================================================================
// Types
// ============================================================================

export interface ProvidersConfig {
  /** Initial route for MemoryRouter */
  initialRoute?: string;
  /** Use BrowserRouter instead of MemoryRouter */
  useBrowserRouter?: boolean;
  /** Mock session for auth context */
  session?: MockSession | null;
  /** Mock profile for profile context */
  profile?: MockProfile | null;
  /** Initial cart items */
  cartItems?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  /** Initial theme */
  theme?: "light" | "dark";
  /** Initial language */
  language?: "zh" | "en";
  /** Custom wrapper component */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

export interface ExtendedRenderResult extends RenderResult {
  /** Helper to re-render with updated providers */
  rerender: (ui: ReactElement, newConfig?: Partial<ProvidersConfig>) => void;
}

// ============================================================================
// All Providers Wrapper
// ============================================================================

function createProviders(config: ProvidersConfig = {}) {
  const {
    initialRoute = "/",
    useBrowserRouter = false,
    session,
    profile,
    cartItems = [],
    theme = "dark",
    language = "zh",
    wrapper: CustomWrapper,
  } = config;

  // Create mock functions for auth
  const mockAuthValue = {
    session: session || null,
    isAuthenticated: !!session,
    isLoading: false,
    userId: session?.user?.id || null,
    signOut: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(undefined),
  };

  // Create mock functions for profile
  const mockProfileValue = {
    profile: profile
      ? {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          birthData: {
            date: profile.birth_date ? new Date(profile.birth_date) : null,
            time: profile.birth_time || "",
            location: profile.birth_location
              ? {
                  name: profile.birth_location,
                  latitude: profile.birth_latitude || 0,
                  longitude: profile.birth_longitude || 0,
                  timezone: profile.birth_timezone || "",
                }
              : null,
          },
          preferences: profile.preferences as Record<string, unknown>,
          points: profile.points,
          tier: profile.tier,
          isAdmin: profile.is_admin,
        }
      : null,
    loading: false,
    isBirthDataComplete:
      !!profile?.birth_date && !!profile?.birth_time && !!profile?.birth_location,
    isAdmin: profile?.is_admin || false,
    updateProfile: vi.fn().mockResolvedValue(undefined),
    updateBirthData: vi.fn().mockResolvedValue(undefined),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
  };

  // Create mock functions for cart
  const mockCartValue = {
    items: cartItems,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    isOpen: false,
    openCart: vi.fn(),
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
  };

  // Create mock functions for theme
  const mockThemeValue = {
    theme,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  };

  // Create mock functions for language
  const mockLanguageValue = {
    language,
    setLanguage: vi.fn(),
    t: vi.fn((key: string) => key),
  };

  // Create mock functions for performance
  const mockPerformanceValue = {
    isLowPerformance: false,
    reducedMotion: false,
    setReducedMotion: vi.fn(),
  };

  const Router = useBrowserRouter ? BrowserRouter : MemoryRouter;
  const routerProps = useBrowserRouter ? {} : { initialEntries: [initialRoute] };

  return function AllProviders({ children }: { children: ReactNode }) {
    const content = (
      <Router {...routerProps}>
        <MockAuthProvider value={mockAuthValue}>
          <MockProfileProvider value={mockProfileValue}>
            <MockCartProvider value={mockCartValue}>
              <MockThemeProvider value={mockThemeValue}>
                <MockLanguageProvider value={mockLanguageValue}>
                  <MockPerformanceProvider value={mockPerformanceValue}>
                    {children}
                  </MockPerformanceProvider>
                </MockLanguageProvider>
              </MockThemeProvider>
            </MockCartProvider>
          </MockProfileProvider>
        </MockAuthProvider>
      </Router>
    );

    if (CustomWrapper) {
      return <CustomWrapper>{content}</CustomWrapper>;
    }

    return content;
  };
}

// ============================================================================
// Mock Provider Components
// ============================================================================

const MockAuthContext = React.createContext<unknown>(null);
function MockAuthProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: unknown;
}) {
  return (
    <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
  );
}

const MockProfileContext = React.createContext<unknown>(null);
function MockProfileProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: unknown;
}) {
  return (
    <MockProfileContext.Provider value={value}>
      {children}
    </MockProfileContext.Provider>
  );
}

const MockCartContext = React.createContext<unknown>(null);
function MockCartProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: unknown;
}) {
  return (
    <MockCartContext.Provider value={value}>{children}</MockCartContext.Provider>
  );
}

const MockThemeContext = React.createContext<unknown>(null);
function MockThemeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: unknown;
}) {
  return (
    <MockThemeContext.Provider value={value}>
      {children}
    </MockThemeContext.Provider>
  );
}

const MockLanguageContext = React.createContext<unknown>(null);
function MockLanguageProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: unknown;
}) {
  return (
    <MockLanguageContext.Provider value={value}>
      {children}
    </MockLanguageContext.Provider>
  );
}

const MockPerformanceContext = React.createContext<unknown>(null);
function MockPerformanceProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: unknown;
}) {
  return (
    <MockPerformanceContext.Provider value={value}>
      {children}
    </MockPerformanceContext.Provider>
  );
}

// ============================================================================
// Main Render Function
// ============================================================================

/**
 * Render a component with all necessary providers for testing.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { getByText } = renderWithProviders(<MyComponent />);
 *
 * // With authenticated user
 * const session = createMockSession();
 * const profile = createMockProfile();
 * const { getByRole } = renderWithProviders(<Dashboard />, {
 *   session,
 *   profile,
 * });
 *
 * // With cart items
 * const { getByTestId } = renderWithProviders(<Cart />, {
 *   cartItems: [{ id: "1", name: "Crystal", price: 99, quantity: 2 }],
 * });
 *
 * // With specific route
 * const { container } = renderWithProviders(<ProductDetail />, {
 *   initialRoute: "/products/123",
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  config: ProvidersConfig & RenderOptions = {}
): ExtendedRenderResult {
  const {
    initialRoute,
    useBrowserRouter,
    session,
    profile,
    cartItems,
    theme,
    language,
    wrapper,
    ...renderOptions
  } = config;

  const Wrapper = createProviders({
    initialRoute,
    useBrowserRouter,
    session,
    profile,
    cartItems,
    theme,
    language,
    wrapper,
  });

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    rerender: (newUi: ReactElement, newConfig?: Partial<ProvidersConfig>) => {
      const NewWrapper = createProviders({
        initialRoute,
        useBrowserRouter,
        session,
        profile,
        cartItems,
        theme,
        language,
        wrapper,
        ...newConfig,
      });
      result.rerender(<NewWrapper>{newUi}</NewWrapper>);
    },
  };
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Render with an authenticated user
 */
export function renderAuthenticated(
  ui: ReactElement,
  config: Omit<ProvidersConfig, "session" | "profile"> & {
    session?: MockSession;
    profile?: MockProfile;
  } & RenderOptions = {}
): ExtendedRenderResult {
  const session = config.session || createMockSession();
  const profile = config.profile || createMockProfile({ id: session.user.id });

  return renderWithProviders(ui, { ...config, session, profile });
}

/**
 * Render with an admin user
 */
export function renderAsAdmin(
  ui: ReactElement,
  config: Omit<ProvidersConfig, "session" | "profile"> & RenderOptions = {}
): ExtendedRenderResult {
  const session = createMockSession();
  const profile = createMockProfile({
    id: session.user.id,
    is_admin: true,
    tier: "admin",
  });

  return renderWithProviders(ui, { ...config, session, profile });
}

/**
 * Render as unauthenticated guest
 */
export function renderAsGuest(
  ui: ReactElement,
  config: Omit<ProvidersConfig, "session" | "profile"> & RenderOptions = {}
): ExtendedRenderResult {
  return renderWithProviders(ui, { ...config, session: null, profile: null });
}

// ============================================================================
// Re-exports
// ============================================================================

export { createMockSession, createMockProfile } from "../mocks/supabase";
export * from "@testing-library/react";
