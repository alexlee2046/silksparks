/**
 * Wu Xing Wheel Component
 *
 * Visual representation of the Five Elements (五行) distribution.
 */

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { WuXingDistribution, WuXing } from "../../lib/bazi/types";
import { WU_XING_NAMES, WU_XING_COLORS } from "../../lib/bazi/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WuXingWheelProps {
  distribution: WuXingDistribution;
  favorableElements?: WuXing[];
  unfavorableElements?: WuXing[];
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CONFIG = {
  sm: { container: 120, bar: 8, text: "text-xs" },
  md: { container: 180, bar: 12, text: "text-sm" },
  lg: { container: 240, bar: 16, text: "text-base" },
};

export const WuXingWheel: React.FC<WuXingWheelProps> = ({
  distribution,
  favorableElements = [],
  unfavorableElements = [],
  showLabels = true,
  size = "md",
  className,
}) => {
  const elements: WuXing[] = ["木", "火", "土", "金", "水"];
  const config = SIZE_CONFIG[size];

  // Sort by percentage for display
  const sortedElements = [...elements].sort(
    (a, b) => distribution[b] - distribution[a]
  );

  const maxPercentage = Math.max(...Object.values(distribution));

  return (
    <div
      className={cn(
        "bg-surface/30 border border-surface-border rounded-xl p-4",
        className
      )}
    >
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-text">五行分布</h3>
        <p className="text-xs text-text-muted">Five Elements Distribution</p>
      </div>

      {/* Bar Chart */}
      <div className="space-y-3">
        {sortedElements.map((el) => {
          const percentage = distribution[el];
          const isFavorable = favorableElements.includes(el);
          const isUnfavorable = unfavorableElements.includes(el);
          const barWidth = (percentage / maxPercentage) * 100;

          return (
            <div key={el} className="flex items-center gap-3">
              {/* Element Label */}
              <div
                className={cn(
                  "w-16 flex items-center gap-1.5",
                  config.text
                )}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: WU_XING_COLORS[el] }}
                />
                <span style={{ color: WU_XING_COLORS[el] }}>{el}</span>
                {showLabels && (
                  <span className="text-text-muted text-xs hidden sm:inline">
                    {WU_XING_NAMES[el]}
                  </span>
                )}
              </div>

              {/* Bar */}
              <div className="flex-1 h-4 bg-surface/50 rounded-full overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isFavorable && "ring-2 ring-green-400/50",
                    isUnfavorable && "ring-2 ring-red-400/50"
                  )}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: WU_XING_COLORS[el],
                  }}
                />
              </div>

              {/* Percentage */}
              <div
                className={cn(
                  "w-12 text-right",
                  config.text,
                  "font-mono"
                )}
                style={{ color: WU_XING_COLORS[el] }}
              >
                {percentage}%
              </div>

              {/* Status Icon */}
              <div className="w-5 flex justify-center">
                {isFavorable && (
                  <span
                    className="text-green-400 text-sm"
                    title="喜用神 Favorable"
                  >
                    ✓
                  </span>
                )}
                {isUnfavorable && (
                  <span
                    className="text-red-400 text-sm"
                    title="忌神 Unfavorable"
                  >
                    ✗
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {(favorableElements.length > 0 || unfavorableElements.length > 0) && (
        <div className="mt-4 pt-3 border-t border-surface-border/50 flex justify-center gap-4 text-xs text-text-muted">
          {favorableElements.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> 喜用神
            </span>
          )}
          {unfavorableElements.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-red-400">✗</span> 忌神
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default WuXingWheel;
