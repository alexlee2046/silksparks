import React from "react";
import { useList, useGo } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ArchiveList: React.FC = () => {
  const { query } = useList({
    resource: "archives",
    meta: {
      select: "*, profiles(email, full_name)",
    },
  });
  const { data: archives, isLoading } = query;
  const go = useGo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Digital Archives...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-white tracking-tight">
          Digital Archives (CMS)
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          New Report
        </GlowButton>
      </div>

      <GlassCard className="p-0 border-white/5 overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {archives?.data.map((item: any) => (
              <tr
                key={item.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        className="w-8 h-8 rounded-lg object-cover border border-white/10"
                      />
                    )}
                    <span className="text-sm font-bold text-white">
                      {item.title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                      item.type === "Astrology"
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-white">
                      {item.profiles?.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-white/40">
                      {item.profiles?.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-white/40">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() =>
                      go({
                        to: {
                          resource: "archives",
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
