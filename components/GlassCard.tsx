import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  intensity?: "low" | "medium" | "high";
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = false,
  interactive = false,
  onClick,
  intensity = "medium",
}) => {
  const baseStyles =
    "relative overflow-hidden border border-surface-border rounded-2xl backdrop-blur-md transition-all duration-300";

  const intensityStyles = {
    low: "bg-surface/30",
    medium: "bg-surface/60",
    high: "bg-surface/90",
  };

  const hoverStyles =
    hoverEffect || interactive
      ? "hover:bg-surface/80 hover:border-surface-border hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1"
      : "";

  const cursorStyles = interactive ? "cursor-pointer" : "";

  return (
    <div
      className={cn(
        baseStyles,
        intensityStyles[intensity],
        hoverStyles,
        cursorStyles,
        className,
      )}
      onClick={onClick}
    >
      {/* Glossy gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

      {/* Inner content */}
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
};
