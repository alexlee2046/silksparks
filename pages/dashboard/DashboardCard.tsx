import React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import type { DashboardCardProps } from "./types";

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  value,
  label,
  color,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="md:col-span-6 lg:col-span-4 cursor-pointer"
      onClick={onClick}
    >
      <GlassCard className="p-6 h-full flex flex-col justify-between border-surface-border hover:border-primary/30 transition-colors group">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10`}
          >
            <span className="material-symbols-outlined text-foreground text-xl">
              {icon}
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-surface-border/30 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-text-muted text-sm font-medium uppercase tracking-wider mb-1">
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground font-display">
              {value}
            </span>
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
