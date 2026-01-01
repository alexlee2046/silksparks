import React from "react";
import { useList, useGo, useDelete, Authenticated } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ExpertList: React.FC = () => {
  const { query } = useList({
    resource: "experts",
  });
  const { data: experts, isLoading } = query;
  const go = useGo();
  const { mutate: deleteExpert } = useDelete();

  return (
    <Authenticated key="admin-experts-auth" fallback={null}>
      <ExpertListContent
        isLoading={isLoading}
        experts={experts}
        go={go}
        onDelete={(id: string) =>
          deleteExpert(
            { resource: "experts", id },
            { onSuccess: () => query.refetch() },
          )
        }
      />
    </Authenticated>
  );
};

const ExpertListContent: React.FC<{
  isLoading: boolean;
  experts: any;
  go: ReturnType<typeof useGo>;
  onDelete: (id: string) => void;
}> = ({ isLoading, experts, go, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Summoning Experts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Experts
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          Register Expert
        </GlowButton>
      </div>

      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Name / Title</th>
              <th className="px-6 py-4">Rate (min)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {experts?.data.map((expert: any) => (
              <tr
                key={expert.id}
                className="hover:bg-surface-border/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {expert.image_url ? (
                      <img
                        src={expert.image_url}
                        alt={expert.name}
                        className="w-10 h-10 rounded-full object-cover border border-surface-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {expert.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {expert.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {expert.title}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-primary font-bold">
                  ${expert.price_per_min}
                </td>
                <td className="px-6 py-4">
                  {expert.is_online ? (
                    <span className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 uppercase tracking-wider flex items-center w-fit gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                      Online
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-surface-border/30 border border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      Offline
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex items-center gap-1 text-sm text-amber-400">
                  <span className="material-symbols-outlined text-[16px] text-amber-400 fill-1">
                    star
                  </span>
                  <span className="font-bold">{expert.rating}</span>
                  <span className="text-text-muted text-xs ml-1">
                    ({expert.review_count})
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        go({
                          to: {
                            resource: "experts",
                            action: "edit",
                            id: expert.id,
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
                      onClick={() => {
                        if (confirm(`Delete "${expert.name}"?`)) {
                          onDelete(expert.id);
                        }
                      }}
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
