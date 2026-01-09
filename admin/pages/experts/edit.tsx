import React from "react";
import { useForm } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";
import { ExpertAvailability } from "../../components/ExpertAvailability";

export const ExpertEdit: React.FC = () => {
  const {
    onFinish,
    mutation,
    query: queryResult,
    formLoading,
  } = useForm({
    action: "edit",
    resource: "experts",
    redirect: "list",
  });

  const expert = queryResult?.data?.data;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onFinish(data);
  };

  if (formLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading Expert Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
        Edit Expert
      </h1>

      <GlassCard className="p-8 border-surface-border" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Name
              </label>
              <input
                name="name"
                defaultValue={expert?.name}
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Title
              </label>
              <input
                name="title"
                defaultValue={expert?.title}
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Price per Minute ($)
              </label>
              <input
                name="price_per_min"
                type="number"
                step="0.01"
                defaultValue={expert?.price_per_min}
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Status
              </label>
              <select
                name="is_online"
                defaultValue={expert?.is_online?.toString()}
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="true">Online</option>
                <option value="false">Offline</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Profile Image URL
            </label>
            <input
              name="image_url"
              defaultValue={expert?.image_url}
              className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Bio
            </label>
            <textarea
              name="bio"
              defaultValue={expert?.bio}
              rows={4}
              className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <GlowButton
              variant="secondary"
              type="button"
              onClick={() => window.history.back()}
            >
              Cancel
            </GlowButton>
            <GlowButton
              variant="primary"
              type="submit"
              disabled={mutation?.isPending}
            >
              {mutation?.isPending ? "Saving..." : "Save Changes"}
            </GlowButton>
          </div>
        </form>
      </GlassCard>

      {/* Availability Management */}
      {expert?.id && (
        <ExpertAvailability expertId={String(expert.id)} />
      )}
    </div>
  );
};
