import React from "react";
import { useList, useGo } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const AppointmentList: React.FC = () => {
  const { query } = useList({
    resource: "appointments",
    meta: {
      select: "*, profiles(email, full_name), experts(name)",
    },
  });
  const { data: appointments, isLoading } = query;
  const go = useGo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Appointments...
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "completed":
        return "bg-green-500/10 border-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      default:
        return "bg-white/5 border-white/10 text-white/40";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-white tracking-tight">
          Appointments
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          Book Session
        </GlowButton>
      </div>

      <GlassCard className="p-0 border-white/5 overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Expert</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {appointments?.data.map((item: any) => (
              <tr
                key={item.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">
                      {item.profiles?.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-white/40">
                      {item.profiles?.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-white">
                    {item.experts?.name || "Unassigned"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/60">
                  {new Date(item.booked_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() =>
                      go({
                        to: {
                          resource: "appointments",
                          action: "edit",
                          id: item.id,
                        },
                      })
                    }
                    className="text-white/20 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      edit
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
