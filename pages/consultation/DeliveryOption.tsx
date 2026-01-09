import React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import type { DeliveryOptionProps } from "./types";

export const DeliveryOption: React.FC<DeliveryOptionProps> = ({
  title,
  icon,
  desc,
  action,
  onClick,
  delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    onClick={onClick}
    className="h-full flex flex-col"
  >
    <GlassCard
      hoverEffect
      interactive
      className="flex flex-col flex-1 bg-surface-border/10 border-surface-border group overflow-hidden p-0 rounded-3xl"
    >
      <div className="flex flex-col flex-1 h-full">
        <div className="p-10 flex flex-col items-center text-center flex-1">
          <div className="mb-8 flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/5 text-primary border border-primary/10 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(244,192,37,0.2)] transition-all duration-500 transform rotate-3 group-hover:rotate-0">
            <span className="material-symbols-outlined text-[44px]">
              {icon}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-4 font-display">
            {title}
          </h3>
          <p className="text-text-muted leading-relaxed mb-8 flex-1 font-light text-lg">
            {desc}
          </p>
        </div>
        <div className="p-8 pt-0 w-full mt-auto">
          <button className="w-full py-5 px-8 rounded-2xl bg-surface-border/30 border border-surface-border group-hover:border-primary/50 group-hover:bg-primary/10 text-foreground font-bold transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] group-hover:text-primary shadow-xl">
            {action}
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);
