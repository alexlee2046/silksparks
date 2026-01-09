import React from "react";
import type { ProviderCardProps } from "./types";

export const ProviderCard: React.FC<ProviderCardProps> = ({
  name,
  icon,
  connected,
}) => (
  <div className="bg-surface-border/30 border border-surface-border rounded-2xl p-6 flex justify-between items-center group hover:border-primary/20 transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-surface-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        <span className="material-symbols-outlined text-foreground text-[32px] group-hover:text-primary transition-colors">
          {icon}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h4 className="text-foreground font-bold text-lg">{name}</h4>
          {connected && (
            <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 uppercase tracking-widest">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted">
          Connect your account to accept payments.
        </p>
      </div>
    </div>
    <button className="h-10 w-10 rounded-xl border border-surface-border flex items-center justify-center text-text-muted hover:bg-primary hover:text-background-dark hover:border-primary transition-all">
      <span className="material-symbols-outlined text-xl">settings</span>
    </button>
  </div>
);
