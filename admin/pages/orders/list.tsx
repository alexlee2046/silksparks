import React from "react";
import { useList, useGo } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";

export const OrderList: React.FC = () => {
  const { query } = useList({
    resource: "orders",
    meta: {
      select: "*, profiles(email), order_items(*)",
    },
  });
  const { data: orders, isLoading } = query;
  const go = useGo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Retrieving Cosmic Transactions...
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/20 text-green-400";
      case "pending":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "cancelled":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      default:
        return "bg-surface-border/30 border-surface-border text-text-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Orders
        </h1>
      </div>

      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders?.data.map((order: any) => (
              <tr
                key={order.id}
                className="hover:bg-surface-border/30 transition-colors group"
              >
                <td className="px-6 py-4 text-sm font-mono text-text-muted">
                  #{order.id.slice(0, 8)}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {order.profiles?.email || "Unknown"}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-primary font-bold">
                  ${order.total_amount}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() =>
                      go({
                        to: {
                          resource: "orders",
                          action: "show",
                          id: order.id,
                        },
                      })
                    }
                    className="text-text-muted hover:text-foreground transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      visibility
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};
