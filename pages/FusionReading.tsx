/**
 * Fusion Reading Page
 *
 * Displays the East-West fusion analysis combining Chinese BaZi
 * and Western astrology insights.
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { saveArchive } from "../hooks/useArchives";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PATHS } from "../lib/paths";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import { useTempBirthData } from "../hooks/useTempBirthData";
import { AstrologyEngine } from "../services/AstrologyEngine";
import { calculateFourPillars, calculateWuXingDistribution } from "../lib/bazi/calculations";
import { getElementHarmonyScore, ZODIAC_WESTERN_ELEMENT } from "../lib/fusion/mappings";
import { WU_XING_NAMES, STEM_NAMES, type HeavenlyStem, type WuXing } from "../lib/bazi/types";
import type { ZodiacSign } from "../lib/ZodiacUtils";
import { GuestBirthDataForm } from "../components/GuestBirthDataForm";
import { FourPillarsChart } from "../components/bazi/FourPillarsChart";
import { WuXingWheel } from "../components/bazi/WuXingWheel";
// TODO: Re-enable when tier-gating is implemented
// import { TierUpgradePrompt } from "../components/fusion/TierUpgradePrompt";
import { SEO } from "../components/SEO";
import * as m from "../src/paraglide/messages";

// Day Master element mapping
const STEM_ELEMENTS: Record<HeavenlyStem, WuXing> = {
  "甲": "木", "乙": "木",
  "丙": "火", "丁": "火",
  "戊": "土", "己": "土",
  "庚": "金", "辛": "金",
  "壬": "水", "癸": "水",
};

// Get zodiac symbol
const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const PENDING_SAVE_KEY = "fusion_pending_save";

interface FusionArchiveContent {
  version: string;
  birthData: {
    date: string;
    time: string;
    location: { name: string; lat: number; lng: number } | null;
  };
  dayMaster: {
    stem: string;
    stemName: string;
    element: string;
    elementName: string;
  };
  sunSign: string;
  harmonyScore: number;
  planets: Record<string, string>;
  fourPillars: Record<string, { stem: string; branch: string }>;
  wuXingDistribution: Record<string, number>;
  fusionInsights: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
  }>;
}

export const FusionReading: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, isBirthDataComplete } = useUser();
  const { locale } = useLanguage();
  void locale;

  const { tempData, saveTempData, hasTempData } = useTempBirthData();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Effective birth data - prefer logged-in user, fallback to temp
  const effectiveBirthData = useMemo(() => {
    if (session && isBirthDataComplete) {
      return user.birthData;
    }
    if (hasTempData && tempData) {
      return {
        date: tempData.date,
        time: tempData.time,
        location: tempData.location,
      };
    }
    return null;
  }, [session, isBirthDataComplete, user.birthData, tempData, hasTempData]);

  const canShowReading = !!(effectiveBirthData?.date && effectiveBirthData?.time);

  // Calculate Western planets
  const birthDate = effectiveBirthData?.date;
  const birthLocation = effectiveBirthData?.location;
  const birthTime = effectiveBirthData?.time;

  const planets = useMemo(() => {
    if (birthDate) {
      const lat = birthLocation?.lat ?? 0;
      const lng = birthLocation?.lng ?? 0;
      return AstrologyEngine.calculatePlanetaryPositions(birthDate, lat, lng);
    }
    return null;
  }, [birthDate, birthLocation]);

  // Calculate BaZi chart
  const baziChart = useMemo(() => {
    if (birthDate && birthTime) {
      const hoursStr = birthTime.split(":")[0] ?? "0";
      const hours = parseInt(hoursStr, 10) || 0;
      const result = calculateFourPillars({
        year: birthDate.getFullYear(),
        month: birthDate.getMonth() + 1,
        day: birthDate.getDate(),
        hour: hours,
      });
      // Calculate wuXing distribution
      const wuXingDistribution = calculateWuXingDistribution(
        result.fourPillars,
        result.hiddenStems
      );
      return {
        fourPillars: result.fourPillars,
        hiddenStems: result.hiddenStems,
        wuXingDistribution,
      };
    }
    return null;
  }, [birthDate, birthTime]);

  // Get Day Master info
  const dayMasterInfo = useMemo(() => {
    if (!baziChart) return null;
    const stem = baziChart.fourPillars.day.stem as HeavenlyStem;
    const element = STEM_ELEMENTS[stem];
    return {
      stem,
      stemName: STEM_NAMES[stem],
      element,
      elementName: WU_XING_NAMES[element],
    };
  }, [baziChart]);

  // Get Sun sign
  const sunSign = planets?.Sun as ZodiacSign | undefined;

  // Calculate element harmony score
  const harmonyScore = useMemo(() => {
    if (!dayMasterInfo || !sunSign) return 0;
    const westernElement = ZODIAC_WESTERN_ELEMENT[sunSign];
    return getElementHarmonyScore(dayMasterInfo.element, westernElement);
  }, [dayMasterInfo, sunSign]);

  // Generate fusion insights
  const fusionInsights = useMemo(() => {
    if (!dayMasterInfo || !sunSign) return [];

    const insights = [];
    const westernElement = ZODIAC_WESTERN_ELEMENT[sunSign];

    // Core identity insight
    insights.push({
      id: "core-identity",
      title: `${dayMasterInfo.elementName} Day Master meets ${sunSign}`,
      type: harmonyScore >= 75 ? "harmony" : harmonyScore >= 50 ? "complement" : "tension",
      description: getIdentityDescription(dayMasterInfo.elementName, sunSign, harmonyScore),
    });

    // Element dynamic insight
    insights.push({
      id: "element-dynamic",
      title: `${dayMasterInfo.elementName} & ${westernElement} Dynamic`,
      type: "neutral",
      description: getElementDynamicDescription(dayMasterInfo.elementName, westernElement),
    });

    return insights;
  }, [dayMasterInfo, sunSign, harmonyScore]);

  // Build archive content for saving
  const buildArchiveContent = useCallback((): FusionArchiveContent | null => {
    if (!effectiveBirthData || !dayMasterInfo || !sunSign || !planets || !baziChart) {
      return null;
    }
    return {
      version: "1.0",
      birthData: {
        date: effectiveBirthData.date instanceof Date
          ? effectiveBirthData.date.toISOString()
          : String(effectiveBirthData.date),
        time: effectiveBirthData.time ?? "",
        location: effectiveBirthData.location ?? null,
      },
      dayMaster: dayMasterInfo,
      sunSign,
      harmonyScore,
      planets: planets as unknown as Record<string, string>,
      fourPillars: baziChart.fourPillars as unknown as Record<string, { stem: string; branch: string }>,
      wuXingDistribution: baziChart.wuXingDistribution as unknown as Record<string, number>,
      fusionInsights,
    };
  }, [effectiveBirthData, dayMasterInfo, sunSign, harmonyScore, planets, baziChart, fusionInsights]);

  // Handle save to archives
  const handleSave = useCallback(async () => {
    // If no session, store pending save to localStorage
    if (!session) {
      const content = buildArchiveContent();
      if (content) {
        localStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(content));
        toast.success("Reading saved locally. Sign in to save to your archives.", {
          duration: 4000,
          icon: "📝",
        });
      }
      return;
    }

    // Don't save if already saving or saved
    if (saveState === 'saving' || saveState === 'saved') {
      return;
    }

    const content = buildArchiveContent();
    if (!content) {
      toast.error("Unable to save reading. Missing data.");
      return;
    }

    setSaveState('saving');

    const title = `${dayMasterInfo?.elementName} Day Master · ${sunSign} Sun`;
    const summary = `East-West fusion reading with ${harmonyScore}% element harmony`;

    const { error } = await saveArchive({
      userId: session.user.id,
      type: "Five Elements",
      title,
      summary,
      content: content as unknown as Record<string, unknown>,
    });

    if (error) {
      setSaveState('error');
      toast.error("Failed to save reading. Please try again.");
      console.error("[FusionReading] Save error:", error);
    } else {
      setSaveState('saved');
      toast.success("Reading saved to archives!", { icon: "✓" });
      // Clear any pending save
      localStorage.removeItem(PENDING_SAVE_KEY);
    }
  }, [session, saveState, buildArchiveContent, dayMasterInfo, sunSign, harmonyScore]);

  // Auto-save after login if there's a pending save
  useEffect(() => {
    if (!session) return;

    const pendingData = localStorage.getItem(PENDING_SAVE_KEY);
    if (!pendingData) return;

    // Parse and save pending data
    const doAutoSave = async () => {
      try {
        const content = JSON.parse(pendingData) as FusionArchiveContent;
        const title = `${content.dayMaster.elementName} Day Master · ${content.sunSign} Sun`;
        const summary = `East-West fusion reading with ${content.harmonyScore}% element harmony`;

        const { error } = await saveArchive({
          userId: session.user.id,
          type: "Five Elements",
          title,
          summary,
          content: content as unknown as Record<string, unknown>,
        });

        if (!error) {
          localStorage.removeItem(PENDING_SAVE_KEY);
          setSaveState('saved');
          toast.success("Previous reading saved to archives!", { icon: "✓" });
        }
      } catch (e) {
        console.error("[FusionReading] Auto-save error:", e);
      }
    };

    doAutoSave();
  }, [session]);

  // No data - show entry screen
  if (!canShowReading) {
    return (
      <>
        <SEO
          title="Fusion Reading"
          description="Discover your cosmic blueprint through the fusion of Chinese BaZi and Western astrology."
        />
        <div className="flex flex-col items-center justify-center min-h-screen text-foreground p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 text-6xl mb-4"
          >
            <span>☯</span>
            <span className="text-primary">✦</span>
          </motion.div>
          <h2 className="text-2xl font-bold mb-2 text-center">
            {m["fusion.page.title"]()}
          </h2>
          <p className="text-text-muted mb-6 text-center max-w-md">
            {m["fusion.page.noData"]()}
          </p>
          <button
            onClick={() => setShowGuestForm(true)}
            className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary-hover hover:to-amber-400 text-background font-bold py-3 px-8 rounded-full shadow-lg transition-all"
          >
            {m["fusion.page.enterData"]()}
          </button>
        </div>

        <AnimatePresence>
          {showGuestForm && (
            <GuestBirthDataForm
              onComplete={(data) => {
                saveTempData(data);
                setShowGuestForm(false);
              }}
              onCancel={() => setShowGuestForm(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <SEO
        title="Your Fusion Reading"
        description="Your personalized East-West astrology fusion reading."
      />

      {/* Header */}
      <div className="w-full px-4 md:px-8 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate(PATHS.HOME)}
          className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Back
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-surface-border rounded-full">
          <span className="text-sm">☯</span>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Fusion Reading
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Summary Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-surface/60 via-purple-500/5 to-surface/60 border border-surface-border rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 text-6xl opacity-10">☯</div>

          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              {m["fusion.page.summaryTitle"]()}
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              {dayMasterInfo?.elementName} {m["fusion.page.dayMaster"]()} · {sunSign} {m["fusion.page.sunSign"]()}
            </h1>
          </div>

          {/* Visual representation */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-8">
            {/* Day Master */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-4xl font-bold text-amber-400 shadow-lg">
                {dayMasterInfo?.stem}
              </div>
              <p className="mt-2 text-sm text-text-muted">
                {dayMasterInfo?.stemName} ({dayMasterInfo?.elementName})
              </p>
            </motion.div>

            {/* Connection symbol */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl text-purple-400/80"
            >
              ☯
            </motion.div>

            {/* Sun Sign */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 flex items-center justify-center text-4xl text-purple-400 shadow-lg">
                {sunSign && ZODIAC_SYMBOLS[sunSign]}
              </div>
              <p className="mt-2 text-sm text-text-muted">{sunSign}</p>
            </motion.div>
          </div>

          {/* Harmony Score */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">{m["fusion.page.elementHarmony"]()}</span>
              <span className="text-lg font-bold text-primary">{harmonyScore}%</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-surface-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${harmonyScore}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-primary rounded-full"
              />
            </div>
          </div>
        </motion.section>

        {/* Core Fusion Insights */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            {m["fusion.page.coreInsights"]()}
          </h2>

          <div className="space-y-4">
            {fusionInsights.map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className={`p-5 rounded-xl border backdrop-blur-sm ${
                  insight.type === "harmony"
                    ? "bg-green-500/5 border-green-500/30"
                    : insight.type === "complement"
                      ? "bg-blue-500/5 border-blue-500/30"
                      : insight.type === "tension"
                        ? "bg-orange-500/5 border-orange-500/30"
                        : "bg-surface/50 border-surface-border/50"
                }`}
              >
                <h3 className="font-semibold text-foreground mb-2">{insight.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{insight.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Expandable Detail Sections */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {/* Western Chart Details */}
          <ExpandableSection
            title={m["fusion.page.westernDetails"]()}
            icon="public"
            isExpanded={expandedSection === "western"}
            onToggle={() => setExpandedSection(expandedSection === "western" ? null : "western")}
          >
            {planets && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(planets).map(([planet, sign]) => (
                  <div key={planet} className="p-3 bg-black/20 rounded-lg border border-surface-border/50">
                    <span className="text-xs text-text-muted">{planet}</span>
                    <p className="font-semibold text-foreground">{sign as string}</p>
                  </div>
                ))}
              </div>
            )}
          </ExpandableSection>

          {/* Chinese BaZi Details */}
          <ExpandableSection
            title={m["fusion.page.chineseDetails"]()}
            icon="yin_yang"
            isExpanded={expandedSection === "chinese"}
            onToggle={() => setExpandedSection(expandedSection === "chinese" ? null : "chinese")}
          >
            {baziChart && (
              <div className="space-y-6">
                <FourPillarsChart
                  fourPillars={baziChart.fourPillars}
                  hiddenStems={baziChart.hiddenStems}
                  showHidden={false}
                  showEnglish={true}
                />
                <WuXingWheel
                  distribution={baziChart.wuXingDistribution}
                  favorableElements={[]}
                  unfavorableElements={[]}
                />
              </div>
            )}
          </ExpandableSection>
        </motion.section>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
          <button
            onClick={handleSave}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
              saveState === 'saved'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default'
                : saveState === 'error'
                  ? 'bg-surface border border-red-500/50 text-foreground hover:border-red-400'
                  : saveState === 'saving'
                    ? 'bg-surface border border-surface-border text-text-muted cursor-wait'
                    : 'bg-surface border border-surface-border text-foreground hover:border-primary/50'
            }`}
          >
            {saveState === 'saving' ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                Saving...
              </>
            ) : saveState === 'saved' ? (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Saved
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">bookmark</span>
                {m["fusion.page.saveToArchives"]()}
              </>
            )}
          </button>
          <button
            onClick={() => {/* TODO: share */}}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-surface-border rounded-xl text-foreground font-medium hover:border-primary/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            {m["fusion.page.shareReading"]()}
          </button>
        </motion.div>

        {/* Sign-in prompt for guests */}
        {!session && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-xl text-center"
          >
            <p className="text-sm text-foreground mb-2">
              {m["birthChart.guest.savePrompt"]()}
            </p>
            <p className="text-xs text-text-muted">
              {m["birthChart.guest.localStorageNote"]()}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Expandable section component
interface ExpandableSectionProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="bg-surface/30 border border-surface-border rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-5 py-4 flex items-center justify-between text-foreground hover:bg-surface-border/20 transition-colors"
    >
      <span className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <span className="font-medium">{title}</span>
      </span>
      <span className={`material-symbols-outlined transition-transform ${isExpanded ? "rotate-180" : ""}`}>
        expand_more
      </span>
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// Helper functions for generating descriptions
function getIdentityDescription(element: string, sunSign: ZodiacSign, _harmony: number): string {
  const descriptions: Record<string, Record<string, string>> = {
    Wood: {
      Aries: "The pioneering Aries fire feeds your Wood nature, creating unstoppable growth momentum. You lead with vision and adapt quickly.",
      Taurus: "Your expansive Wood energy meets Taurus's grounded patience. Together, they create steady, lasting growth.",
      Gemini: "Wood's flexibility harmonizes with Gemini's curiosity. Your mind branches into endless possibilities.",
      Cancer: "Water feeds Wood — Cancer's emotional depth nourishes your growth. You build from intuition.",
      Leo: "Your Wood fuels Leo's fire. Creative expression becomes your natural path to influence.",
      Virgo: "Wood seeks to grow; Virgo refines that growth. Together, purposeful development emerges.",
      Libra: "Wood's expansion meets Libra's balance. You grow while maintaining harmony with others.",
      Scorpio: "Deep waters nourish tall trees. Scorpio's intensity powers your transformation.",
      Sagittarius: "Fire and Wood together blaze new trails. Your optimism and growth drive adventure.",
      Capricorn: "Earth grounds your growth with ambition. You build empires from seeds of vision.",
      Aquarius: "Air carries your ideas far. Innovation and growth merge into future-building.",
      Pisces: "Water dreams nourish Wood's growth. You manifest imagination into reality.",
    },
    Fire: {
      Aries: "Double fire creates pure passion. You're a force of nature, unstoppable when ignited.",
      Taurus: "Your fire meets Earth's patience. Sustainable passion that builds lasting warmth.",
      Gemini: "Fire and Air create brilliant sparks. Your enthusiasm spreads through communication.",
      Cancer: "Steam rises when fire meets water. Emotional intensity fuels your passions.",
      Leo: "Fire recognizes fire. Your self-expression blazes with authentic power.",
      Virgo: "Fire refined by Earth. Your passion finds practical, perfected expression.",
      Libra: "Fire seeks balance through Air. Your warmth attracts and harmonizes.",
      Scorpio: "Volcanic power — fire meeting deep waters. Transformation is your destiny.",
      Sagittarius: "Fire feeds fire. Your spirit burns bright with philosophical adventure.",
      Capricorn: "Fire within stone. Your ambition burns steady and achieves heights.",
      Aquarius: "Fire spreads through Air. Your passion ignites revolutionary ideas.",
      Pisces: "Fire in the depths. Mystical passion emerges from emotional waters.",
    },
    Earth: {
      Aries: "Fire on earth — passion grounded. You initiate with staying power.",
      Taurus: "Pure stability. Double earth means unshakeable foundations.",
      Gemini: "Earth gives Air somewhere to land. Your ideas become real.",
      Cancer: "Earth holds Water. Emotional security becomes your gift to give.",
      Leo: "Fire warms the earth. Your presence creates fertile ground for others.",
      Virgo: "Earth refines earth. Perfection through practical dedication.",
      Libra: "Earth balances with Air. Beauty emerges from solid foundations.",
      Scorpio: "Earth holds deep waters. Your stability contains transformative power.",
      Sagittarius: "Fire explores earth. Adventure grounded in wisdom.",
      Capricorn: "Mountain upon mountain. Your ambition builds lasting legacy.",
      Aquarius: "Earth meets progressive Air. You ground innovation into reality.",
      Pisces: "Earth shapes the riverbed. Your structure gives flow its direction.",
    },
    Metal: {
      Aries: "Sharp metal meets fire. Your precision cuts through with courage.",
      Taurus: "Metal refined in earth. Value and quality define your path.",
      Gemini: "Sharp wit, clear communication. Your mind cuts to truth.",
      Cancer: "Metal in emotional waters. Boundaries protect deep feelings.",
      Leo: "Gold in the fire. Your value shines through confident expression.",
      Virgo: "Metal's precision meets Virgo's. Flawless refinement is your nature.",
      Libra: "Balanced scales, weighted true. Justice and fairness guide you.",
      Scorpio: "Sword in deep water. Your insight cuts through illusion.",
      Sagittarius: "The arrow's point — metal guides fire to its target.",
      Capricorn: "Metal in the mountain. Valuable achievements built to last.",
      Aquarius: "Metal conducts Air's ideas. Innovation meets practical structure.",
      Pisces: "Precious metal in the depths. Hidden value awaiting discovery.",
    },
    Water: {
      Aries: "Water quenches fire, then steam rises. You temper passion with wisdom.",
      Taurus: "Water nourishes earth. Your flow creates abundant growth.",
      Gemini: "Water evaporates into Air. Your wisdom spreads through words.",
      Cancer: "Ocean meeting moon. Emotional depth is your greatest strength.",
      Leo: "Steam power — water and fire. Your depth fuels visible warmth.",
      Virgo: "Water filtered through earth. Pure wisdom, practically applied.",
      Libra: "Water reflects Air. Your balance comes from emotional intelligence.",
      Scorpio: "Double water — ocean depths. Profound transformation awaits.",
      Sagittarius: "Water meeting fire. Adventure guided by intuition.",
      Capricorn: "Water carves mountains. Patient persistence achieves all.",
      Aquarius: "Water rises as air. Your wisdom elevates collective consciousness.",
      Pisces: "Water in water. Pure intuition, boundless depth.",
    },
  };

  return descriptions[element]?.[sunSign] ||
    `Your ${element} essence combines with ${sunSign}'s energy in a unique way.`;
}

function getElementDynamicDescription(eastern: string, western: string): string {
  if (eastern === "Fire" && western === "Fire") {
    return "Pure elemental resonance. Both systems recognize your passionate, transformative nature.";
  }
  if (eastern === "Earth" && western === "Earth") {
    return "Grounded stability across traditions. You're the foundation others build upon.";
  }
  if (eastern === "Water" && western === "Water") {
    return "Deep emotional intelligence confirmed by both Eastern and Western wisdom.";
  }
  if ((eastern === "Wood" || eastern === "Metal") && western === "Air") {
    return `${eastern}'s structure gives form to Air's ideas. You bridge thought and reality.`;
  }
  if (eastern === "Wood" && western === "Fire") {
    return "Wood feeds Fire — your potential fuels others' passions and your own creative expression.";
  }
  if (eastern === "Metal" && western === "Earth") {
    return "Precious resources emerge from earth. Your value is both hidden and revealed through effort.";
  }
  return `The interplay of ${eastern} and ${western} creates a dynamic balance unique to your chart.`;
}

export default FusionReading;
