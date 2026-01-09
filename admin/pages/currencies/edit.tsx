import React from "react";
import { useForm } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const CurrencyEdit: React.FC = () => {
  const { onFinish, mutation, query } = useForm({
    action: "edit",
    resource: "currencies",
    redirect: "list",
  });

  const currency = query?.data?.data;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get("code")?.toString().toUpperCase() || "",
      name: formData.get("name") || "",
      symbol: formData.get("symbol") || "",
      rate: parseFloat(formData.get("rate")?.toString() || "1"),
    };
    onFinish(data);
  };

  if (query?.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading currency...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Edit Currency
        </h1>
        {currency?.is_default && (
          <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider">
            Default
          </span>
        )}
      </div>

      <GlassCard className="p-8" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Currency Code *
              </label>
              <input
                type="text"
                name="code"
                required
                maxLength={3}
                defaultValue={currency?.code}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Symbol *
              </label>
              <input
                type="text"
                name="symbol"
                required
                maxLength={3}
                defaultValue={currency?.symbol}
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Currency Name *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={currency?.name}
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Exchange Rate *
            </label>
            <input
              type="number"
              name="rate"
              required
              step="0.0001"
              min="0.0001"
              defaultValue={currency?.rate}
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
            <p className="text-xs text-text-muted">
              {currency?.is_default
                ? "Default currency rate is always 1.0000"
                : "Rate relative to the default currency"}
            </p>
          </div>

          <div className="pt-4 flex gap-4">
            <GlowButton
              type="submit"
              variant="primary"
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
