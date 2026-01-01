import React from "react";
import { useForm, useSelect } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ArchiveCreate: React.FC = () => {
  const { onFinish, mutation } = useForm({
    action: "create",
    resource: "archives",
    redirect: "list",
  });

  const { options: userOptions } = useSelect({
    resource: "profiles",
    optionLabel: "email",
    optionValue: "id",
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onFinish(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
        Create New Report
      </h1>

      <GlassCard className="p-8 border-surface-border" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Title
              </label>
              <input
                name="title"
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
                placeholder="E.g. Detailed Natal Chart Analysis"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                User (Recipient)
              </label>
              <select
                name="user_id"
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="">Select User...</option>
                {userOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Type
              </label>
              <select
                name="type"
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="Astrology">Astrology Report</option>
                <option value="Tarot">Tarot Reading</option>
                <option value="Numerology">Numerology Chart</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Image URL (Optional)
              </label>
              <input
                name="image_url"
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Summary (Preview Text)
            </label>
            <textarea
              name="summary"
              rows={3}
              className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
              placeholder="Brief overview..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Full Content (Markdown Supported)
            </label>
            <textarea
              name="content"
              rows={10}
              className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors font-mono text-sm"
              placeholder="Enter the full reading here..."
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
              {mutation?.isPending ? "Publishing..." : "Publish Report"}
            </GlowButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
