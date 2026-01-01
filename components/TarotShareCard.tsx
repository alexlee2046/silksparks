/**
 * TarotShareCard - 塔罗分享卡片组件
 * 生成精美的可分享图片
 */

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import type { TarotCard } from "../services/ai/types";
import toast from "react-hot-toast";

interface TarotShareCardProps {
  /** 抽取的牌 */
  card: TarotCard;
  /** 核心解读 (简短) */
  coreMessage?: string;
  /** 完整解读 */
  interpretation: string;
  /** 日期 */
  date?: Date;
  /** 关闭回调 */
  onClose: () => void;
}

export const TarotShareCard: React.FC<TarotShareCardProps> = ({
  card,
  coreMessage,
  interpretation,
  date = new Date(),
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 格式化日期
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 截取解读摘要 (最多100字符)
  const shortInterpretation =
    coreMessage || interpretation.substring(0, 100) + "...";

  // 生成图片并分享
  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);

    try {
      // 生成 canvas
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2, // 高清
        useCORS: true,
        logging: false,
      });

      // 转换为 Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
          "image/png",
          0.95
        );
      });

      // 检查是否支持 Web Share API
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `tarot-${card.name.toLowerCase().replace(/\s+/g, "-")}.png`, {
          type: "image/png",
        });

        const shareData = {
          title: `My Tarot: ${card.name}`,
          text: shortInterpretation,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success("Shared successfully!");
          return;
        }
      }

      // 降级：下载图片
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tarot-${card.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Image downloaded!");
    } catch (error) {
      console.error("[TarotShareCard] Share error:", error);
      toast.error("Failed to generate share image");
    } finally {
      setIsGenerating(false);
    }
  }, [card, shortInterpretation]);

  // 复制文本
  const handleCopyText = useCallback(async () => {
    const text = `🔮 My Tarot Reading: ${card.name} ${card.isReversed ? "(Reversed)" : ""}\n\n"${shortInterpretation}"\n\n✨ Via Silk & Sparks`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  }, [card, shortInterpretation]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="flex flex-col items-center gap-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 可分享的卡片 */}
          <div
            ref={cardRef}
            className="w-full bg-gradient-to-b from-[#0d0d0d] to-[#141414] rounded-2xl overflow-hidden border border-[#F4C025]/30 shadow-2xl"
          >
            {/* 顶部装饰 */}
            <div className="h-1 bg-gradient-to-r from-transparent via-[#F4C025] to-transparent"></div>

            <div className="p-6">
              {/* 日期和类型 */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[#F4C025]/60 text-xs uppercase tracking-widest">
                  Daily Tarot
                </span>
                <span className="text-text-muted text-xs">{formattedDate}</span>
              </div>

              {/* 卡牌区域 */}
              <div className="flex gap-4 items-start">
                {/* 卡牌图像 */}
                <div className="w-24 h-36 rounded-lg border-2 border-[#F4C025]/50 overflow-hidden flex-shrink-0 relative bg-[#0a0a0a]">
                  <img
                    src={card.image}
                    alt={card.name}
                    className={`w-full h-full object-cover ${card.isReversed ? "rotate-180" : ""}`}
                    crossOrigin="anonymous"
                  />
                  {card.isReversed && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#F4C025] text-black text-[8px] font-bold uppercase rounded">
                      R
                    </div>
                  )}
                </div>

                {/* 卡牌信息 */}
                <div className="flex-1">
                  <h2 className="text-[#F4C025] font-serif font-bold text-xl mb-1">
                    {card.name}
                  </h2>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-3">
                    {card.isReversed ? "Reversed" : "Upright"} •{" "}
                    {card.arcana} Arcana
                  </p>
                  <p className="text-foreground text-sm leading-relaxed">
                    "{shortInterpretation}"
                  </p>
                </div>
              </div>

              {/* 底部品牌 */}
              <div className="mt-6 pt-4 border-t border-surface-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#F4C025]/10 flex items-center justify-center">
                    <span className="text-[#F4C025] text-xs">✦</span>
                  </div>
                  <span className="text-[#F4C025]/80 text-sm font-serif tracking-wide">
                    Silk & Sparks
                  </span>
                </div>
                <span className="text-text-muted text-[10px]">
                  silksparks.com
                </span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-background font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">share</span>
                  Share Image
                </>
              )}
            </button>

            <button
              onClick={handleCopyText}
              className="px-4 py-3 rounded-xl border border-surface-border hover:bg-surface-border/30 text-foreground transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined">content_copy</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-surface-border hover:bg-surface-border/30 text-foreground transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TarotShareCard;
