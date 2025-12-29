import React, { useMemo } from "react";
import { useList, useNavigation } from "@refinedev/core";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";

export const Dashboard: React.FC = () => {
  const { list } = useNavigation();

  // 1. Fetch Users Count
  const { query: usersQuery } = useList({
    resource: "profiles",
    pagination: { pageSize: 1 },
  });
  const { data: usersData, isLoading: usersLoading } = usersQuery;

  // 2. Fetch Orders Count & Recent Orders
  const { query: ordersQuery } = useList({
    resource: "orders",
    pagination: { pageSize: 5 },
    sorters: [{ field: "created_at", order: "desc" }],
    meta: { select: "*, profiles(email)" },
  });
  const { data: ordersData, isLoading: ordersLoading } = ordersQuery;

  // 3. Fetch Appointments (Pending/Scheduled)
  const { query: appointmentsQuery } = useList({
    resource: "appointments",
    filters: [{ field: "status", operator: "eq", value: "scheduled" }],
    pagination: { pageSize: 1 },
  });
  const { data: appointmentsData, isLoading: appointmentsLoading } = appointmentsQuery;

  // Calculate generic stats
  const totalUsers = usersData?.total || 0;
  const totalOrders = ordersData?.total || 0;
  const pendingAppointments = appointmentsData?.total || 0;

  // Loading state helper
  const isLoading = usersLoading || ordersLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-display font-light text-white tracking-tight">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          icon="group"
          color="text-blue-400"
        />
        <StatsCard
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          icon="receipt_long"
          color="text-emerald-400"
        />
        <StatsCard
          label="Pending Sessions"
          value={pendingAppointments.toLocaleString()}
          icon="calendar_clock"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <GlassCard
          className="p-0 border-white/5 overflow-hidden min-h-[400px]"
          intensity="low"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white font-display">
              Recent Orders
            </h3>
            <GlowButton variant="secondary" onClick={() => list("orders")}>
              View All
            </GlowButton>
          </div>
          <div className="divide-y divide-white/5">
            {ordersData?.data.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                No orders found.
              </div>
            ) : (
              ordersData?.data.map((order: any) => (
                <div
                  key={order.id}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">
                      Order #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-white/40 text-xs">
                      {order.profiles?.email || "Guest"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-mono font-bold">
                      ${Number(order.total).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Quick Actions / System Status (Placeholder for now) */}
        <GlassCard className="p-6 border-white/5 space-y-6" intensity="low">
          <h3 className="text-lg font-bold text-white font-display">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <GlowButton
              variant="secondary"
              icon="add"
              onClick={() => list("products")}
            >
              Add Product
            </GlowButton>
            <GlowButton
              variant="secondary"
              icon="history_edu"
              onClick={() => list("archives")}
            >
              New Report
            </GlowButton>
            <GlowButton
              variant="secondary"
              icon="calendar_add_on"
              onClick={() => list("appointments")}
            >
              Book Session
            </GlowButton>
            <GlowButton
              variant="secondary"
              icon="local_shipping"
              onClick={() => list("shipping_zones")}
            >
              Shipping Settings
            </GlowButton>
          </div>

          <div className="pt-6 border-t border-white/5">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              System Status
            </h4>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Database Connected
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const StatsCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) => (
  <GlassCard
    className="p-6 border-white/5 relative overflow-hidden group"
    intensity="low"
  >
    <div
      className={`absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}
    >
      <span className="material-symbols-outlined text-6xl">{icon}</span>
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold text-white font-display">
          {value}
        </span>
      </div>
    </div>
  </GlassCard>
);
