import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth, useIsAuthenticated, useUserId } from "@/context/AuthContext";
import { createMockSession, createMockUser } from "../../mocks/supabase";

// Mock supabase
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();
const mockRefreshSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      refreshSession: () => mockRefreshSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      },
    },
  },
}));

// Test component to access context
function TestConsumer() {
  const { session, user, loading, isAuthenticated, signOut, refreshSession } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="user-id">{user?.id || "null"}</span>
      <span data-testid="session-token">{session?.access_token || "null"}</span>
      <button data-testid="sign-out" onClick={signOut}>
        Sign Out
      </button>
      <button data-testid="refresh" onClick={refreshSession}>
        Refresh
      </button>
    </div>
  );
}

function IsAuthenticatedConsumer() {
  const isAuthenticated = useIsAuthenticated();
  return <span data-testid="is-auth">{isAuthenticated.toString()}</span>;
}

function UserIdConsumer() {
  const userId = useUserId();
  return <span data-testid="user-id-hook">{userId || "null"}</span>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("AuthProvider", () => {
    it("should render children", async () => {
      render(
        <AuthProvider>
          <div data-testid="child">Hello</div>
        </AuthProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("should start with loading state true", async () => {
      // Never resolve to keep loading
      mockGetSession.mockReturnValue(new Promise(() => {}));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId("loading")).toHaveTextContent("true");
    });

    it("should set loading to false after initialization", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });
    });

    it("should be unauthenticated when no session", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
        expect(screen.getByTestId("user-id")).toHaveTextContent("null");
      });
    });

    it("should be authenticated when session exists", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
        expect(screen.getByTestId("user-id")).toHaveTextContent(mockSession.user.id);
        expect(screen.getByTestId("session-token")).toHaveTextContent(mockSession.access_token);
      });
    });

    it("should handle getSession error gracefully", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: { message: "Network error" } });
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });

      consoleSpy.mockRestore();
    });

    it("should handle unexpected errors in getSession", async () => {
      mockGetSession.mockRejectedValue(new Error("Unexpected error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      consoleSpy.mockRestore();
    });

    it("should subscribe to auth state changes", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });
    });

    it("should update session on auth state change", async () => {
      let authCallback: (event: string, session: unknown) => void = () => {};
      mockOnAuthStateChange.mockImplementation((cb) => {
        authCallback = cb;
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });

      // Simulate sign in
      const mockSession = createMockSession();
      act(() => {
        authCallback("SIGNED_IN", mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
        expect(screen.getByTestId("user-id")).toHaveTextContent(mockSession.user.id);
      });
    });

    it("should clear session on SIGNED_OUT event", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      let authCallback: (event: string, session: unknown) => void = () => {};
      mockOnAuthStateChange.mockImplementation((cb) => {
        authCallback = cb;
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });

      // Simulate sign out
      act(() => {
        authCallback("SIGNED_OUT", null);
      });

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });
    });

    it("should handle TOKEN_REFRESHED event", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      let authCallback: (event: string, session: unknown) => void = () => {};
      mockOnAuthStateChange.mockImplementation((cb) => {
        authCallback = cb;
      });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });

      // Simulate token refresh
      const newSession = createMockSession({ access_token: "new-token" });
      act(() => {
        authCallback("TOKEN_REFRESHED", newSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId("session-token")).toHaveTextContent("new-token");
      });

      consoleSpy.mockRestore();
    });
  });

  describe("signOut", () => {
    it("should call supabase signOut", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });

      await act(async () => {
        screen.getByTestId("sign-out").click();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("should clear session after signOut", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });

      await act(async () => {
        screen.getByTestId("sign-out").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });
    });

    it("should handle error when signOut fails", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockSignOut.mockResolvedValue({ error: { message: "Sign out failed" } });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Track if error was thrown
      let errorThrown = false;
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        return <>{children}</>;
      };

      function TestWithErrorHandler() {
        const { signOut } = useAuth();
        const handleSignOut = async () => {
          try {
            await signOut();
          } catch {
            errorThrown = true;
          }
        };
        return <button data-testid="sign-out-err" onClick={handleSignOut}>Sign Out</button>;
      }

      render(
        <AuthProvider>
          <TestWithErrorHandler />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId("sign-out-err").click();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(errorThrown).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe("refreshSession", () => {
    it("should call supabase refreshSession", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockRefreshSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });

      await act(async () => {
        screen.getByTestId("refresh").click();
      });

      expect(mockRefreshSession).toHaveBeenCalled();
    });

    it("should update session after refresh", async () => {
      const mockSession = createMockSession({ access_token: "old-token" });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const newSession = createMockSession({ access_token: "refreshed-token" });
      mockRefreshSession.mockResolvedValue({ data: { session: newSession }, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("session-token")).toHaveTextContent("old-token");
      });

      await act(async () => {
        screen.getByTestId("refresh").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("session-token")).toHaveTextContent("refreshed-token");
      });
    });

    it("should handle error when refresh fails", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockRefreshSession.mockResolvedValue({ data: { session: null }, error: { message: "Refresh failed" } });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      let errorThrown = false;

      function TestWithErrorHandler() {
        const { refreshSession } = useAuth();
        const handleRefresh = async () => {
          try {
            await refreshSession();
          } catch {
            errorThrown = true;
          }
        };
        return <button data-testid="refresh-err" onClick={handleRefresh}>Refresh</button>;
      }

      render(
        <AuthProvider>
          <TestWithErrorHandler />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId("refresh-err").click();
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(errorThrown).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useIsAuthenticated hook", () => {
    it("should return false when not authenticated", async () => {
      render(
        <AuthProvider>
          <IsAuthenticatedConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-auth")).toHaveTextContent("false");
      });
    });

    it("should return true when authenticated", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      render(
        <AuthProvider>
          <IsAuthenticatedConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-auth")).toHaveTextContent("true");
      });
    });
  });

  describe("useUserId hook", () => {
    it("should return null when not authenticated", async () => {
      render(
        <AuthProvider>
          <UserIdConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-id-hook")).toHaveTextContent("null");
      });
    });

    it("should return user id when authenticated", async () => {
      const mockUser = createMockUser({ id: "test-user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      render(
        <AuthProvider>
          <UserIdConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-id-hook")).toHaveTextContent("test-user-123");
      });
    });
  });
});
