import React from "react";
import { useForm } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const CurrencyCreate: React.FC = () => {
  const { onFinish, mutation } = useForm({
    action: "create",
    resource: "currencies",
    redirect: "list",
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get("code")?.toString().toUpperCase() || "",
      name: formData.get("name") || "",
      symbol: formData.get("symbol") || "",
      rate: parseFloat(formData.get("rate")?.toString() || "1"),
      is_default: false,
    };
    onFinish(data);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
        Add Currency
      </h1>

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
                placeholder="USD"
                className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors uppercase"
              />
              <p className="text-xs text-text-muted">3-letter ISO code (e.g., USD, EUR)</p>
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
                placeholder="$"
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
              placeholder="US Dollar"
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
              defaultValue="1"
              placeholder="1.0000"
              className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
            <p className="text-xs text-text-muted">Rate relative to the default currency</p>
          </div>

          <div className="pt-4 flex gap-4">
            <GlowButton
              type="submit"
              variant="primary"
              disabled={mutation?.isPending}
            >
              {mutation?.isPending ? "Creating..." : "Create Currency"}
            </GlowButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
