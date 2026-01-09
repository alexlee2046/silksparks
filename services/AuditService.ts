/**
 * Audit Service - Admin Action Logging
 * Records sensitive admin operations for compliance and debugging
 */

import { supabase } from "./supabase";

export type AuditAction =
  | "create_product"
  | "update_product"
  | "delete_product"
  | "update_price"
  | "update_inventory"
  | "update_order_status"
  | "cancel_order"
  | "refund_order"
  | "create_appointment"
  | "update_appointment"
  | "cancel_appointment"
  | "update_user_role"
  | "update_user_tier"
  | "ban_user"
  | "update_setting"
  | "export_data"
  | "bulk_update"
  | "delete_archive";

export type TargetType =
  | "product"
  | "order"
  | "order_item"
  | "user"
  | "profile"
  | "appointment"
  | "archive"
  | "setting"
  | "expert";

export interface AuditLogEntry {
  action: AuditAction;
  targetType: TargetType;
  targetId?: string | number;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined from profiles
  admin_name?: string;
  admin_email?: string;
}

export const AuditService = {
  /**
   * Log an admin action
   * Note: This should be called from Edge Functions with service_role
   * for proper RLS bypass. Client-side calls will fail due to RLS.
   */
  async log(entry: AuditLogEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      // Get client info
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;

      // Note: IP address cannot be obtained client-side, will be null
      // For production, use Edge Function to capture IP from request headers

      // Cast to any to work around incomplete database types
      const { error } = await (supabase.from("admin_audit_logs") as ReturnType<typeof supabase.from>).insert({
        admin_id: user.id,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId?.toString() || null,
        old_value: entry.oldValue || null,
        new_value: entry.newValue || null,
        metadata: entry.metadata || {},
        user_agent: userAgent,
      } as Record<string, unknown>);

      if (error) {
        console.error("[AuditService] Failed to log action:", error);
        // Don't throw - audit logging should not block operations
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("[AuditService] Error:", err);
      return { success: false, error: "Failed to log action" };
    }
  },

  /**
   * Get audit logs with pagination and filtering
   * Only accessible to admins
   */
  async getLogs(options: {
    limit?: number;
    offset?: number;
    adminId?: string;
    action?: AuditAction;
    targetType?: TargetType;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ data: AuditLogRecord[]; count: number; error?: string }> {
    try {
      const {
        limit = 50,
        offset = 0,
        adminId,
        action,
        targetType,
        targetId,
        startDate,
        endDate,
      } = options;

      // Cast to work around incomplete database types
      let query = (supabase
        .from("admin_audit_logs") as ReturnType<typeof supabase.from>)
        .select(`
          *,
          profiles:admin_id (
            display_name,
            email
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (adminId) {
        query = query.eq("admin_id", adminId);
      }
      if (action) {
        query = query.eq("action", action);
      }
      if (targetType) {
        query = query.eq("target_type", targetType);
      }
      if (targetId) {
        query = query.eq("target_id", targetId);
      }
      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, count, error } = await query;

      if (error) {
        console.error("[AuditService] Failed to get logs:", error);
        return { data: [], count: 0, error: error.message };
      }

      // Transform the joined data
      type LogWithProfiles = Record<string, unknown> & {
        profiles?: { display_name?: string; email?: string } | null;
      };
      const logs: AuditLogRecord[] = ((data || []) as LogWithProfiles[]).map((log) => ({
        ...(log as Record<string, unknown>),
        admin_name: log.profiles?.display_name || "Unknown",
        admin_email: log.profiles?.email || "",
      })) as AuditLogRecord[];

      return { data: logs, count: count || 0 };
    } catch (err) {
      console.error("[AuditService] Error:", err);
      return { data: [], count: 0, error: "Failed to get logs" };
    }
  },

  /**
   * Get recent activity for a specific resource
   */
  async getResourceHistory(
    targetType: TargetType,
    targetId: string,
    limit: number = 20
  ): Promise<AuditLogRecord[]> {
    const { data } = await this.getLogs({
      targetType,
      targetId,
      limit,
    });
    return data;
  },

  /**
   * Get admin's recent activity
   */
  async getAdminActivity(
    adminId: string,
    limit: number = 50
  ): Promise<AuditLogRecord[]> {
    const { data } = await this.getLogs({
      adminId,
      limit,
    });
    return data;
  },

  /**
   * Helper to format action for display
   */
  formatAction(action: AuditAction): string {
    const actionLabels: Record<AuditAction, string> = {
      create_product: "Created product",
      update_product: "Updated product",
      delete_product: "Deleted product",
      update_price: "Updated price",
      update_inventory: "Updated inventory",
      update_order_status: "Updated order status",
      cancel_order: "Cancelled order",
      refund_order: "Refunded order",
      create_appointment: "Created appointment",
      update_appointment: "Updated appointment",
      cancel_appointment: "Cancelled appointment",
      update_user_role: "Updated user role",
      update_user_tier: "Updated user tier",
      ban_user: "Banned user",
      update_setting: "Updated setting",
      export_data: "Exported data",
      bulk_update: "Bulk update",
      delete_archive: "Deleted archive",
    };
    return actionLabels[action] || action;
  },
};
