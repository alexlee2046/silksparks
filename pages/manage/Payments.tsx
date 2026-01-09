import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { GlassCard } from "../../components/GlassCard";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import type { Order } from "../../types/database";
import { AdminLayout } from "./AdminLayout";
import { StatsMini } from "./StatsMini";
import { ProviderCard } from "./ProviderCard";

interface PaymentStats {
  revenue: number;
  transactions: number;
}

export const Payments: React.FC = () => {
  const navigate = useNavigate();

  const { data: statsData } = useSupabaseQuery<Order, PaymentStats>({
    table: "orders",
    select: "total, status",
    transform: (orders) => {
      const revenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      return [{ revenue, transactions: orders.length }];
    },
    onError: () => toast.error("Failed to load payment stats"),
  });

  const stats = statsData[0] ?? { revenue: 0, transactions: 0 };

  return (
    <AdminLayout title="Payment Configuration" navigate={navigate}>
      <GlassCard className="p-8 border-surface-border">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-8 border-b border-surface-border mb-8">
          <div className="space-y-1">
            <h3 className="text-foreground font-bold text-xl font-display">
              Payment Environment
            </h3>
            <p className="text-text-muted text-sm font-light">
              Control transaction processing mode across the entire platform.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-surface-border">
            <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full text-text-muted hover:text-foreground transition-colors">
              Test Mode
            </button>
            <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full bg-primary text-background-dark shadow-lg shadow-primary/20">
              Live Production
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProviderCard name="Stripe" icon="credit_card" connected />
          <ProviderCard name="PayPal" icon="account_balance_wallet" connected />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsMini
          label="Total Revenue (All Time)"
          value={`$${stats.revenue.toFixed(2)}`}
          change="+100%"
        />
        <StatsMini
          label="Total Orders"
          value={stats.transactions.toString()}
          change="+100%"
        />
        <StatsMini label="Refund Rate" value="0.0%" change="0%" />
      </div>
    </AdminLayout>
  );
};
