import React from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../../components/GlassCard";
import { supabase } from "../../services/supabase";
import type { Currency as CurrencyType } from "../../types/database";
import { AdminLayout } from "./AdminLayout";
import { CurrencyRow } from "./CurrencyRow";

export const Currency: React.FC = () => {
  const navigate = useNavigate();
  const [currencies, setCurrencies] = React.useState<CurrencyType[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCurrencies = async () => {
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("[Admin] Failed to fetch currencies:", error.message);
      } else if (data) {
        setCurrencies(data);
      }
      setLoading(false);
    };
    fetchCurrencies();
  }, []);

  return (
    <AdminLayout title="Currency & Localization" navigate={navigate}>
      <GlassCard className="p-8 border-surface-border">
        <h2 className="text-xl font-bold text-foreground mb-8 font-display flex items-center gap-2">
          <span className="text-primary">✦</span> General Preferences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Base Store Currency
            </label>
            <div className="relative">
              <select className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3.5 text-foreground appearance-none outline-none focus:border-primary/50 transition-colors cursor-pointer">
                {currencies.map((c) => (
                  <option key={c.code} selected={c.is_default}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Primary Language
            </label>
            <div className="relative">
              <select className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3.5 text-foreground appearance-none outline-none focus:border-primary/50 transition-colors cursor-pointer">
                <option>English (Universal)</option>
                <option>Chinese (Simplified)</option>
                <option>French (Standard)</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden border-surface-border p-0">
        <div className="p-8 border-b border-surface-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground font-display">
            Active Multi-Currencies
          </h2>
          <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Add
            Currency
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-10 text-center text-text-muted text-xs tracking-widest uppercase">
              Aligning cosmic rates...
            </div>
          ) : (
            currencies.map((c) => (
              <CurrencyRow
                key={c.id}
                name={c.name}
                code={c.code}
                rate={c.rate.toFixed(4)}
                defaultC={c.is_default}
              />
            ))
          )}
        </div>
      </GlassCard>
    </AdminLayout>
  );
};
