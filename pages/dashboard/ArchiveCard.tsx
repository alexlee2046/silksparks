import React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import type { ArchiveCardProps } from "./types";

export const ArchiveCard: React.FC<ArchiveCardProps> = ({ item }) => {
  const bgImage =
    item.image ||
    (item.type === "Astrology"
      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCuy6mtv7iJE3VcfRhDjshoTaD7dUQNqLN1FRvSfpDZf4kZ2S8h90DxDlmIBG7ZTSRaaL66gwwIKpSvJPx81j6QYk0trYBVRmtqIlQfvIDotCaERWFsoUXcjb1aOtCIN2kkaZ-TNzojTtqHs19J8HAbICH7sbBKRr2hANVGOpM2wbqSbDSxhawtuH41k4j2yUVlqEdXGEA8lOaDSa5G7wrDW_hfKT-ZtmZVviS_B6qcElXYkZo6w3CDAxguO77b3SihJkXmj1mxOYv1"
      : "https://lh3.googleusercontent.com/aida-public/AB6AXuDnPk-u1Prw-XJ1l5IJ9mPRdwMJ-CMC9GP4ODzh2wtTQcvRL2Wa_7yo29WR419eE5D3XTACDr4fgRmNbbw9JLocAoItNkw0Iu_M5goh5OTlX-ZTuQ-aWMzpKOIv2HppNVRx8k6Yd3tVfI6FpNrl8FofeyamwOc7yW_OZRQLhLqhl5x8ke_TGUMSlT3ZXWmo3vOZMEHZuoxSHarMJk7uDMq0fwNnL2NhpTJdEEyRkNax5nyU_ElrNXDzunABIue0uMya1q7-ZEt8bHC");

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <GlassCard
        hoverEffect
        interactive
        className="flex flex-col h-full overflow-hidden p-0 border-surface-border group"
      >
        <div
          className="h-48 bg-cover bg-center relative group-hover:scale-105 transition-transform duration-700"
          style={{ backgroundImage: `url('${bgImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-90"></div>
          <div className="absolute top-4 left-4 bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border border-surface-border flex items-center gap-2 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[14px]">
              {item.type === "Tarot" ? "style" : "auto_awesome"}
            </span>
            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
              {item.type}
            </span>
          </div>
        </div>
        <div className="p-6 flex flex-col flex-1 relative bg-surface border-t border-surface-border">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 font-display">
            {item.title}
          </h3>
          <p className="text-xs text-text-muted mb-4 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              calendar_today
            </span>
            {new Date(item.date).toLocaleDateString()}
          </p>
          <p className="text-sm text-text-muted mb-6 line-clamp-3 leading-relaxed font-light">
            {item.summary}
          </p>
          <div className="mt-auto pt-4 border-t border-surface-border">
            <button className="w-full text-foreground text-sm font-bold flex items-center justify-between group/btn hover:text-primary transition-colors">
              Read Full Entry
              <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
