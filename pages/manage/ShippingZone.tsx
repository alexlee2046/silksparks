import React from "react";
import type { ShippingZoneProps } from "./types";

export const ShippingZone: React.FC<ShippingZoneProps> = ({ name, rates }) => (
  <div className="border border-surface-border rounded-2xl bg-black/20 overflow-hidden group hover:border-primary/20 transition-all duration-300">
    <div className="bg-surface-border/30 px-6 py-4 border-b border-surface-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[18px]">
          flag
        </span>
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
          {name}
        </h4>
      </div>
      <button className="text-[10px] font-bold text-text-muted hover:text-foreground transition-colors uppercase tracking-widest">
        Manage
      </button>
    </div>
    <div className="divide-y divide-white/5">
      {rates.map((r) => (
        <div
          key={r.name}
          className="px-6 py-4 flex items-center justify-between hover:bg-surface-border/30 transition-colors"
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">{r.name}</span>
            <span className="text-[10px] text-text-muted tracking-wide uppercase mt-0.5">
              Calculated Rate
            </span>
          </div>
          <span className="text-sm font-bold text-primary font-mono">
            {r.price}
          </span>
        </div>
      ))}
    </div>
  </div>
);
