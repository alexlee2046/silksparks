/**
 * TarotInterpretation - 塔罗牌解读内容分区组件
 * 将解读内容按层次分区展示，提升阅读体验
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LuckyElements } from "../../services/ai/types";

interface TarotInterpretationProps {
  /** 完整解读文本 */
  interpretation: string;
  /** 核心信息（一句话总结，可选由 AI 生成） */
  coreMessage?: string;
  /** 行动建议 */
  actionAdvice?: string;
  /** 幸运元素 */
  luckyElements?: LuckyElements;
  /** 是否为三张牌阵 */
  isSpread?: boolean;
}

// 从解读文本中提取结构化内容
function parseInterpretation(text: string): {
  coreMessage: string;
  detailedReading: string;
  actionAdvice: string;
} {
  // 尝试从文本中识别关键部分
  const lines = text.split("\n").filter((line) => line.trim());

  // 默认值
  let coreMessage = "";
  const detailedReading = text;
  let actionAdvice = "";

  // 尝试提取核心信息（通常是第一句较短的句子）
  const firstSentence = text.split(/[.!?]/)[0]?.trim() || "";
  if (firstSentence.length < 120 && firstSentence.length > 10) {
    coreMessage = firstSentence + ".";
  }

  // 尝试从文本中查找行动建议
  const actionPatterns = [
    /(?:action|advice|recommendation|suggestion|step)[:\s]*(.{30,200})/i,
    /(?:you should|consider|try to|focus on)[:\s]*(.{30,150})/i,
    /(?:今日建议|行动指南|建议你)[：:]\s*(.{20,100})/,
  ];

  for (const pattern of actionPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      actionAdvice = match[1].trim();
      break;
    }
  }

  // 如果没有找到行动建议，取最后一句
  if (!actionAdvice && lines.length > 1) {
    const lastLine = lines[lines.length - 1] ?? "";
    if (lastLine.length < 200 && lastLine.length > 20) {
      actionAdvice = lastLine;
    }
  }

  return { coreMessage, detailedReading, actionAdvice };
}

// 幸运元素图标映射
const LUCKY_ICONS: Record<string, string> = {
  color: "palette",
  number: "tag",
  direction: "explore",
  element: "spa",
  day: "calendar_today",
  time: "schedule",
};

export const TarotInterpretation: React.FC<TarotInterpretationProps> = ({
  interpretation,
  coreMessage: propCoreMessage,
  actionAdvice: propActionAdvice,
  luckyElements,
  isSpread = false,
}) => {
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  // 解析解读内容
  const parsed = useMemo(
    () => parseInterpretation(interpretation),
    [interpretation]
  );

  const coreMessage = propCoreMessage || parsed.coreMessage;
  const actionAdvice = propActionAdvice || parsed.actionAdvice;
  const detailedReading = parsed.detailedReading;

  // 详细解读是否需要折叠
  const shouldCollapse = detailedReading.length > 300;

  return (
    <div className="space-y-6">
      {/* 核心信息 - 大字突出显示 */}
      {coreMessage && (
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F4C025] to-[#F4C025]/20 rounded-full" />
          <p className="text-xl md:text-2xl font-serif text-foreground leading-relaxed pl-4">
            "{coreMessage}"
          </p>
        </motion.div>
      )}

      {/* 详细解读 - 可折叠 */}
      <motion.div
        className="bg-surface/30 border border-surface-border rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => setIsDetailExpanded(!isDetailExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#F4C025]">
              menu_book
            </span>
            <span className="text-foreground font-medium">
              {isSpread ? "Full Narrative" : "Detailed Reading"}
            </span>
          </div>
          <motion.span
            className="material-symbols-outlined text-text-muted"
            animate={{ rotate: isDetailExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            expand_more
          </motion.span>
        </button>

        <AnimatePresence>
          {(isDetailExpanded || !shouldCollapse) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2">
                <p className="text-text-muted leading-relaxed whitespace-pre-line">
                  {detailedReading}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 预览文本（折叠时显示） */}
        {shouldCollapse && !isDetailExpanded && (
          <div className="px-6 pb-4">
            <p className="text-text-muted leading-relaxed line-clamp-3">
              {detailedReading.substring(0, 200)}...
            </p>
            <button
              onClick={() => setIsDetailExpanded(true)}
              className="mt-2 text-[#F4C025] text-sm hover:underline flex items-center gap-1"
            >
              Read more
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        )}
      </motion.div>

      {/* 行动建议卡片 */}
      {actionAdvice && (
        <motion.div
          className="relative bg-gradient-to-br from-[#F4C025]/10 to-transparent border border-[#F4C025]/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <span className="material-symbols-outlined text-6xl text-[#F4C025]">
              lightbulb
            </span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F4C025]/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#F4C025]">
                tips_and_updates
              </span>
            </div>
            <div>
              <h4 className="text-[#F4C025] font-bold text-sm uppercase tracking-wider mb-2">
                Action Guidance
              </h4>
              <p className="text-foreground leading-relaxed">{actionAdvice}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 幸运元素 */}
      {luckyElements && Object.keys(luckyElements).length > 0 && (
        <motion.div
          className="border border-surface-border rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h4 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F4C025] text-lg">
              auto_awesome
            </span>
            Lucky Elements
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(luckyElements).map(([key, value], idx) => {
              if (!value) return null;
              const icon = LUCKY_ICONS[key] || "star";
              const label = key.charAt(0).toUpperCase() + key.slice(1);

              return (
                <motion.div
                  key={key}
                  className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#F4C025]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#F4C025] text-sm">
                      {icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-foreground font-medium">{value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TarotInterpretation;
