import React from "react";
import type { AdminNavLinkProps } from "./types";

export const AdminNavLink: React.FC<AdminNavLinkProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3.5 text-sm font-bold w-full text-left rounded-xl transition-all duration-300 group ${active ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(244,192,37,0.1)]" : "text-text-muted hover:bg-surface-border/30 hover:text-foreground border border-transparent"}`}
  >
    <span
      className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
    >
      {icon}
    </span>
    <span className="tracking-wide uppercase text-[10px] font-bold">
      {label}
    </span>
  </button>
);
