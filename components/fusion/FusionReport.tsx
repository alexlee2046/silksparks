/**
 * Fusion Report Component
 *
 * Complete East-West fusion analysis report display.
 */

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FusionAnalysis, UserTier } from "../../lib/fusion/types";
import type { BaZiChart } from "../../lib/bazi/types";
import { WU_XING_NAMES } from "../../lib/bazi/types";
import { hasFeature } from "../../lib/fusion/tiers";
import { FourPillarsChart } from "../bazi/FourPillarsChart";
import { WuXingWheel } from "../bazi/WuXingWheel";
import { TenGodsGrid } from "../bazi/TenGodsGrid";
import { LiteratureQuoteCard } from "./LiteratureQuoteCard";
import { TierUpgradePrompt } from "./TierUpgradePrompt";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FusionReportProps {
  analysis: FusionAnalysis;
  baziChart: BaZiChart;
  tier: UserTier;
  onUpgrade?: () => void;
  showEnglish?: boolean;
  className?: string;
}

export const FusionReport: React.FC<FusionReportProps> = ({
  analysis,
  baziChart,
  tier,
  onUpgrade,
  showEnglish = false,
  className,
}) => {
  const canShowFullPillars = hasFeature(tier, "fullFourPillars");
  const canShowTenGods = hasFeature(tier, "tenGodsAnalysis");
  const canShowStrength = hasFeature(tier, "dayMasterStrength");
  const canShowPreferences = hasFeature(tier, "elementPreferences");

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Section */}
      <section className="bg-surface/30 border border-surface-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-text mb-4">命理总览</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Eastern Summary */}
          <div>
            <h3 className="text-sm text-accent mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              八字概要
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-text">
                <span className="text-text-muted">日主：</span>
                <span className="font-semibold">
                  {analysis.dayMasterSummary.stem} (
                  {WU_XING_NAMES[analysis.dayMasterSummary.element]})
                </span>
              </p>
              {canShowStrength && (
                <p className="text-text">
                  <span className="text-text-muted">强弱：</span>
                  <span className="font-semibold">
                    {analysis.dayMasterSummary.strength}
                  </span>
                </p>
              )}
              <p className="text-text-muted text-sm leading-relaxed mt-2">
                {analysis.dayMasterSummary.description}
              </p>
            </div>
          </div>

          {/* Western Summary */}
          <div>
            <h3 className="text-sm text-purple-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              星座概要
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-text">
                <span className="text-text-muted">太阳星座：</span>
                <span className="font-semibold">
                  {analysis.westernSummary.sunSign}
                </span>
              </p>
              <p className="text-text">
                <span className="text-text-muted">月亮星座：</span>
                <span className="font-semibold">
                  {analysis.westernSummary.moonSign}
                </span>
              </p>
              <p className="text-text">
                <span className="text-text-muted">主导元素：</span>
                <span className="font-semibold">
                  {analysis.westernSummary.dominantElement}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Element Harmony */}
        <div className="mt-4 pt-4 border-t border-surface-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">东西方元素和谐度</span>
            <span className="text-lg font-bold text-accent">
              {analysis.elementHarmony.score}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${analysis.elementHarmony.score}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">
            {analysis.elementHarmony.description}
          </p>
        </div>
      </section>

      {/* Four Pillars Chart */}
      {canShowFullPillars ? (
        <FourPillarsChart
          fourPillars={baziChart.fourPillars}
          hiddenStems={baziChart.hiddenStems}
          showHidden={canShowTenGods}
          showEnglish={showEnglish}
        />
      ) : (
        <div className="relative">
          <div className="blur-sm pointer-events-none">
            <FourPillarsChart
              fourPillars={baziChart.fourPillars}
              showHidden={false}
              showEnglish={showEnglish}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 rounded-xl">
            <TierUpgradePrompt
              currentTier={tier}
              targetTier="member"
              feature="完整四柱排盘"
              onUpgradeClick={onUpgrade}
              variant="inline"
            />
          </div>
        </div>
      )}

      {/* Wu Xing Distribution */}
      <WuXingWheel
        distribution={baziChart.wuXingDistribution}
        favorableElements={
          canShowPreferences ? baziChart.elementPreferences.favorable : []
        }
        unfavorableElements={
          canShowPreferences ? baziChart.elementPreferences.unfavorable : []
        }
      />

      {/* Ten Gods Analysis */}
      {canShowTenGods ? (
        <TenGodsGrid
          tenGods={baziChart.tenGods}
          showEnglish={showEnglish}
        />
      ) : (
        <TierUpgradePrompt
          currentTier={tier}
          targetTier="member"
          feature="十神分析"
          onUpgradeClick={onUpgrade}
          variant="banner"
        />
      )}

      {/* Fusion Insights */}
      <section className="bg-surface/30 border border-surface-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-text mb-4">融合洞察</h2>

        <div className="space-y-4">
          {analysis.insights.map((insight) => (
            <div
              key={insight.id}
              className={cn(
                "p-4 rounded-lg border",
                insight.type === "harmony" &&
                  "bg-green-500/5 border-green-500/30",
                insight.type === "complement" &&
                  "bg-blue-500/5 border-blue-500/30",
                insight.type === "tension" &&
                  "bg-orange-500/5 border-orange-500/30",
                insight.type === "neutral" &&
                  "bg-surface/50 border-surface-border/50"
              )}
            >
              <h3 className="font-medium text-text mb-2">{insight.title}</h3>
              {showEnglish && (
                <p className="text-xs text-text-muted mb-2">
                  {insight.titleEn}
                </p>
              )}
              <p className="text-sm text-text-muted leading-relaxed">
                {insight.description}
              </p>
              {insight.advice && (
                <p className="text-sm text-accent mt-2">💡 {insight.advice}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Literature Quotes */}
      {analysis.quotes.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-text mb-4">经典引用</h2>
          <div className="space-y-3">
            {analysis.quotes.map((quote) => (
              <LiteratureQuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="bg-surface/30 border border-surface-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-text mb-4">实用建议</h2>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Favorable */}
          <div className="p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
            <h3 className="text-sm font-medium text-green-400 mb-2">
              ✓ 有利方面
            </h3>
            <ul className="space-y-1 text-sm text-text-muted">
              {analysis.recommendations.favorable.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>

          {/* Timing */}
          <div className="p-4 bg-blue-500/5 border border-blue-500/30 rounded-lg">
            <h3 className="text-sm font-medium text-blue-400 mb-2">
              ⏱ 时机建议
            </h3>
            <ul className="space-y-1 text-sm text-text-muted">
              {analysis.recommendations.timing.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>

          {/* Cautions */}
          <div className="p-4 bg-orange-500/5 border border-orange-500/30 rounded-lg">
            <h3 className="text-sm font-medium text-orange-400 mb-2">
              ⚠ 需要注意
            </h3>
            <ul className="space-y-1 text-sm text-text-muted">
              {analysis.recommendations.caution.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Upgrade CTA for free users */}
      {tier === "free" && (
        <TierUpgradePrompt
          currentTier={tier}
          targetTier="member"
          onUpgradeClick={onUpgrade}
          variant="card"
        />
      )}

      {/* Timestamp */}
      <p className="text-xs text-text-muted text-center">
        分析生成时间：{analysis.generatedAt.toLocaleString()}
      </p>
    </div>
  );
};

export default FusionReport;
