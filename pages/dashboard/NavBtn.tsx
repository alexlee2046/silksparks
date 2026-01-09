import React from "react";
import type { NavBtnProps } from "./types";

export const NavBtn: React.FC<NavBtnProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${active ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(244,192,37,0.1)]" : "text-text-muted hover:bg-surface-border/30 hover:text-foreground border border-transparent"}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
};
