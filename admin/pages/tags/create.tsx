import React from "react";
import { useForm } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const TagCreate: React.FC = () => {
  const { onFinish, mutation } = useForm({
    action: "create",
    resource: "tags",
    redirect: "list",
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onFinish(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-light text-white tracking-tight">
        Create New Tag
      </h1>

      <GlassCard className="p-8 border-white/5" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Tag Name
            </label>
            <input
              name="name"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
              placeholder="e.g. Lavender, Healing, Earth"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Type
            </label>
            <select
              name="type"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
            >
              <option value="ProductCategory">Product Category</option>
              <option value="Expert">Expert Specialty</option>
              <option value="Intention">Intention / Vibe</option>
              <option value="Element">Element</option>
              <option value="Zodiac">Zodiac</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                name="color"
                defaultValue="#a855f7"
                className="h-12 w-12 bg-transparent border-0 cursor-pointer"
              />
              <span className="text-white/40 text-xs">Pick a hex color</span>
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
              {mutation?.isPending ? "Saving..." : "Create Tag"}
            </GlowButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
