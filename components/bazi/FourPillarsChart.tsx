/**
 * Four Pillars Chart Component
 *
 * Visual representation of the BaZi Four Pillars (四柱排盘图).
 */

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  FourPillars,
  HiddenStems,
  HeavenlyStem,
  WuXing,
} from "../../lib/bazi/types";
import {
  STEM_NAMES,
  BRANCH_NAMES,
  BRANCH_ANIMALS,
  WU_XING_COLORS,
} from "../../lib/bazi/types";
import {
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  BRANCH_HIDDEN_STEMS,
} from "../../lib/bazi/constants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FourPillarsChartProps {
  fourPillars: FourPillars;
  hiddenStems?: Record<"year" | "month" | "day" | "hour", HiddenStems>;
  showHidden?: boolean;
  showEnglish?: boolean;
  compact?: boolean;
  className?: string;
}

interface PillarCellProps {
  char: string;
  element: WuXing;
  english?: string;
  animal?: string;
  type: "stem" | "branch";
  showEnglish: boolean;
}

const PillarCell: React.FC<PillarCellProps> = ({
  char,
  element,
  english,
  animal,
  type,
  showEnglish,
}) => {
  const color = WU_XING_COLORS[element];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-lg transition-all",
        "bg-surface/40 border border-surface-border/50",
        "hover:bg-surface/60"
      )}
    >
      <span
        className="text-2xl font-bold"
        style={{ color }}
        title={`${char} - ${element}`}
      >
        {char}
      </span>
      {showEnglish && english && (
        <span className="text-xs text-text-muted mt-0.5">{english}</span>
      )}
      {type === "branch" && animal && (
        <span className="text-xs text-text-muted opacity-70">{animal}</span>
      )}
    </div>
  );
};

interface HiddenStemsDisplayProps {
  hidden: HiddenStems;
  showEnglish: boolean;
}

const HiddenStemsDisplay: React.FC<HiddenStemsDisplayProps> = ({
  hidden,
  showEnglish,
}) => {
  const stems = [hidden.main, hidden.sub, hidden.余气].filter(
    Boolean
  ) as HeavenlyStem[];

  return (
    <div className="flex gap-1 justify-center mt-1">
      {stems.map((stem, i) => {
        const element = STEM_ELEMENT[stem];
        const color = WU_XING_COLORS[element];
        const opacity = i === 0 ? "opacity-100" : i === 1 ? "opacity-60" : "opacity-40";

        return (
          <span
            key={`${stem}-${i}`}
            className={cn("text-xs px-1 rounded", opacity)}
            style={{ color }}
            title={`藏干: ${stem}`}
          >
            {stem}
            {showEnglish && (
              <span className="text-[10px] ml-0.5 text-text-muted">
                ({STEM_NAMES[stem]})
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export const FourPillarsChart: React.FC<FourPillarsChartProps> = ({
  fourPillars,
  hiddenStems,
  showHidden = true,
  showEnglish = false,
  compact = false,
  className,
}) => {
  const positions = ["hour", "day", "month", "year"] as const;
  const positionLabels = {
    year: { cn: "年柱", en: "Year" },
    month: { cn: "月柱", en: "Month" },
    day: { cn: "日柱", en: "Day" },
    hour: { cn: "时柱", en: "Hour" },
  };

  return (
    <div
      className={cn(
        "bg-surface/30 border border-surface-border rounded-xl p-4",
        className
      )}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-text">四柱排盘</h3>
        {showEnglish && (
          <p className="text-sm text-text-muted">Four Pillars Chart</p>
        )}
      </div>

      {/* Pillars Grid */}
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {positions.map((pos) => {
          const pillar = fourPillars[pos];
          const hidden = hiddenStems?.[pos] || BRANCH_HIDDEN_STEMS[pillar.branch];
          const stemElement = STEM_ELEMENT[pillar.stem];
          const branchElement = BRANCH_ELEMENT[pillar.branch];

          return (
            <div
              key={pos}
              className={cn(
                "flex flex-col items-center",
                pos === "day" && "ring-2 ring-accent/30 rounded-lg p-1"
              )}
            >
              {/* Position Label */}
              <div className="text-sm text-text-muted mb-2 text-center">
                <span>{positionLabels[pos].cn}</span>
                {showEnglish && (
                  <span className="block text-xs opacity-70">
                    {positionLabels[pos].en}
                  </span>
                )}
                {pos === "day" && (
                  <span className="block text-xs text-accent">日主</span>
                )}
              </div>

              {/* Stem (天干) */}
              <PillarCell
                char={pillar.stem}
                element={stemElement}
                english={STEM_NAMES[pillar.stem]}
                type="stem"
                showEnglish={showEnglish}
              />

              {/* Branch (地支) */}
              <div className="mt-2">
                <PillarCell
                  char={pillar.branch}
                  element={branchElement}
                  english={BRANCH_NAMES[pillar.branch]}
                  animal={BRANCH_ANIMALS[pillar.branch]}
                  type="branch"
                  showEnglish={showEnglish}
                />
              </div>

              {/* Hidden Stems (藏干) */}
              {showHidden && (
                <HiddenStemsDisplay hidden={hidden} showEnglish={showEnglish} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-surface-border/50">
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          {(["木", "火", "土", "金", "水"] as WuXing[]).map((el) => (
            <span key={el} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: WU_XING_COLORS[el] }}
              />
              <span style={{ color: WU_XING_COLORS[el] }}>{el}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FourPillarsChart;
