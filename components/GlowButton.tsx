import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlowButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "cosmic";
  icon?: string;
  glowColor?: string;
  children?: React.ReactNode;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  className,
  variant = "primary",
  icon,
  glowColor = "rgba(244,192,37,0.4)", // Default primary gold glow
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-background-dark hover:bg-white hover:text-black shadow-[0_0_20px_rgba(244,192,37,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]",
    secondary:
      "bg-surface-border/30 border border-surface-border text-foreground hover:bg-surface-border/30 hover:border-white/30 backdrop-blur-md",
    ghost: "bg-transparent text-text-muted hover:text-foreground hover:bg-surface-border/30",
    cosmic:
      "bg-gradient-to-r from-primary via-amber-400 to-primary bg-[length:200%_auto] animate-gradient text-background-dark shadow-[0_0_20px_rgba(244,192,37,0.5)] border border-surface-border",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {variant === "cosmic" && (
        <span className="absolute inset-0 rounded-full bg-white/20 blur-lg opacity-0 hover:opacity-100 transition-opacity duration-500" />
      )}

      {icon && (
        <span className="material-symbols-outlined text-lg relative z-10">
          {icon}
        </span>
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
