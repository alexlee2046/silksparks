import React from "react";
import { useForm } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ShippingCreate: React.FC = () => {
  const { onFinish, mutation } = useForm({
    action: "create",
    resource: "shipping_zones",
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
        Create Shipping Zone
      </h1>

      <GlassCard className="p-8 border-white/5" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Zone Name
            </label>
            <input
              name="name"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
              placeholder="e.g. Domestic, International, Europe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Regions / Countries
            </label>
            <input
              name="region"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
              placeholder="e.g. United States, Worldwide"
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
              {mutation?.isPending ? "Creating..." : "Create Zone"}
            </GlowButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
