import React from "react";
import { useList, useGo } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const TagList: React.FC = () => {
  const { query } = useList({
    resource: "tags",
    meta: {
      order: { field: "type", dir: "asc" },
    },
  });
  const { data: tags, isLoading } = query;
  const go = useGo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Tags...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-white tracking-tight">
          Tags & Categories
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          New Tag
        </GlowButton>
      </div>

      <GlassCard className="p-0 border-white/5 overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Color</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tags?.data.map((item: any) => (
              <tr
                key={item.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div
                    className="w-6 h-6 rounded-full border border-white/10"
                    style={{ backgroundColor: item.color }}
                  ></div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-white">
                    {item.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-white/60 font-medium bg-white/5 px-2 py-1 rounded">
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() =>
                      go({
                        to: { resource: "tags", action: "edit", id: item.id },
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
