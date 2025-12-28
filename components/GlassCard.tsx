import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    interactive?: boolean;
    onClick?: () => void;
    intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className,
    hoverEffect = false,
    interactive = false,
    onClick,
    intensity = 'medium'
}) => {
    const baseStyles = "relative overflow-hidden border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300";

    const intensityStyles = {
        low: "bg-surface-dark/30",
        medium: "bg-surface-dark/60",
        high: "bg-surface-dark/90"
    };

    const hoverStyles = hoverEffect || interactive
        ? "hover:bg-surface-dark/80 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1"
        : "";

    const cursorStyles = interactive ? "cursor-pointer" : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(baseStyles, intensityStyles[intensity], hoverStyles, cursorStyles, className)}
            onClick={onClick}
        >
            {/* Glossy gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

            {/* Inner content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
