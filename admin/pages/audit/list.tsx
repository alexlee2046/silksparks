import React, { useState } from "react";
import { useList } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";

type AuditLog = {
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
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  update_user_role: { label: "Role Change", color: "text-amber-400" },
  delete_product: { label: "Delete Product", color: "text-red-400" },
  update_product: { label: "Update Product", color: "text-blue-400" },
  create_product: { label: "Create Product", color: "text-green-400" },
  update_price: { label: "Price Change", color: "text-purple-400" },
  update_order_status: { label: "Order Status", color: "text-cyan-400" },
  cancel_order: { label: "Cancel Order", color: "text-red-400" },
  refund_order: { label: "Refund", color: "text-orange-400" },
  update_setting: { label: "Settings", color: "text-gray-400" },
  delete_archive: { label: "Delete Archive", color: "text-red-400" },
  update_appointment: { label: "Appointment", color: "text-indigo-400" },
  cancel_appointment: { label: "Cancel Appt", color: "text-red-400" },
};

const TARGET_TYPES: Record<string, string> = {
  product: "Product",
  order: "Order",
  profile: "User",
  user: "User",
  appointment: "Appointment",
  archive: "Archive",
  setting: "Setting",
  expert: "Expert",
};

export const AuditLogList: React.FC = () => {
  const [actionFilter, setActionFilter] = useState<string>("");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("");

  const { query } = useList<AuditLog>({
    resource: "admin_audit_logs",
    pagination: {
      pageSize: 50,
    },
    sorters: [{ field: "created_at", order: "desc" }],
    filters: [
      ...(actionFilter ? [{ field: "action", operator: "eq" as const, value: actionFilter }] : []),
      ...(targetTypeFilter ? [{ field: "target_type", operator: "eq" as const, value: targetTypeFilter }] : []),
    ],
    meta: {
      select: "*, profiles:admin_id(full_name, email)",
    },
  });

  const { data, isLoading } = query;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    const config = ACTION_LABELS[action] || { label: action, color: "text-gray-400" };
    return (
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatChanges = (oldVal: Record<string, unknown> | null, newVal: Record<string, unknown> | null) => {
    if (!oldVal && !newVal) return null;

    const changes: { key: string; from: string; to: string }[] = [];
    const allKeys = new Set([
      ...Object.keys(oldVal || {}),
      ...Object.keys(newVal || {}),
    ]);

    allKeys.forEach(key => {
      const oldValue = oldVal?.[key];
      const newValue = newVal?.[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          key,
          from: oldValue !== undefined ? String(oldValue) : "-",
          to: newValue !== undefined ? String(newValue) : "-",
        });
      }
    });

    if (changes.length === 0) return null;

    return (
      <div className="text-xs space-y-1 mt-2">
        {changes.slice(0, 3).map((change, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-text-muted">{change.key}:</span>
            <span className="text-red-400/70 line-through">{change.from}</span>
            <span className="material-symbols-outlined text-[10px] text-text-muted">arrow_forward</span>
            <span className="text-green-400">{change.to}</span>
          </div>
        ))}
        {changes.length > 3 && (
          <span className="text-text-muted">+{changes.length - 3} more changes</span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading audit logs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Audit Logs
        </h1>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="material-symbols-outlined text-sm">shield</span>
          <span>Security & Compliance</span>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4" intensity="low">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted uppercase tracking-wider">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-background border border-surface-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted uppercase tracking-wider">Target</label>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="bg-background border border-surface-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">All Types</option>
              {Object.entries(TARGET_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {(actionFilter || targetTypeFilter) && (
            <button
              onClick={() => {
                setActionFilter("");
                setTargetTypeFilter("");
              }}
              className="text-xs text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear
            </button>
          )}
        </div>
      </GlassCard>

      {/* Logs Table */}
      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data?.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">shield</span>
                  No audit logs found
                </td>
              </tr>
            ) : (
              data?.data.map((log) => (
                <tr key={log.id} className="hover:bg-surface-border/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">{formatDate(log.created_at)}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {log.profiles?.full_name || "Unknown"}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {log.profiles?.email || log.admin_id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {TARGET_TYPES[log.target_type] || log.target_type}
                    </div>
                    {log.target_id && (
                      <div className="text-[10px] text-text-muted font-mono">
                        #{log.target_id.slice(0, 8)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {formatChanges(log.old_value, log.new_value)}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-[10px] text-text-muted mt-1">
                        {Object.entries(log.metadata).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="mr-2">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Showing {data?.data.length || 0} logs</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-green-400">lock</span>
          Logs are immutable and cannot be modified
        </span>
      </div>
    </div>
  );
};
