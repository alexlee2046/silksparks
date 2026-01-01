/**
 * CardSelector - 塔罗牌选择组件
 * 用户凭直觉从展示的牌中选择
 */

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TarotCardBack } from "./TarotCardBack";

export interface CardSelectorProps {
  /** 展示的牌索引数组 */
  displayCards: number[];
  /** 需要选择的牌数 (1 = 单张, 3 = 三张牌阵) */
  selectCount: number;
  /** 选择完成回调 */
  onComplete: (selectedIndices: number[]) => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 选择过程中的位置提示 (用于三张牌阵) */
  positionLabels?: string[];
  /** 是否正在洗牌 */
  isShuffling?: boolean;
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  displayCards,
  selectCount,
  onComplete,
  onCancel,
  positionLabels = [],
  isShuffling = false,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 当前需要选择的位置标签
  const currentPositionLabel = positionLabels[selectedIndices.length] || "";
  const remainingCount = selectCount - selectedIndices.length;

  const handleCardClick = useCallback(
    (cardIndex: number) => {
      if (isShuffling) return;
      if (selectedIndices.includes(cardIndex)) return;
      if (selectedIndices.length >= selectCount) return;

      const newSelected = [...selectedIndices, cardIndex];
      setSelectedIndices(newSelected);

      // 选择完成
      if (newSelected.length === selectCount) {
        // 延迟触发完成，让用户看到选择动画
        setTimeout(() => {
          onComplete(newSelected);
        }, 500);
      }
    },
    [selectedIndices, selectCount, onComplete, isShuffling]
  );

  // 计算扇形排列的位置
  const getCardTransform = (index: number, total: number) => {
    const centerIndex = (total - 1) / 2;
    const offset = index - centerIndex;
    const rotation = offset * 8; // 每张牌旋转8度
    const translateX = offset * 45; // 水平偏移
    const translateY = Math.abs(offset) * 15; // 形成弧形

    return {
      rotate: rotation,
      x: translateX,
      y: translateY,
      scale: hoveredIndex === index ? 1.1 : 1,
      zIndex: hoveredIndex === index ? 100 : total - Math.abs(offset),
    };
  };

  // 洗牌动画
  if (isShuffling) {
    return (
      <div className="relative w-full h-[450px] flex flex-col items-center justify-center px-4">
        <div className="relative w-full max-w-64 aspect-[256/380] mx-auto">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 w-full h-full"
              initial={{ x: 0, y: 0, rotate: 0 }}
              animate={{
                x: [0, (i - 2) * 50, 0],
                y: [0, Math.abs(i - 2) * -15, 0],
                rotate: [0, (i - 2) * 12, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                delay: i * 0.08,
              }}
            >
              <TarotCardBack showPattern={false} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="absolute bottom-0 w-full text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[#F4C025] font-serif font-bold tracking-[0.2em] text-sm animate-pulse">
            SHUFFLING THE DECK...
          </p>
          <p className="text-text-muted text-[10px] uppercase tracking-widest">
            Focus your intention
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center gap-8">
      {/* 选择提示 */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {selectCount > 1 && currentPositionLabel && (
          <p className="text-[#F4C025] font-serif font-bold text-lg tracking-wide">
            Choose for: {currentPositionLabel}
          </p>
        )}
        <p className="text-text-muted text-sm">
          {remainingCount > 0 ? (
            <>
              Select{" "}
              <span className="text-[#F4C025] font-bold">{remainingCount}</span>{" "}
              card{remainingCount > 1 ? "s" : ""} that calls to you
            </>
          ) : (
            <span className="text-[#F4C025]">Selection complete!</span>
          )}
        </p>
      </motion.div>

      {/* 已选择的牌指示器 */}
      {selectCount > 1 && (
        <div className="flex gap-3">
          {Array.from({ length: selectCount }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-colors ${
                i < selectedIndices.length
                  ? "bg-[#F4C025] border-[#F4C025]"
                  : "bg-transparent border-[#F4C025]/30"
              }`}
              animate={{
                scale: i === selectedIndices.length ? [1, 1.3, 1] : 1,
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          ))}
        </div>
      )}

      {/* 扇形牌组 */}
      <div className="relative h-[420px] w-full max-w-[600px] flex items-center justify-center">
        <AnimatePresence>
          {displayCards.map((cardIndex, displayIndex) => {
            const isSelected = selectedIndices.includes(cardIndex);
            const transform = getCardTransform(
              displayIndex,
              displayCards.length
            );
            const selectionOrder = selectedIndices.indexOf(cardIndex);

            return (
              <motion.div
                key={cardIndex}
                className={`absolute w-48 h-[300px] cursor-pointer transition-all duration-300 ${
                  isSelected ? "pointer-events-none" : ""
                }`}
                initial={{ opacity: 0, y: 100, rotate: 0 }}
                animate={{
                  opacity: isSelected ? 0.3 : 1,
                  y: isSelected ? -50 : transform.y,
                  x: transform.x,
                  rotate: transform.rotate,
                  scale: isSelected ? 0.8 : transform.scale,
                  zIndex: isSelected ? -1 : transform.zIndex,
                  filter: isSelected ? "grayscale(0.5)" : "none",
                }}
                exit={{ opacity: 0, y: -100 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                onClick={() => handleCardClick(cardIndex)}
                onMouseEnter={() => setHoveredIndex(cardIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={
                  !isSelected
                    ? {
                        y: transform.y - 30,
                        transition: { duration: 0.2 },
                      }
                    : {}
                }
              >
                {/* 选中标记 */}
                {isSelected && (
                  <motion.div
                    className="absolute -top-4 -right-2 w-8 h-8 bg-[#F4C025] rounded-full flex items-center justify-center z-50 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <span className="text-black font-bold text-sm">
                      {selectionOrder + 1}
                    </span>
                  </motion.div>
                )}

                {/* 悬停光效 */}
                {hoveredIndex === cardIndex && !isSelected && (
                  <motion.div
                    className="absolute -inset-2 bg-[#F4C025]/20 rounded-2xl blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                <TarotCardBack showPattern={!isSelected} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 取消按钮 */}
      {onCancel && (
        <motion.button
          className="mt-4 px-6 py-2 text-text-muted hover:text-foreground text-sm transition-colors flex items-center gap-2"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="material-symbols-outlined text-sm">close</span>
          Cancel
        </motion.button>
      )}
    </div>
  );
};

export default CardSelector;
