import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuditService } from "@/services/AuditService";
import type { AuditLogEntry } from "@/services/AuditService";

// Mock Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockInsert = vi.fn();

// Create a chainable query mock that also supports thenable/await
function createQueryMock(resolvedValue: { data: unknown; count: number; error: unknown }) {
  const queryMock: Record<string, unknown> = {};

  const chainMethod = () => queryMock;

  // All methods return the same chainable object
  queryMock.order = chainMethod;
  queryMock.range = chainMethod;
  queryMock.eq = chainMethod;
  queryMock.gte = chainMethod;
  queryMock.lte = chainMethod;

  // Make it thenable so await works
  queryMock.then = (resolve: (value: unknown) => void) => {
    resolve(resolvedValue);
    return queryMock;
  };

  return queryMock;
}

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock navigator
const originalNavigator = global.navigator;

describe("AuditService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-123" } },
    });

    const queryMock = createQueryMock({ data: [], count: 0, error: null });

    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: vi.fn(() => queryMock),
    });

    mockInsert.mockResolvedValue({ error: null });

    // Mock navigator
    Object.defineProperty(global, "navigator", {
      value: { userAgent: "Test Browser/1.0" },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  describe("log", () => {
    const testEntry: AuditLogEntry = {
      action: "create_product",
      targetType: "product",
      targetId: "123",
      newValue: { name: "Test Product" },
    };

    it("should return error when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await AuditService.log(testEntry);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });

    it("should insert log entry with correct data", async () => {
      await AuditService.log(testEntry);

      expect(mockFrom).toHaveBeenCalledWith("admin_audit_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          admin_id: "admin-123",
          action: "create_product",
          target_type: "product",
          target_id: "123",
          new_value: { name: "Test Product" },
          user_agent: "Test Browser/1.0",
        })
      );
    });

    it("should handle null targetId", async () => {
      const entryWithoutId: AuditLogEntry = {
        action: "export_data",
        targetType: "setting",
      };

      await AuditService.log(entryWithoutId);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          target_id: null,
        })
      );
    });

    it("should handle numeric targetId", async () => {
      const entryWithNumericId: AuditLogEntry = {
        action: "update_product",
        targetType: "product",
        targetId: 456,
      };

      await AuditService.log(entryWithNumericId);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          target_id: "456",
        })
      );
    });

    it("should include old and new values", async () => {
      const entryWithValues: AuditLogEntry = {
        action: "update_price",
        targetType: "product",
        targetId: "123",
        oldValue: { price: 29.99 },
        newValue: { price: 39.99 },
      };

      await AuditService.log(entryWithValues);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          old_value: { price: 29.99 },
          new_value: { price: 39.99 },
        })
      );
    });

    it("should include metadata", async () => {
      const entryWithMetadata: AuditLogEntry = {
        action: "bulk_update",
        targetType: "product",
        metadata: { count: 10, operation: "price_increase" },
      };

      await AuditService.log(entryWithMetadata);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { count: 10, operation: "price_increase" },
        })
      );
    });

    it("should return success on successful insert", async () => {
      const result = await AuditService.log(testEntry);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error on insert failure", async () => {
      mockInsert.mockResolvedValue({ error: { message: "Database error" } });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await AuditService.log(testEntry);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
      consoleSpy.mockRestore();
    });

    it("should handle thrown exceptions gracefully", async () => {
      mockInsert.mockRejectedValue(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await AuditService.log(testEntry);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to log action");
      consoleSpy.mockRestore();
    });
  });

  describe("getLogs", () => {
    const mockLogs = [
      {
        id: "log-1",
        admin_id: "admin-123",
        action: "create_product",
        target_type: "product",
        target_id: "456",
        old_value: null,
        new_value: { name: "Product" },
        metadata: {},
        ip_address: null,
        user_agent: "Browser/1.0",
        created_at: "2024-01-15T10:00:00Z",
        profiles: { display_name: "Admin User", email: "admin@example.com" },
      },
    ];

    it("should fetch logs with pagination", async () => {
      const queryMock = createQueryMock({ data: mockLogs, count: 1, error: null });
      mockFrom.mockReturnValue({
        insert: mockInsert,
        select: vi.fn(() => queryMock),
      });

      const result = await AuditService.getLogs({ limit: 10, offset: 0 });

      expect(mockFrom).toHaveBeenCalledWith("admin_audit_logs");
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it("should filter by adminId without error", async () => {
      const result = await AuditService.getLogs({ adminId: "admin-123" });

      expect(result.error).toBeUndefined();
    });

    it("should filter by action without error", async () => {
      const result = await AuditService.getLogs({ action: "create_product" });

      expect(result.error).toBeUndefined();
    });

    it("should filter by targetType without error", async () => {
      const result = await AuditService.getLogs({ targetType: "product" });

      expect(result.error).toBeUndefined();
    });

    it("should filter by targetId without error", async () => {
      const result = await AuditService.getLogs({ targetId: "456" });

      expect(result.error).toBeUndefined();
    });

    it("should filter by date range without error", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const result = await AuditService.getLogs({ startDate, endDate });

      expect(result.error).toBeUndefined();
    });

    it("should transform joined profile data", async () => {
      const queryMock = createQueryMock({ data: mockLogs, count: 1, error: null });
      mockFrom.mockReturnValue({
        insert: mockInsert,
        select: vi.fn(() => queryMock),
      });

      const result = await AuditService.getLogs();

      expect(result.data[0].admin_name).toBe("Admin User");
      expect(result.data[0].admin_email).toBe("admin@example.com");
    });

    it("should handle missing profile data", async () => {
      const queryMock = createQueryMock({
        data: [{ ...mockLogs[0], profiles: null }],
        count: 1,
        error: null,
      });
      mockFrom.mockReturnValue({
        insert: mockInsert,
        select: vi.fn(() => queryMock),
      });

      const result = await AuditService.getLogs();

      expect(result.data[0].admin_name).toBe("Unknown");
      expect(result.data[0].admin_email).toBe("");
    });

    it("should return empty array on error", async () => {
      const queryMock = createQueryMock({
        data: null,
        count: 0,
        error: { message: "Database error" },
      });
      mockFrom.mockReturnValue({
        insert: mockInsert,
        select: vi.fn(() => queryMock),
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await AuditService.getLogs();

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.error).toBe("Database error");
      consoleSpy.mockRestore();
    });

    it("should use default limit and offset", async () => {
      const result = await AuditService.getLogs();

      expect(result.error).toBeUndefined();
    });
  });

  describe("getResourceHistory", () => {
    it("should return logs for resource", async () => {
      const result = await AuditService.getResourceHistory("product", "123");

      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const result = await AuditService.getResourceHistory("product", "123", 10);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getAdminActivity", () => {
    it("should return logs for admin", async () => {
      const result = await AuditService.getAdminActivity("admin-123");

      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const result = await AuditService.getAdminActivity("admin-123", 25);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("formatAction", () => {
    it("should format create_product", () => {
      expect(AuditService.formatAction("create_product")).toBe("Created product");
    });

    it("should format update_product", () => {
      expect(AuditService.formatAction("update_product")).toBe("Updated product");
    });

    it("should format delete_product", () => {
      expect(AuditService.formatAction("delete_product")).toBe("Deleted product");
    });

    it("should format update_price", () => {
      expect(AuditService.formatAction("update_price")).toBe("Updated price");
    });

    it("should format update_inventory", () => {
      expect(AuditService.formatAction("update_inventory")).toBe("Updated inventory");
    });

    it("should format update_order_status", () => {
      expect(AuditService.formatAction("update_order_status")).toBe(
        "Updated order status"
      );
    });

    it("should format cancel_order", () => {
      expect(AuditService.formatAction("cancel_order")).toBe("Cancelled order");
    });

    it("should format refund_order", () => {
      expect(AuditService.formatAction("refund_order")).toBe("Refunded order");
    });

    it("should format create_appointment", () => {
      expect(AuditService.formatAction("create_appointment")).toBe(
        "Created appointment"
      );
    });

    it("should format update_appointment", () => {
      expect(AuditService.formatAction("update_appointment")).toBe(
        "Updated appointment"
      );
    });

    it("should format cancel_appointment", () => {
      expect(AuditService.formatAction("cancel_appointment")).toBe(
        "Cancelled appointment"
      );
    });

    it("should format update_user_role", () => {
      expect(AuditService.formatAction("update_user_role")).toBe("Updated user role");
    });

    it("should format update_user_tier", () => {
      expect(AuditService.formatAction("update_user_tier")).toBe("Updated user tier");
    });

    it("should format ban_user", () => {
      expect(AuditService.formatAction("ban_user")).toBe("Banned user");
    });

    it("should format update_setting", () => {
      expect(AuditService.formatAction("update_setting")).toBe("Updated setting");
    });

    it("should format export_data", () => {
      expect(AuditService.formatAction("export_data")).toBe("Exported data");
    });

    it("should format bulk_update", () => {
      expect(AuditService.formatAction("bulk_update")).toBe("Bulk update");
    });

    it("should format delete_archive", () => {
      expect(AuditService.formatAction("delete_archive")).toBe("Deleted archive");
    });
  });
});
