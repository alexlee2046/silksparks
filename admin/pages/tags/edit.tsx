import React from "react";
import { useForm } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const TagEdit: React.FC = () => {
  const {
    onFinish,
    mutation,
    query: queryResult,
    formLoading,
  } = useForm({
    action: "edit",
    resource: "tags",
    redirect: "list",
  });

  const tag = queryResult?.data?.data;

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
          Loading Tag...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
        Edit Tag
      </h1>

      <GlassCard className="p-8 border-surface-border" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Tag Name
            </label>
            <input
              name="name"
              defaultValue={tag?.name}
              required
              className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Type
            </label>
            <select
              name="type"
              defaultValue={tag?.type}
              required
              className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors appearance-none"
            >
              <option value="ProductCategory">Product Category</option>
              <option value="Expert">Expert Specialty</option>
              <option value="Intention">Intention / Vibe</option>
              <option value="Element">Element</option>
              <option value="Zodiac">Zodiac</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                name="color"
                defaultValue={tag?.color || "#a855f7"}
                className="h-12 w-12 bg-transparent border-0 cursor-pointer"
              />
              <span className="text-text-muted text-xs">Pick a hex color</span>
            </div>
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
    </div>
  );
};
