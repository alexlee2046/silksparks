/**
 * Ten Gods Grid Component
 *
 * Display of the Ten Gods (十神) analysis.
 */

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TenGodsAnalysis } from "../../lib/bazi/types";
import { TEN_GOD_NAMES, TEN_GODS } from "../../lib/bazi/types";
import { getTenGodCategory } from "../../lib/bazi/tenGods";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TenGodsGridProps {
  tenGods: TenGodsAnalysis;
  showEnglish?: boolean;
  compact?: boolean;
  className?: string;
}

// Category colors
const CATEGORY_COLORS: Record<ReturnType<typeof getTenGodCategory>, string> = {
  parallel: "bg-blue-500/20 border-blue-500/50 text-blue-300",
  output: "bg-purple-500/20 border-purple-500/50 text-purple-300",
  wealth: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
  power: "bg-red-500/20 border-red-500/50 text-red-300",
  resource: "bg-green-500/20 border-green-500/50 text-green-300",
};

const CATEGORY_LABELS: Record<
  ReturnType<typeof getTenGodCategory>,
  { cn: string; en: string }
> = {
  parallel: { cn: "比劫", en: "Parallel" },
  output: { cn: "食伤", en: "Output" },
  wealth: { cn: "财星", en: "Wealth" },
  power: { cn: "官杀", en: "Power" },
  resource: { cn: "印星", en: "Resource" },
};

export const TenGodsGrid: React.FC<TenGodsGridProps> = ({
  tenGods,
  showEnglish = false,
  compact = false,
  className,
}) => {
  const { distribution, dominant, missing } = tenGods;

  // Group by category
  const categories = ["parallel", "output", "wealth", "power", "resource"] as const;

  const groupedGods = categories.map((cat) => ({
    category: cat,
    gods: TEN_GODS.filter((g) => getTenGodCategory(g) === cat),
  }));

  return (
    <div
      className={cn(
        "bg-surface/30 border border-surface-border rounded-xl p-4",
        className
      )}
    >
      {/* Title */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-text">十神分析</h3>
        {showEnglish && (
          <p className="text-xs text-text-muted">Ten Gods Analysis</p>
        )}
      </div>

      {/* Grid by category */}
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-5" : "grid-cols-2 sm:grid-cols-5"
        )}
      >
        {groupedGods.map(({ category, gods }) => (
          <div key={category} className="space-y-2">
            {/* Category Header */}
            <div
              className={cn(
                "text-center text-xs font-medium py-1 rounded-t-lg border-b",
                CATEGORY_COLORS[category]
              )}
            >
              <span>{CATEGORY_LABELS[category].cn}</span>
              {showEnglish && (
                <span className="block text-[10px] opacity-70">
                  {CATEGORY_LABELS[category].en}
                </span>
              )}
            </div>

            {/* Gods in category */}
            {gods.map((god) => {
              const count = distribution[god];
              const isDominant = dominant === god;
              const isMissing = missing.includes(god);

              return (
                <div
                  key={god}
                  className={cn(
                    "px-2 py-1.5 rounded-lg border text-center transition-all",
                    CATEGORY_COLORS[category],
                    isDominant && "ring-2 ring-accent",
                    isMissing && "opacity-40",
                    count > 1 && "font-bold"
                  )}
                >
                  <div className="text-sm">{god}</div>
                  {showEnglish && (
                    <div className="text-[10px] opacity-70">
                      {TEN_GOD_NAMES[god]}
                    </div>
                  )}
                  <div className="text-xs mt-0.5 font-mono">
                    {count > 0 ? count.toFixed(1) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-surface-border/50 text-sm text-center">
        {dominant && (
          <p className="text-text">
            <span className="text-text-muted">主导十神：</span>
            <span className="font-semibold text-accent ml-1">
              {dominant}
              {showEnglish && ` (${TEN_GOD_NAMES[dominant]})`}
            </span>
          </p>
        )}
        {missing.length > 0 && (
          <p className="text-text-muted text-xs mt-1">
            缺失：{missing.join("、")}
          </p>
        )}
      </div>
    </div>
  );
};

export default TenGodsGrid;
