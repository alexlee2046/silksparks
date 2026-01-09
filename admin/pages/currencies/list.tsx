import React from "react";
import { useList, useUpdate, useDelete, useGo } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

type Currency = {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
};

export const CurrencyList: React.FC = () => {
  const { query } = useList<Currency>({
    resource: "currencies",
    sorters: [{ field: "is_default", order: "desc" }],
  });
  const { data: currencies, isLoading } = query;
  const go = useGo();
  const { mutate: updateCurrency } = useUpdate();
  const { mutate: deleteCurrency } = useDelete();

  const handleSetDefault = (id: number, code: string) => {
    if (window.confirm(`Set ${code} as the default currency?`)) {
      // First, unset all defaults
      currencies?.data.forEach((c) => {
        if (c.is_default && c.id !== id) {
          updateCurrency({
            resource: "currencies",
            id: c.id,
            values: { is_default: false },
          });
        }
      });
      // Then set the new default
      updateCurrency(
        {
          resource: "currencies",
          id,
          values: { is_default: true },
        },
        {
          onSuccess: () => query.refetch(),
        }
      );
    }
  };

  const handleDelete = (id: number, code: string, isDefault: boolean) => {
    if (isDefault) {
      alert("Cannot delete the default currency. Set another currency as default first.");
      return;
    }
    if (window.confirm(`Delete currency ${code}?`)) {
      deleteCurrency(
        { resource: "currencies", id },
        { onSuccess: () => query.refetch() }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading currencies...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Currency Management
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          Add Currency
        </GlowButton>
      </div>

      {/* Default Currency Card */}
      <GlassCard className="p-6" intensity="low">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Default Store Currency</p>
            <div className="flex items-center gap-2">
              {currencies?.data.filter(c => c.is_default).map(c => (
                <span key={c.id} className="text-2xl font-display text-primary">
                  {c.symbol} {c.code}
                </span>
              ))}
            </div>
          </div>
          <span className="material-symbols-outlined text-3xl text-primary/30">currency_exchange</span>
        </div>
      </GlassCard>

      {/* Currency Table */}
      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Currency</th>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Exchange Rate</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {currencies?.data.map((currency) => (
              <tr
                key={currency.id}
                className="hover:bg-surface-border/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {currency.code.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {currency.code}
                      </div>
                      <div className="text-xs text-text-muted">
                        {currency.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-lg font-mono text-foreground">
                    {currency.symbol}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono text-foreground">
                    {currency.rate.toFixed(4)}
                  </span>
                  {!currency.is_default && (
                    <span className="text-xs text-text-muted ml-2">
                      vs base
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {currency.is_default ? (
                    <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-primary text-[10px] font-bold uppercase tracking-wider">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(currency.id, currency.code)}
                      className="px-3 py-1 rounded-full bg-surface-border/30 border border-surface-border text-text-muted text-[10px] font-bold uppercase tracking-wider hover:bg-surface-border/50 hover:text-foreground transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        go({
                          to: {
                            resource: "currencies",
                            action: "edit",
                            id: currency.id,
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
                      onClick={() => handleDelete(currency.id, currency.code, currency.is_default)}
                      className={`transition-colors ${
                        currency.is_default
                          ? "text-text-muted/30 cursor-not-allowed"
                          : "text-text-muted hover:text-rose-400"
                      }`}
                      title={currency.is_default ? "Cannot delete default" : "Delete"}
                      disabled={currency.is_default}
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

      <div className="text-xs text-text-muted">
        Exchange rates are relative to the default currency. Update rates regularly to reflect market changes.
      </div>
    </div>
  );
};
