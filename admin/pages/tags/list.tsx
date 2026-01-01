import React from "react";
import { useList, useGo, useDelete } from "@refinedev/core";
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
  const { mutate: deleteItem } = useDelete();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete tag "${name}"?`)) {
      deleteItem(
        { resource: "tags", id },
        { onSuccess: () => query.refetch() },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading Tags...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
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

      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
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
                className="hover:bg-surface-border/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div
                    className="w-6 h-6 rounded-full border border-surface-border"
                    style={{ backgroundColor: item.color }}
                  ></div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-foreground">
                    {item.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-text-muted font-medium bg-surface-border/30 px-2 py-1 rounded">
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        go({
                          to: { resource: "tags", action: "edit", id: item.id },
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
