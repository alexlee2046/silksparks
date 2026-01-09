import React from "react";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import type { ShopItemProps } from "./types";

export const ShopItem: React.FC<ShopItemProps> = ({
  title,
  price,
  element,
  image,
  badge,
  onClick,
  onQuickAdd,
  index,
}) => (
  <div
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 0.1}s` }}
    onClick={onClick}
  >
    <GlassCard
      hoverEffect
      interactive
      className="flex flex-col gap-3 group h-full"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface border border-surface-border">
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-foreground border border-primary/30 uppercase tracking-widest shadow-lg">
              {badge}
            </span>
          </div>
        )}
        <img
          src={image || ""}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

        {/* Quick Add - visible on mobile, slide-up on desktop hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
          <GlowButton
            variant="primary"
            className="w-full text-xs py-2.5 min-h-[44px]"
            onClick={onQuickAdd}
          >
            Quick Add
          </GlowButton>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <div className="flex justify-between items-start">
          <h3 className="text-foreground font-bold text-base leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="text-primary font-bold">{price}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="material-symbols-outlined text-[14px] text-primary">
            auto_awesome
          </span>{" "}
          <span>{element} Element</span>
        </div>
      </div>
    </GlassCard>
  </div>
);
