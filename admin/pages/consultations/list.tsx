import React from "react";
import { useList, useGo, useDelete } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ConsultationList: React.FC = () => {
  const { query } = useList({
    resource: "consultations",
    meta: {
      select: "*, experts(name, image_url)",
    },
  });
  const { data: consultations, isLoading } = query;
  const go = useGo();
  const { mutate: deleteItem } = useDelete();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteItem(
        { resource: "consultations", id },
        { onSuccess: () => query.refetch() },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading Sacred Offerings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Consultations
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          New Service
        </GlowButton>
      </div>

      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Service Name</th>
              <th className="px-6 py-4">Expert</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {consultations?.data.map((item: any) => (
              <tr
                key={item.id}
                className="hover:bg-surface-border/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-foreground">
                    {item.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {item.experts?.image_url && (
                      <img
                        src={item.experts.image_url}
                        className="w-6 h-6 rounded-full border border-surface-border"
                      />
                    )}
                    <span className="text-sm text-text-muted">
                      {item.experts?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-primary font-bold">
                  ${item.price}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full bg-surface-border/30 border border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {item.duration} mins
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        go({
                          to: {
                            resource: "consultations",
                            action: "edit",
                            id: item.id,
                          },
                        })
                      }
                      className="text-text-muted hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
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
