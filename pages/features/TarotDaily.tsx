import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import AIService from "../../services/ai";
import { RateLimitError } from "../../services/ai/SupabaseAIProvider";
import type { TarotCard as TarotCardType } from "../../services/ai/types";
import toast from "react-hot-toast";
import { useUser } from "../../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  RecommendationEngine,
  Product,
} from "../../services/RecommendationEngine";
import { getCardNumberDisplay, GOLD_FOIL_FILTER } from "./tarotUtils";
import { CardSelector } from "./CardSelector";
import { TarotCardBack } from "./TarotCardBack";
import { TarotLoadingOverlay } from "./TarotLoadingOverlay";
import { TarotInterpretation } from "./TarotInterpretation";
import {
  initDailyTarot,
  selectDailyCard,
  type DailyTarotResult,
} from "../../services/TarotService";
import type { LuckyElements } from "../../services/ai/types";
import { TarotShareCard } from "../../components/TarotShareCard";

interface DrawnTarotCard extends TarotCardType {
  keywords?: string[];
}

type ReadingState = "idle" | "shuffling" | "selecting" | "drawing" | "revealed";

export const TarotDaily: React.FC = () => {
  const navigate = useNavigate();
  const { addArchive, session } = useUser();
  const userId = session?.user?.id ?? null;
  const isLoggedIn = !!session?.user;

  // 状态管理
  const [readingState, setReadingState] = useState<ReadingState>("idle");
  const [card, setCard] = useState<DrawnTarotCard | null>(null);
  const [interpretation, setInterpretation] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [tarotSession, setTarotSession] = useState<DailyTarotResult | null>(
    null
  );
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiLoadingStartTime, setAiLoadingStartTime] = useState<number | null>(null);
  const [coreMessage, setCoreMessage] = useState<string>("");
  const [actionAdvice, setActionAdvice] = useState<string>("");
  const [luckyElements, setLuckyElements] = useState<LuckyElements | undefined>(undefined);
  const [showShareCard, setShowShareCard] = useState(false);

  // 初始化每日塔罗会话（基于种子，同一天结果一致）
  const initSession = useCallback(() => {
    const session = initDailyTarot(userId);
    setTarotSession(session);
    return session;
  }, [userId]);

  // 开始抽牌流程
  const handleStartReading = useCallback(() => {
    setReadingState("shuffling");

    // 洗牌动画后进入选牌阶段
    setTimeout(() => {
      const session = initSession();
      setTarotSession(session);
      setReadingState("selecting");
    }, 2000);
  }, [initSession]);

  // 用户选择卡牌后的处理
  const handleCardSelect = useCallback(
    async (selectedIndices: number[]) => {
      if (!tarotSession || selectedIndices.length === 0) return;

      setReadingState("drawing");

      // 翻牌动画
      setTimeout(async () => {
        const selectedIndex = selectedIndices[0] ?? 0;
        const drawnCard = selectDailyCard(tarotSession.seed, selectedIndex);

        if (!drawnCard) {
          toast.error("Failed to draw card");
          setReadingState("idle");
          return;
        }

        // 获取关键词
        const cardWithKeywords: DrawnTarotCard = {
          ...drawnCard,
          keywords: [],
        };
        setCard(cardWithKeywords);
        setReadingState("revealed");

        // 开始 AI 加载
        setIsAILoading(true);
        setAiLoadingStartTime(Date.now());

        // 调用 AI 生成解读
        try {
          const response = await AIService.generateTarotReading({
            cards: [cardWithKeywords],
            question: "General daily advice",
            spreadType: "single",
          });
          const interpret = response.interpretation;
          setInterpretation(interpret);
          setCoreMessage(response.coreMessage || "");
          setActionAdvice(response.actionAdvice || "");
          setLuckyElements(response.luckyElements);
          setIsAILoading(false);

          const recs = await RecommendationEngine.getRecommendations(interpret);
          setRecommendations(recs);

          if (response.meta?.isFallback) {
            toast("Using backup AI for reading", { icon: "⚠️", duration: 3000 });
          }

          addArchive({
            id: `tarot_${Date.now()}`,
            type: "Tarot",
            date: new Date(),
            title: `Daily Draw: ${drawnCard.name}`,
            summary: interpret.substring(0, 100) + "...",
            content: interpret,
            image: drawnCard.image,
          });
        } catch (e) {
          console.error("[TarotDaily] Tarot AI error:", e);
          setIsAILoading(false);
          if (e instanceof RateLimitError) {
            // 显示登录引导而不是 toast
            setShowLoginPrompt(true);
            setAiError("rate_limit");
            setInterpretation("");
          } else {
            // 其他 AI 错误，显示 fallback 消息和登录引导
            const errorMsg = e instanceof Error ? e.message : "AI service unavailable";
            setAiError(errorMsg);
            if (!isLoggedIn) {
              setShowLoginPrompt(true);
              setInterpretation("");
            } else {
              setInterpretation(
                "The stars are cloudy... but this card suggests hidden potential."
              );
            }
          }
        }
      }, 1500);
    },
    [tarotSession, addArchive]
  );

  // 重置阅读
  const resetReading = useCallback(() => {
    setReadingState("idle");
    setCard(null);
    setInterpretation("");
    setRecommendations([]);
    setTarotSession(null);
    setShowLoginPrompt(false);
    setAiError(null);
    setIsAILoading(false);
    setAiLoadingStartTime(null);
    setCoreMessage("");
    setActionAdvice("");
    setLuckyElements(undefined);
  }, []);

  // 取消选牌
  const handleCancelSelect = useCallback(() => {
    setReadingState("idle");
    setTarotSession(null);
  }, []);

  return (
    <div className="flex-1 relative z-10 flex flex-col items-center py-8 px-4 md:px-8 bg-background min-h-screen">
      <div className="w-full max-w-[1100px] flex flex-col gap-8 md:gap-12">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 relative z-20">
          <div className="w-full flex justify-between items-center mb-4">
            <button
              onClick={() => navigate(PATHS.HOME)}
              className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>{" "}
              Back
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-primary/80 border border-primary/20 px-3 py-1 rounded-full bg-primary/5">
              <span className="material-symbols-outlined !text-[14px]">
                auto_awesome
              </span>
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase">
                Daily Guidance
              </h4>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-light text-foreground tracking-tight">
              Your Energy{" "}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-amber-600">
                Revealed
              </span>
            </h1>
            <p className="text-text-muted max-w-md mx-auto text-sm font-light">
              {readingState === "selecting"
                ? "Trust your intuition. Choose the card that calls to you."
                : "Focus your intention. What message does the Universe have for you today?"}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
          <AnimatePresence mode="wait">
            {/* 空闲状态 - 显示开始按钮 */}
            {readingState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center gap-8"
              >
                <div
                  onClick={handleStartReading}
                  className="cursor-pointer group relative w-full max-w-64 mx-auto"
                >
                  <div className="relative w-full aspect-[256/380] perspective-1000">
                    {/* 卡牌堆效果 - 使用统一的 TarotCardBack */}
                    <div className="absolute top-0 left-0 w-full h-full rounded-2xl transform translate-x-3 translate-y-3 -z-20 opacity-60">
                      <TarotCardBack showPattern={false} />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full rounded-2xl transform translate-x-1.5 translate-y-1.5 -z-10 opacity-80">
                      <TarotCardBack showPattern={false} />
                    </div>

                    {/* 主卡牌背面 */}
                    <div className="relative w-full h-full transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_0_60px_rgba(244,192,37,0.3)]">
                      <TarotCardBack showPattern={true} />
                    </div>
                  </div>

                  {/* 外部提示 */}
                  <div className="absolute -bottom-12 w-full text-center">
                    <p className="text-[#F4C025] font-serif tracking-[0.2em] text-xs font-bold uppercase opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-slow">
                      Tap to Begin
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 洗牌和选牌状态 */}
            {(readingState === "shuffling" || readingState === "selecting") &&
              tarotSession && (
                <motion.div
                  key="selecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <CardSelector
                    displayCards={tarotSession.displayCards}
                    selectCount={1}
                    onComplete={handleCardSelect}
                    onCancel={handleCancelSelect}
                    isShuffling={readingState === "shuffling"}
                  />
                </motion.div>
              )}

            {/* 翻牌动画 */}
            {readingState === "drawing" && card && (
              <motion.div
                key="drawing"
                className="relative w-full max-w-64 aspect-[256/400] perspective-1000 mx-auto"
                initial={{ rotateY: 0, scale: 0.9 }}
                animate={{ rotateY: 180, scale: 1.1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 backface-hidden rounded-2xl bg-[#141414] border-2 border-[#F4C025]"
                  style={{ backfaceVisibility: "hidden" }}
                ></div>
                <div
                  className="absolute inset-0 backface-hidden rounded-2xl bg-[#141414] border-2 border-[#F4C025] flex items-center justify-center shadow-[0_0_100px_rgba(244,192,37,0.5)]"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#F4C025]/20 to-transparent opacity-50"></div>
                </div>
              </motion.div>
            )}

            {/* 揭示状态 */}
            {readingState === "revealed" && card && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start"
              >
                {/* 卡牌展示 */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end">
                  <motion.div
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    className="relative w-[300px] md:w-[360px] aspect-[4/7] rounded-2xl group cursor-pointer perspective-1000"
                  >
                    {/* Reversed Card Pulsing Border Effect */}
                    {card.isReversed && (
                      <motion.div
                        className="absolute -inset-[2px] rounded-2xl pointer-events-none z-0"
                        style={{
                          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.2), rgba(239, 68, 68, 0.4))",
                          boxShadow: "0 0 30px rgba(239, 68, 68, 0.3), inset 0 0 30px rgba(239, 68, 68, 0.1)",
                        }}
                        animate={{
                          opacity: [0.5, 0.8, 0.5],
                          scale: [1, 1.01, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl bg-[#141414] transition-transform duration-500 group-hover:scale-[1.02] flex flex-col p-[6%] ${
                        card.isReversed
                          ? "border-2 border-red-500/70 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
                          : "border-2 border-[#F4C025] shadow-[0_0_50px_rgba(244,192,37,0.2)]"
                      }`}
                    >
                      {/* 内边框 */}
                      <div className={`absolute inset-3 border rounded-xl opacity-80 pointer-events-none z-20 ${
                        card.isReversed ? "border-red-500/50" : "border-[#F4C025]"
                      }`}></div>

                      {/* 顶部编号 */}
                      <div className="h-[10%] flex items-center justify-center pt-4">
                        <span className={`font-serif font-bold text-3xl tracking-widest z-20 ${
                          card.isReversed ? "text-red-400" : "text-[#F4C025]"
                        }`}>
                          {getCardNumberDisplay(card)}
                        </span>
                      </div>

                      {/* 图像 */}
                      <div className="flex-1 relative overflow-hidden my-4 mx-2">
                        <motion.div
                          className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110 opacity-90"
                          style={{
                            backgroundImage: `url("${card.image}")`,
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            filter: card.isReversed
                              ? `${GOLD_FOIL_FILTER} hue-rotate(-30deg)`
                              : GOLD_FOIL_FILTER,
                          }}
                          initial={{ rotate: 0 }}
                          animate={{ rotate: card.isReversed ? 180 : 0 }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>

                      {/* 底部标题 */}
                      <div className="h-[12%] flex flex-col items-center justify-center pb-4 z-20">
                        <h3 className={`font-serif font-bold text-xl uppercase tracking-[0.1em] text-center leading-tight ${
                          card.isReversed ? "text-red-400" : "text-[#F4C025]"
                        }`}>
                          {card.name}
                        </h3>
                      </div>
                    </div>

                    {/* 逆位标识 - 红色徽章 */}
                    {card.isReversed && (
                      <motion.div
                        className="absolute -top-3 -right-3 z-50"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border-2 border-red-400/50">
                          <span className="material-symbols-outlined text-white text-xl rotate-180">
                            arrow_upward
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* 解读区域 */}
                <div className="lg:col-span-7 flex flex-col gap-8 text-left">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-surface-border pb-4">
                      <h2 className="text-4xl md:text-6xl font-display font-light text-foreground tracking-tight">
                        {card.name}
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowShareCard(true)}
                          className="h-10 w-10 rounded-full bg-surface-border/30 border border-surface-border flex items-center justify-center hover:bg-surface-border/30 hover:text-[#F4C025] transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            share
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            toast.success("Saved to your Grimoire.")
                          }
                          className="h-10 w-10 rounded-full bg-surface-border/30 border border-surface-border flex items-center justify-center hover:bg-surface-border/30 hover:text-[#F4C025] transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            favorite
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Destiny", "Insight", "Action", "Clarity"].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-md bg-surface-border/30 border border-surface-border text-xs font-medium text-text-muted hover:text-foreground transition-colors cursor-default"
                          >
                            #{tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="bg-surface/50 border border-surface-border p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                      <span className="material-symbols-outlined text-[150px]">
                        psychology
                      </span>
                    </div>
                    <h3 className="text-foreground font-bold mb-6 text-lg flex items-center gap-2">
                      <span className="text-[#F4C025]">✦</span> AI
                      Interpretation
                    </h3>

                    {/* AI 加载状态 */}
                    {isAILoading && (
                      <TarotLoadingOverlay
                        isLoading={isAILoading}
                        cards={card ? [card] : []}
                        startTime={aiLoadingStartTime || undefined}
                      />
                    )}

                    {/* 登录提示 */}
                    {!isAILoading && showLoginPrompt && (
                      <div className="text-center py-4">
                        <div className="mb-4">
                          <span className="material-symbols-outlined text-[#F4C025] text-4xl mb-2 block">
                            lock
                          </span>
                          <p className="text-gray-300 text-lg font-light mb-2">
                            {aiError === "rate_limit"
                              ? "You've reached your daily reading limit"
                              : "Sign in to unlock AI interpretations"}
                          </p>
                          <p className="text-text-muted text-sm">
                            {aiError === "rate_limit"
                              ? "Sign in to get more free readings"
                              : "Create an account to access personalized card readings"}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate("/dashboard")}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-[#F4C025] text-black font-bold rounded-full hover:bg-[#F4C025]/90 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            login
                          </span>
                          Sign In to Continue
                        </button>
                      </div>
                    )}

                    {/* 解读内容 - 使用分区组件 */}
                    {!isAILoading && !showLoginPrompt && interpretation && (
                      <TarotInterpretation
                        interpretation={interpretation}
                        coreMessage={coreMessage}
                        actionAdvice={actionAdvice}
                        luckyElements={luckyElements}
                      />
                    )}
                  </div>

                  {recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            diamond
                          </span>{" "}
                          Recommended Artifacts
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {recommendations.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            className="bg-surface-border/30 border border-surface-border p-3 rounded-xl flex gap-4 hover:bg-surface-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => navigate(PATHS.PRODUCT(product.id))}
                          >
                            <div className="w-20 h-20 rounded-lg bg-black/50 flex-shrink-0 overflow-hidden relative">
                              <img
                                src={product.image}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt={product.name}
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <h4 className="text-foreground text-sm font-bold group-hover:text-primary transition-colors">
                                {product.name}
                              </h4>
                              <span className="text-primary/80 text-xs font-medium mt-1">
                                ${product.price}
                              </span>
                              <span className="text-text-muted text-[10px] mt-2 group-hover:text-foreground transition-colors flex items-center gap-1">
                                View Details{" "}
                                <span className="material-symbols-outlined text-[10px]">
                                  arrow_forward
                                </span>
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8">
                    <button
                      onClick={resetReading}
                      className="w-full md:w-auto px-8 py-3 rounded-xl border border-surface-border text-foreground hover:bg-white hover:text-black transition-all font-bold tracking-wide flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">refresh</span>{" "}
                      Draw Another Card
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share Card Modal */}
        {showShareCard && card && (
          <TarotShareCard
            card={card}
            coreMessage={coreMessage}
            interpretation={interpretation}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TarotDaily;
