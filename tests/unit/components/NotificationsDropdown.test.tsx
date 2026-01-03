import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NotificationsDropdown } from "@/components/layout/NotificationsDropdown";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Create mock functions that will be defined at import time
const mockSupabaseQuery = vi.fn();
const mockChannelSubscribe = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock("@/services/supabase", () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => mockSupabaseQuery(),
            }),
          }),
        }),
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => mockChannelSubscribe(),
        }),
      }),
      removeChannel: () => mockRemoveChannel(),
    },
  };
});

describe("NotificationsDropdown", () => {
  const testUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseQuery.mockResolvedValue({ data: [], error: null });
    mockChannelSubscribe.mockReturnValue({ unsubscribe: vi.fn() });
  });

  describe("rendering", () => {
    it("should render notifications header", async () => {
      render(<NotificationsDropdown userId={testUserId} />);

      expect(screen.getByText("Notifications")).toBeInTheDocument();
    });

    it("should show loading state initially", () => {
      mockSupabaseQuery.mockReturnValue(new Promise(() => {}));

      render(<NotificationsDropdown userId={testUserId} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should show empty state when no notifications", async () => {
      mockSupabaseQuery.mockResolvedValue({ data: [], error: null });

      render(<NotificationsDropdown userId={testUserId} />);

      await waitFor(() => {
        expect(screen.getByText("No new notifications.")).toBeInTheDocument();
      });
    });

    it("should render notifications list", async () => {
      const notifications = [
        {
          id: "1",
          title: "New Order",
          message: "Your order has been placed",
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          title: "Shipping Update",
          message: "Your package is on the way",
          created_at: "2024-01-14T09:00:00Z",
        },
      ];

      mockSupabaseQuery.mockResolvedValue({ data: notifications, error: null });

      render(<NotificationsDropdown userId={testUserId} />);

      await waitFor(() => {
        expect(screen.getByText("New Order")).toBeInTheDocument();
        expect(screen.getByText("Your order has been placed")).toBeInTheDocument();
        expect(screen.getByText("Shipping Update")).toBeInTheDocument();
        expect(screen.getByText("Your package is on the way")).toBeInTheDocument();
      });
    });
  });

  describe("data handling", () => {
    it("should handle null data gracefully", async () => {
      mockSupabaseQuery.mockResolvedValue({ data: null, error: null });

      render(<NotificationsDropdown userId={testUserId} />);

      await waitFor(() => {
        expect(screen.getByText("No new notifications.")).toBeInTheDocument();
      });
    });

    it("should display multiple notifications", async () => {
      const notifications = [
        { id: "1", title: "Title 1", message: "Message 1", created_at: "2024-01-15" },
        { id: "2", title: "Title 2", message: "Message 2", created_at: "2024-01-14" },
        { id: "3", title: "Title 3", message: "Message 3", created_at: "2024-01-13" },
      ];

      mockSupabaseQuery.mockResolvedValue({ data: notifications, error: null });

      render(<NotificationsDropdown userId={testUserId} />);

      await waitFor(() => {
        expect(screen.getByText("Title 1")).toBeInTheDocument();
        expect(screen.getByText("Title 2")).toBeInTheDocument();
        expect(screen.getByText("Title 3")).toBeInTheDocument();
      });
    });
  });

  describe("styling", () => {
    it("should have proper container width", () => {
      render(<NotificationsDropdown userId={testUserId} />);

      // Check that the component rendered with expected w-80 class somewhere
      const w80Element = document.querySelector(".w-80");
      expect(w80Element).toBeInTheDocument();
    });

    it("should render header with bold styling", () => {
      render(<NotificationsDropdown userId={testUserId} />);

      const header = screen.getByText("Notifications");
      expect(header.className).toContain("font-bold");
    });

    it("should have scrollable notification container", async () => {
      render(<NotificationsDropdown userId={testUserId} />);

      const container = document.querySelector(".overflow-y-auto");
      expect(container).toBeInTheDocument();
    });
  });

  describe("notification item styling", () => {
    it("should render notification with title and message", async () => {
      const notifications = [
        {
          id: "1",
          title: "Test Title",
          message: "Test message content",
          created_at: "2024-01-15",
        },
      ];

      mockSupabaseQuery.mockResolvedValue({ data: notifications, error: null });

      render(<NotificationsDropdown userId={testUserId} />);

      await waitFor(() => {
        const title = screen.getByText("Test Title");
        const message = screen.getByText("Test message content");

        expect(title).toBeInTheDocument();
        expect(message).toBeInTheDocument();
        expect(title.className).toContain("text-primary");
        expect(message.className).toContain("text-text-muted");
      });
    });
  });
});
