/**
 * Tier Upgrade Prompt Component
 *
 * Displays locked features and prompts users to upgrade.
 */

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserTier } from "../../lib/fusion/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TierUpgradePromptProps {
  currentTier: UserTier;
  targetTier?: UserTier;
  feature?: string;
  onUpgradeClick?: () => void;
  variant?: "banner" | "card" | "inline";
  className?: string;
}

const TIER_BENEFITS: Record<UserTier, string[]> = {
  free: [],
  member: [
    "完整四柱排盘图",
    "十神分析 + 藏干",
    "详细日主旺衰",
    "喜用神 + 忌神",
    "3条经典文献引用",
    "融合解读 + 建议",
    "PDF下载",
  ],
  premium: [
    "会员所有功能",
    "大运流年分析",
    "10+条文献引用",
    "双人合盘",
    "专属客服支持",
  ],
};

const TIER_LABELS: Record<UserTier, string> = {
  free: "免费版",
  member: "会员版",
  premium: "高级版",
};

export const TierUpgradePrompt: React.FC<TierUpgradePromptProps> = ({
  currentTier,
  targetTier = "member",
  feature,
  onUpgradeClick,
  variant = "card",
  className,
}) => {
  const benefits = TIER_BENEFITS[targetTier];

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-accent/80",
          className
        )}
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>
          {feature || "此功能"}需要
          <button
            onClick={onUpgradeClick}
            className="text-accent underline hover:text-accent/80 mx-1"
          >
            升级到{TIER_LABELS[targetTier]}
          </button>
          解锁
        </span>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-accent/10 to-transparent",
          "border-l-4 border-accent",
          "p-4 rounded-r-lg",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text">
              {feature ? (
                <>
                  <span className="font-medium">{feature}</span> 是
                  {TIER_LABELS[targetTier]}专属功能
                </>
              ) : (
                <>解锁更多功能，获取完整命理分析</>
              )}
            </p>
            <p className="text-xs text-text-muted mt-1">
              当前：{TIER_LABELS[currentTier]} →{" "}
              <span className="text-accent">{TIER_LABELS[targetTier]}</span>
            </p>
          </div>
          <button
            onClick={onUpgradeClick}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              "bg-accent text-background",
              "hover:bg-accent/90 transition-colors",
              "flex-shrink-0"
            )}
          >
            立即升级
          </button>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div
      className={cn(
        "bg-surface/30 border border-accent/30 rounded-xl p-6",
        className
      )}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
          <svg
            className="w-6 h-6 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text">
          升级到{TIER_LABELS[targetTier]}
        </h3>
        <p className="text-sm text-text-muted mt-1">
          {feature ? `解锁「${feature}」及更多专属功能` : "获取完整命理分析体验"}
        </p>
      </div>

      {/* Benefits List */}
      <ul className="space-y-2 mb-5">
        {benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <svg
              className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-text">{benefit}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onUpgradeClick}
        className={cn(
          "w-full py-3 rounded-lg font-medium",
          "bg-accent text-background",
          "hover:bg-accent/90 transition-colors"
        )}
      >
        立即升级
      </button>

      <p className="text-xs text-text-muted text-center mt-3">
        随时可取消，无风险试用
      </p>
    </div>
  );
};

export default TierUpgradePrompt;
