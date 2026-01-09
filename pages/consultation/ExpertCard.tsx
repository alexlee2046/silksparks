import React from "react";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import type { ExpertCardProps } from "./types";

export const ExpertCard: React.FC<ExpertCardProps> = ({
  name,
  title,
  rating,
  reviews,
  price,
  tags,
  image,
  isOnline,
  onBook,
  onProfile,
  index,
}) => (
  <div
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <GlassCard
      hoverEffect
      interactive
      className="flex flex-col h-full group p-0 overflow-hidden bg-surface/40"
    >
      <div
        className="relative aspect-[4/3] w-full bg-cover bg-top group-hover:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url('${image}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-90"></div>
        {isOnline && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border border-surface-border">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">
              Online
            </span>
          </div>
        )}
        <div className="absolute bottom-3 right-3 bg-primary text-background font-bold text-xs px-2 py-1 rounded shadow-lg shadow-black/50">
          {price}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1 relative bg-surface/80 backdrop-blur-xl border-t border-surface-border">
        <div className="space-y-1">
          <h3 className="text-foreground text-xl font-bold font-display group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-text-muted text-sm font-medium">{title}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex text-primary text-[14px]">
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
          </div>
          <span className="text-foreground font-bold text-sm">{rating}</span>
          <span className="text-text-muted text-xs">({reviews} reviews)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags?.map((t: string) => (
            <span
              key={t}
              className="px-2 py-1 rounded-md bg-surface-border/30 border border-surface-border text-text-muted text-[10px] font-bold uppercase tracking-wider group-hover:border-primary/20 transition-colors"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 flex gap-3">
          <GlowButton
            variant="secondary"
            onClick={() => onProfile && onProfile()}
            className="flex-1 text-sm"
          >
            Profile
          </GlowButton>
          <GlowButton
            variant="primary"
            onClick={onBook}
            className="flex-1 text-sm"
          >
            Book
          </GlowButton>
        </div>
      </div>
    </GlassCard>
  </div>
);
