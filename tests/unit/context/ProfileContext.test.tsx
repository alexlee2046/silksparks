import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileProvider, useProfile, useBirthData, useIsAdmin } from "@/context/ProfileContext";
import { AuthProvider } from "@/context/AuthContext";
import { createMockSession, createMockUser, createMockProfile } from "../../mocks/supabase";

// Mock supabase
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback);
        return {
          data: {
            subscription: { unsubscribe: vi.fn() },
          },
        };
      },
    },
    from: (table: string) => mockFrom(table),
  },
}));

// Test components
function TestConsumer() {
  const { profile, loading, isBirthDataComplete, isAdmin, updateProfile, updateBirthData, refreshProfile } = useProfile();
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="name">{profile?.name || "null"}</span>
      <span data-testid="email">{profile?.email || "null"}</span>
      <span data-testid="points">{profile?.points ?? "null"}</span>
      <span data-testid="tier">{profile?.tier || "null"}</span>
      <span data-testid="is-admin">{isAdmin.toString()}</span>
      <span data-testid="birth-complete">{isBirthDataComplete.toString()}</span>
      <span data-testid="birth-date">{profile?.birthData.date?.toISOString() || "null"}</span>
      <button data-testid="update-name" onClick={() => updateProfile({ name: "New Name" })}>
        Update Name
      </button>
      <button
        data-testid="update-birth"
        onClick={() =>
          updateBirthData({
            date: new Date("1995-05-15"),
            time: "10:30",
            location: { name: "Shanghai", lat: 31.2, lng: 121.5 },
          })
        }
      >
        Update Birth
      </button>
      <button data-testid="refresh" onClick={refreshProfile}>
        Refresh
      </button>
    </div>
  );
}

function BirthDataConsumer() {
  const birthData = useBirthData();
  return (
    <div>
      <span data-testid="birth-data">{birthData ? JSON.stringify(birthData) : "null"}</span>
    </div>
  );
}

function IsAdminConsumer() {
  const isAdmin = useIsAdmin();
  return <span data-testid="admin-hook">{isAdmin.toString()}</span>;
}

function createQueryBuilder(data: unknown = null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
}

