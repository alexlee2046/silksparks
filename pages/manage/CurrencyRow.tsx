import React from "react";
import type { CurrencyRowProps } from "./types";

export const CurrencyRow: React.FC<CurrencyRowProps> = ({
  name,
  code,
  rate,
  defaultC,
}) => (
  <div className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-surface-border/30 transition-all duration-300 group">
    <div className="col-span-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-bold text-text-muted text-xs">
        {code.substring(0, 2)}
      </div>
      <div>
        <div className="text-foreground font-bold text-sm flex items-center gap-3">
          {name}
          {defaultC && (
            <span className="px-2 py-0.5 rounded-full text-[8px] bg-primary text-background-dark font-bold uppercase tracking-widest">
              Main
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-muted font-mono mt-0.5">{code}</p>
      </div>
    </div>
    <div className="col-span-4 text-foreground font-mono text-sm tracking-widest">
      {rate}
    </div>
    <div className="col-span-3 text-right">
      <button className="text-text-muted hover:text-primary transition-colors h-8 w-8 rounded-lg hover:bg-primary/10 flex items-center justify-center ml-auto">
        <span className="material-symbols-outlined text-lg">edit</span>
      </button>
    </div>
  </div>
);
