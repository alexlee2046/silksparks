/**
 * TarotLoadingOverlay - AI 解读加载状态组件
 * 分阶段显示加载文案，减少用户焦虑感
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard } from "../../services/ai/types";

// 分阶段加载文案配置
const LOADING_PHASES = [
  {
    duration: 2000, // 0-2秒
    messages: [
      "Gazing into your card...",
      "The stars begin to align...",
      "Sensing the cosmic energy...",
    ],
    icon: "visibility",
  },
  {
    duration: 3000, // 2-5秒
    messages: [
      "Interpreting the symbols...",
      "Reading the cosmic message...",
      "Channeling ancient wisdom...",
    ],
    icon: "auto_awesome",
  },
  {
    duration: 5000, // 5-10秒
    messages: [
      "A profound reading emerges...",
      "The universe speaks deeply...",
      "Weaving your destiny's thread...",
    ],
    icon: "psychology",
  },
  {
    duration: Infinity, // 10秒+
    messages: [
      "This is a powerful card combination...",
      "Deep mysteries are being revealed...",
      "The cosmos has much to say...",
    ],
    icon: "all_inclusive",
  },
];

// 卡牌关键词映射（简化版，用于预览）
const CARD_KEYWORDS: Record<string, string[]> = {
  // Major Arcana
  "The Fool": ["New Beginnings", "Spontaneity", "Leap of Faith"],
  "The Magician": ["Manifestation", "Power", "Skill"],
  "The High Priestess": ["Intuition", "Mystery", "Inner Voice"],
  "The Empress": ["Abundance", "Nurturing", "Creativity"],
  "The Emperor": ["Authority", "Structure", "Leadership"],
  "The Hierophant": ["Tradition", "Guidance", "Conformity"],
  "The Lovers": ["Love", "Choices", "Union"],
  "The Chariot": ["Willpower", "Victory", "Determination"],
  Strength: ["Courage", "Inner Strength", "Patience"],
  "The Hermit": ["Introspection", "Solitude", "Wisdom"],
  "Wheel of Fortune": ["Cycles", "Destiny", "Change"],
  Justice: ["Fairness", "Truth", "Balance"],
  "The Hanged Man": ["Surrender", "New Perspective", "Pause"],
  Death: ["Transformation", "Endings", "Rebirth"],
  Temperance: ["Balance", "Moderation", "Patience"],
  "The Devil": ["Shadow Self", "Attachment", "Temptation"],
  "The Tower": ["Upheaval", "Revelation", "Awakening"],
  "The Star": ["Hope", "Inspiration", "Renewal"],
  "The Moon": ["Illusion", "Intuition", "Dreams"],
  "The Sun": ["Joy", "Success", "Vitality"],
  Judgement: ["Rebirth", "Reflection", "Reckoning"],
  "The World": ["Completion", "Achievement", "Fulfillment"],
};

interface TarotLoadingOverlayProps {
  /** 是否显示加载状态 */
  isLoading: boolean;
  /** 已抽取的卡牌（用于关键词预览） */
  cards?: TarotCard[];
  /** 自定义开始时间（用于精确计时） */
  startTime?: number;
}

export const TarotLoadingOverlay: React.FC<TarotLoadingOverlayProps> = ({
  isLoading,
  cards = [],
  startTime,
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 计算当前阶段
  useEffect(() => {
    if (!isLoading) {
      setCurrentPhase(0);
      setMessageIndex(0);
      setElapsedTime(0);
      return;
    }

    const start = startTime || Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setElapsedTime(elapsed);

      // 确定当前阶段
      let totalDuration = 0;
      for (let i = 0; i < LOADING_PHASES.length; i++) {
        const phaseItem = LOADING_PHASES[i];
        if (!phaseItem) continue;
        totalDuration += phaseItem.duration;
        if (elapsed < totalDuration || i === LOADING_PHASES.length - 1) {
          setCurrentPhase(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isLoading, startTime]);

  // 切换消息
  useEffect(() => {
    if (!isLoading) return;

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => {
        const phaseData = LOADING_PHASES[currentPhase] ?? LOADING_PHASES[0]!;
        return (prev + 1) % phaseData.messages.length;
      });
    }, 2500);

    return () => clearInterval(messageTimer);
  }, [isLoading, currentPhase]);

  // 获取卡牌关键词
  const cardKeywords = useMemo(() => {
    if (cards.length === 0) return [];
    return cards.flatMap((card) => {
      const keywords = CARD_KEYWORDS[card.name] || [];
      return card.isReversed
        ? keywords.map((k) => `${k} (Reversed)`)
        : keywords;
    });
  }, [cards]);

  // LOADING_PHASES[0] always exists (array is non-empty const)
  const phase = LOADING_PHASES[currentPhase] ?? LOADING_PHASES[0]!;
  const currentMessage = phase.messages[messageIndex] ?? phase.messages[0];

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center gap-6 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 主要加载动画 */}
        <div className="relative">
          {/* 外圈脉冲 */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#F4C025]/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* 图标容器 */}
          <motion.div
            className="w-20 h-20 rounded-full bg-[#F4C025]/10 border border-[#F4C025]/40 flex items-center justify-center"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.span
              key={phase.icon}
              className="material-symbols-outlined text-[#F4C025] text-3xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {phase.icon}
            </motion.span>
          </motion.div>
        </div>

        {/* 分阶段文案 */}
        <div className="text-center space-y-2 min-h-[60px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              className="text-[#F4C025] font-serif text-lg tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentMessage}
            </motion.p>
          </AnimatePresence>
          <p className="text-text-muted text-xs">
            {elapsedTime < 5000
              ? "Preparing your reading..."
              : "Almost there..."}
          </p>
        </div>

        {/* 卡牌关键词预览 */}
        {cardKeywords.length > 0 && elapsedTime > 2000 && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="w-full text-center text-text-muted text-[10px] uppercase tracking-widest mb-1">
              Card Keywords
            </p>
            {cardKeywords.slice(0, 6).map((keyword, idx) => (
              <motion.span
                key={keyword}
                className="px-3 py-1 rounded-full bg-[#F4C025]/10 border border-[#F4C025]/20 text-[#F4C025]/80 text-xs"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {keyword}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* 进度指示器（微妙的） */}
        <div className="flex gap-1.5 mt-2">
          {LOADING_PHASES.slice(0, -1).map((_, idx) => (
            <motion.div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                idx <= currentPhase
                  ? "bg-[#F4C025]"
                  : "bg-[#F4C025]/20"
              }`}
              animate={
                idx === currentPhase
                  ? { scale: [1, 1.3, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1 }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TarotLoadingOverlay;
