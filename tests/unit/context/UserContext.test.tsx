import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { UserProvider, useUser } from "@/context/UserContext";
import type { Session, User } from "@supabase/supabase-js";

// Mock supabase
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: Session | null) => void) =>
        mockOnAuthStateChange(callback),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// Mock cache invalidation
vi.mock("@/hooks/useOrders", () => ({
  invalidateOrdersCache: vi.fn(),
}));

vi.mock("@/hooks/useArchives", () => ({
  invalidateArchivesCache: vi.fn(),
}));

const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
};

const mockSession: Session = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  user: mockUser,
};

const mockProfile = {
  id: "user-123",
  full_name: "Test User",
  email: "test@example.com",
  birth_date: "1990-01-15",
  birth_time: "14:30",
  birth_place: "New York",
  lat: 40.7128,
  lng: -74.006,
  points: 100,
  tier: "Moon Caller",
  is_admin: false,
  preferences: { marketingConsent: true },
};

// Test component to consume context
const TestConsumer = () => {
  const context = useUser();
  return (
    <div>
      <div data-testid="user-name">{context.user.name}</div>
      <div data-testid="user-email">{context.user.email}</div>
      <div data-testid="user-points">{context.user.points}</div>
      <div data-testid="user-tier">{context.user.tier}</div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="is-admin">{context.isAdmin.toString()}</div>
      <div data-testid="birth-complete">
        {context.isBirthDataComplete.toString()}
      </div>
      <div data-testid="has-session">
        {(context.session !== null).toString()}
      </div>
      <button onClick={() => context.signOut()}>Sign Out</button>
      <button
        onClick={() =>
          context.updateUser({ name: "Updated Name", points: 200 })
        }
      >
        Update
      </button>
      <button
        onClick={() =>
          context.updateBirthData({
            date: new Date("1995-06-15"),
            time: "10:00",
            location: { name: "Los Angeles", lat: 34.05, lng: -118.25 },
          })
        }
      >
        Update Birth
      </button>
      <button onClick={() => context.toggleFavorite(1)}>Toggle Fav</button>
    </div>
  );
};

describe("UserContext", () => {
  let authStateCallback: (event: string, session: Session | null) => void;
  let unsubscribeMock: { unsubscribe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMock = { unsubscribe: vi.fn() };

    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return { data: { subscription: unsubscribeMock } };
    });

    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state without session", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
    });

    it("should render provider without crashing", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });
    });

    it("should have default user values when no session", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("user-name")).toHaveTextContent("");
      expect(screen.getByTestId("user-points")).toHaveTextContent("0");
      expect(screen.getByTestId("user-tier")).toHaveTextContent("Star Walker");
      expect(screen.getByTestId("is-admin")).toHaveTextContent("false");
    });

    it("should have session as null", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("has-session")).toHaveTextContent("false");
      });
    });
  });

  describe("with authenticated session", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });
    });

    it("should load user profile from database", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com"
      );
      expect(screen.getByTestId("user-points")).toHaveTextContent("100");
      expect(screen.getByTestId("user-tier")).toHaveTextContent("Moon Caller");
    });

    it("should set has-session to true", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("has-session")).toHaveTextContent("true");
      });
    });

    it("should set birth data complete when all required fields present", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-complete")).toHaveTextContent("true");
      });
    });
  });

  describe("profile creation for new users", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "user-123",
              full_name: "test",
              email: "test@example.com",
              points: 0,
              tier: "Star Walker",
            },
            error: null,
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null, // No profile exists
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });
    });

    it("should create profile for new user", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(mockFrom).toHaveBeenCalledWith("profiles");
    });
  });

  describe("signOut", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });
    });

    it("should call supabase signOut", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      const signOutButton = screen.getByText("Sign Out");
      await act(async () => {
        signOutButton.click();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });
    });

    it("should update user profile", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      const updateButton = screen.getByText("Update");
      await act(async () => {
        updateButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent(
          "Updated Name"
        );
      });

      expect(screen.getByTestId("user-points")).toHaveTextContent("200");
    });
  });

  describe("updateBirthData", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });
    });

    it("should update birth data", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      const updateBirthButton = screen.getByText("Update Birth");
      await act(async () => {
        updateBirthButton.click();
      });

      // Verify supabase was called
      expect(mockFrom).toHaveBeenCalledWith("profiles");
    });
  });

  describe("toggleFavorite (deprecated)", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("should log deprecation warning", async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      const toggleFavButton = screen.getByText("Toggle Fav");
      await act(async () => {
        toggleFavButton.click();
      });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("toggleFavorite is deprecated")
      );
    });
  });

  describe("auth state changes", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
    });

    it("should handle sign in event", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      // Simulate sign in
      await act(async () => {
        authStateCallback("SIGNED_IN", mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });
    });

    it("should handle sign out event", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      // Start with session
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      // Simulate sign out
      await act(async () => {
        authStateCallback("SIGNED_OUT", null);
      });

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("");
      });
    });

    it("should unsubscribe on unmount", async () => {
      const { unmount } = render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      unmount();

      expect(unsubscribeMock.unsubscribe).toHaveBeenCalled();
    });
  });

  describe("isBirthDataComplete", () => {
    it("should be false when birth date is missing", async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const incompleteProfile = { ...mockProfile, birth_date: null };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: incompleteProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-complete")).toHaveTextContent("false");
      });
    });

    it("should be false when birth time is missing", async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const incompleteProfile = { ...mockProfile, birth_time: null };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: incompleteProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-complete")).toHaveTextContent("false");
      });
    });

    it("should be true when required fields are present", async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-complete")).toHaveTextContent("true");
      });
    });
  });

  describe("isAdmin", () => {
    it("should be true when profile has is_admin flag", async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const adminProfile = { ...mockProfile, is_admin: true };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: adminProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-admin")).toHaveTextContent("true");
      });
    });

    it("should be false for regular users", async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-admin")).toHaveTextContent("false");
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("should handle profile fetch error gracefully", async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("Database error"),
          }),
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("useUser hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useUser must be used within a UserProvider");

      consoleError.mockRestore();
    });
  });
});
