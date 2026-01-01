import React from "react";
import { motion } from "framer-motion";

interface ElementBarProps {
  icon: string;
  label: string;
  percent: string;
  color: string;
}

export const ElementBar: React.FC<ElementBarProps> = ({
  icon,
  label,
  percent,
  color,
}) => (
  <div className="flex items-center gap-4 group">
    <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-wider w-20 group-hover:text-foreground transition-colors">
      <span className="material-symbols-outlined text-sm">{icon}</span> {label}
    </div>
    <div className="h-2 flex-1 bg-black/40 rounded-full overflow-hidden border border-surface-border">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: percent }}
        transition={{ duration: 1, ease: "circOut" }}
        className={`${color} h-full rounded-full shadow-[0_0_10px_currentColor]`}
      ></motion.div>
    </div>
    <span className="text-xs font-mono text-text-muted">{percent}</span>
  </div>
);

export default ElementBar;
