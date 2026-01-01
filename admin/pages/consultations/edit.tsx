import React from "react";
import { useForm, useSelect } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ConsultationEdit: React.FC = () => {
  const {
    onFinish,
    mutation,
    query: queryResult,
    formLoading,
  } = useForm({
    action: "edit",
    resource: "consultations",
    redirect: "list",
  });

  const { options: expertOptions } = useSelect({
    resource: "experts",
    optionLabel: "name",
    optionValue: "id",
    defaultValue: queryResult?.data?.data?.expert_id,
  });

  const consultation = queryResult?.data?.data;

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
          Loading Service Details...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
        Edit Consultation Service
      </h1>

      <GlassCard className="p-8 border-surface-border" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Service Name
              </label>
              <input
                name="name"
                defaultValue={consultation?.name}
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Expert
              </label>
              <select
                name="expert_id"
                defaultValue={consultation?.expert_id}
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="">Select Expert...</option>
                {expertOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Price ($)
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={consultation?.price}
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Duration (Minutes)
              </label>
              <input
                name="duration"
                type="number"
                defaultValue={consultation?.duration}
                required
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground focus:border-primary/50 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={consultation?.description}
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
    </div>
  );
};