describe("ProfileContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no session
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  describe("ProfileProvider", () => {
    it("should render children", async () => {
      render(
        <AuthProvider>
          <ProfileProvider>
            <div data-testid="child">Hello</div>
          </ProfileProvider>
        </AuthProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("should be in loading state initially when authenticated", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      // Never resolve profile fetch
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnValue(new Promise(() => {})),
      });

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      // Give time for auth to initialize
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("true");
      });
    });

    it("should have null profile when not authenticated", async () => {
      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
        expect(screen.getByTestId("name")).toHaveTextContent("null");
      });
    });

    it("should fetch profile when authenticated", async () => {
      const mockUser = createMockUser({ id: "user-123", email: "test@example.com" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const dbProfile = {
        id: "user-123",
        full_name: "Test User",
        email: "test@example.com",
        points: 100,
        tier: "Gold",
        is_admin: false,
        birth_date: "1990-01-15",
        birth_time: "14:30",
        birth_place: "Beijing",
        lat: 39.9,
        lng: 116.4,
        preferences: { marketingConsent: true },
      };

      mockFrom.mockReturnValue(createQueryBuilder(dbProfile));

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
        expect(screen.getByTestId("name")).toHaveTextContent("Test User");
        expect(screen.getByTestId("email")).toHaveTextContent("test@example.com");
        expect(screen.getByTestId("points")).toHaveTextContent("100");
        expect(screen.getByTestId("tier")).toHaveTextContent("Gold");
      });
    });

    it("should create new profile if not exists", async () => {
      const mockUser = createMockUser({ id: "new-user", email: "new@example.com" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const insertedProfile = {
        id: "new-user",
        full_name: "new",
        email: "new@example.com",
        points: 0,
        tier: "Star Walker",
        is_admin: false,
      };

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: maybeSingle returns null
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        } else {
          // Second call: insert
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: insertedProfile, error: null }),
          };
        }
      });

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveTextContent("new");
      });
    });

    it("should handle fetch error gracefully", async () => {
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      mockFrom.mockReturnValue(createQueryBuilder(null, { message: "Database error" }));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      consoleSpy.mockRestore();
    });

    it("should detect admin status", async () => {
      const mockUser = createMockUser({ id: "admin-user" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const adminProfile = {
        id: "admin-user",
        full_name: "Admin",
        email: "admin@example.com",
        is_admin: true,
        points: 0,
        tier: "Admin",
      };

      mockFrom.mockReturnValue(createQueryBuilder(adminProfile));

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-admin")).toHaveTextContent("true");
      });
    });

    it("should detect birth data completeness", async () => {
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const completeProfile = {
        id: "user-123",
        full_name: "Test",
        email: "test@example.com",
        birth_date: "1990-01-15",
        birth_time: "14:30",
        birth_place: "Beijing",
        lat: 39.9,
        lng: 116.4,
        is_admin: false,
        points: 0,
        tier: "Bronze",
      };

      mockFrom.mockReturnValue(createQueryBuilder(completeProfile));

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-complete")).toHaveTextContent("true");
      });
    });

    it("should detect incomplete birth data", async () => {
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const incompleteProfile = {
        id: "user-123",
        full_name: "Test",
        email: "test@example.com",
        birth_date: "1990-01-15",
        // Missing birth_time and location
        is_admin: false,
        points: 0,
        tier: "Bronze",
      };

      mockFrom.mockReturnValue(createQueryBuilder(incompleteProfile));

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-complete")).toHaveTextContent("false");
      });
    });
  });

  describe("updateProfile", () => {
    it("should update profile name", async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const profile = {
        id: "user-123",
        full_name: "Old Name",
        email: "test@example.com",
        is_admin: false,
        points: 0,
        tier: "Bronze",
      };

      let updateCalled = false;
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
        update: vi.fn().mockImplementation(() => {
          updateCalled = true;
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
      }));

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveTextContent("Old Name");
      });

      await user.click(screen.getByTestId("update-name"));

      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveTextContent("New Name");
      });
    });

    it("should not update when not authenticated", async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveTextContent("null");
      });

      // Should not throw, just do nothing
      await user.click(screen.getByTestId("update-name"));

      expect(screen.getByTestId("name")).toHaveTextContent("null");
    });
  });

  describe("updateBirthData", () => {
    it("should update birth data", async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const profile = {
        id: "user-123",
        full_name: "Test",
        email: "test@example.com",
        is_admin: false,
        points: 0,
        tier: "Bronze",
      };

      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }));

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-date")).toHaveTextContent("null");
      });

      await user.click(screen.getByTestId("update-birth"));

      await waitFor(() => {
        expect(screen.getByTestId("birth-date").textContent).toContain("1995-05-15");
      });
    });
  });

  describe("refreshProfile", () => {
    it("should refetch profile data", async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      let fetchCount = 0;
      mockFrom.mockImplementation(() => {
        fetchCount++;
        return createQueryBuilder({
          id: "user-123",
          full_name: fetchCount === 1 ? "First" : "Refreshed",
          email: "test@example.com",
          is_admin: false,
          points: fetchCount * 100,
          tier: "Bronze",
        });
      });

      render(
        <AuthProvider>
          <ProfileProvider>
            <TestConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveTextContent("First");
        expect(screen.getByTestId("points")).toHaveTextContent("100");
      });

      await user.click(screen.getByTestId("refresh"));

      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveTextContent("Refreshed");
        expect(screen.getByTestId("points")).toHaveTextContent("200");
      });
    });
  });

  describe("useProfile hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );
      }).toThrow("useProfile must be used within a ProfileProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useBirthData hook", () => {
    it("should return birth data", async () => {
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      mockFrom.mockReturnValue(
        createQueryBuilder({
          id: "user-123",
          full_name: "Test",
          email: "test@example.com",
          birth_date: "1990-01-15",
          birth_time: "14:30",
          birth_place: "Beijing",
          lat: 39.9,
          lng: 116.4,
          is_admin: false,
          points: 0,
          tier: "Bronze",
        })
      );

      render(
        <AuthProvider>
          <ProfileProvider>
            <BirthDataConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        const birthData = screen.getByTestId("birth-data").textContent;
        expect(birthData).toContain("1990-01-15");
        expect(birthData).toContain("14:30");
        expect(birthData).toContain("Beijing");
      });
    });

    it("should return null when not authenticated", async () => {
      render(
        <AuthProvider>
          <ProfileProvider>
            <BirthDataConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("birth-data")).toHaveTextContent("null");
      });
    });
  });

  describe("useIsAdmin hook", () => {
    it("should return true for admin", async () => {
      const mockUser = createMockUser({ id: "admin-user" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      mockFrom.mockReturnValue(
        createQueryBuilder({
          id: "admin-user",
          full_name: "Admin",
          email: "admin@example.com",
          is_admin: true,
          points: 0,
          tier: "Admin",
        })
      );

      render(
        <AuthProvider>
          <ProfileProvider>
            <IsAdminConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("admin-hook")).toHaveTextContent("true");
      });
    });

    it("should return false for non-admin", async () => {
      const mockUser = createMockUser({ id: "user-123" });
      const mockSession = createMockSession({ user: mockUser });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      mockFrom.mockReturnValue(
        createQueryBuilder({
          id: "user-123",
          full_name: "User",
          email: "user@example.com",
          is_admin: false,
          points: 0,
          tier: "Bronze",
        })
      );

      render(
        <AuthProvider>
          <ProfileProvider>
            <IsAdminConsumer />
          </ProfileProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("admin-hook")).toHaveTextContent("false");
      });
    });
  });
});
