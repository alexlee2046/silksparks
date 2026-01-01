import React from "react";
import { useList, useGo, useDelete } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ShippingList: React.FC = () => {
  const { query } = useList({
    resource: "shipping_zones",
  });
  const { data: zones, isLoading } = query;
  const { mutate: deleteZone } = useDelete();
  const go = useGo();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete shipping zone "${name}"?`)) {
      deleteZone(
        { resource: "shipping_zones", id },
        { onSuccess: () => query.refetch() },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading Shipping Zones...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Shipping Configuration
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          New Zone
        </GlowButton>
      </div>

      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Zone Name</th>
              <th className="px-6 py-4">Region(s)</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {zones?.data.map((item: any) => (
              <tr
                key={item.id}
                className="hover:bg-surface-border/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <span className="text-lg font-bold text-foreground">
                    {item.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="material-symbols-outlined text-[16px]">
                      public
                    </span>
                    {item.region}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        go({
                          to: {
                            resource: "shipping_zones",
                            action: "edit",
                            id: item.id,
                          },
                        })
                      }
                      className="text-text-muted hover:text-foreground transition-colors flex items-center gap-1 bg-surface-border/30 px-3 py-1.5 rounded-lg border border-surface-border"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        edit
                      </span>{" "}
                      Edit Rates
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-text-muted hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};
