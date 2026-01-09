import React from "react";
import { GlassCard } from "../../components/GlassCard";
import type { StatsMiniProps } from "./types";

export const StatsMini: React.FC<StatsMiniProps> = ({ label, value, change }) => (
  <GlassCard className="p-6 border-surface-border" intensity="low">
    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
      {label}
    </p>
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-bold text-foreground font-display">
        {value}
      </span>
      <span
        className={`text-[10px] font-bold ${change.startsWith("+") ? "text-green-500" : "text-rose-500"}`}
      >
        {change}
      </span>
    </div>
  </GlassCard>
);
