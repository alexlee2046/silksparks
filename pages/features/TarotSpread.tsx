import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import AIService from "../../services/ai";
import { RateLimitError } from "../../services/ai/SupabaseAIProvider";
import type { TarotCard as TarotCardType } from "../../services/ai/types";
import toast from "react-hot-toast";
import { useUser } from "../../context/UserContext";
import { motion } from "framer-motion";
import {
  RecommendationEngine,
  Product,
} from "../../services/RecommendationEngine";
import { TarotCard } from "./TarotCard";
import { TarotCardBack } from "./TarotCardBack";
import { CardSelector } from "./CardSelector";
import { TarotLoadingOverlay } from "./TarotLoadingOverlay";
import { TarotInterpretation } from "./TarotInterpretation";
import {
  initSpreadTarot,
  selectSpreadCards,
  type SpreadTarotResult,
} from "../../services/TarotService";
import type { LuckyElements } from "../../services/ai/types";

type ReadingState = "idle" | "shuffling" | "selecting" | "drawing" | "revealed";

const POSITION_LABELS = ["The Past", "The Present", "The Future"];

export const TarotSpread: React.FC = () => {
  const navigate = useNavigate();
  const { addArchive, session } = useUser();
  const userId = session?.user?.id ?? null;
  const isLoggedIn = !!session?.user;

  const [readingState, setReadingState] = useState<ReadingState>("idle");
  const [cards, setCards] = useState<TarotCardType[]>([]);
  const [interpretation, setInterpretation] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [tarotSession, setTarotSession] = useState<SpreadTarotResult | null>(
    null
  );
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiLoadingStartTime, setAiLoadingStartTime] = useState<number | null>(null);
  const [coreMessage, setCoreMessage] = useState<string>("");
  const [actionAdvice, setActionAdvice] = useState<string>("");
  const [luckyElements, setLuckyElements] = useState<LuckyElements | undefined>(undefined);

  // 开始抽牌流程
  const handleStartSession = useCallback(() => {
    setReadingState("shuffling");

    // 洗牌动画后进入选牌阶段
    setTimeout(() => {
      const session = initSpreadTarot(userId);
      setTarotSession(session);
      setReadingState("selecting");
    }, 2000);
  }, [userId]);

  // 用户选择三张卡牌后的处理
  const handleCardsSelect = useCallback(
    async (selectedIndices: number[]) => {
      if (!tarotSession || selectedIndices.length !== 3) return;

      setReadingState("drawing");

      // 构建三张牌
      const drawnCards = selectSpreadCards(tarotSession.seed, selectedIndices);
      setCards(drawnCards);

      // 生成解读
      setTimeout(async () => {
        setReadingState("revealed");
        const [card0, card1, card2] = drawnCards;
        if (!card0 || !card1 || !card2) {
          setInterpretation("Failed to draw cards. Please try again.");
          return;
        }

        // 开始 AI 加载
        setIsAILoading(true);
        setAiLoadingStartTime(Date.now());

        try {
          const response = await AIService.generateTarotReading({
            cards: [
              { ...card0, position: "past" },
              { ...card1, position: "present" },
              { ...card2, position: "future" },
            ],
            question:
              "Synthesize a cohesive narrative for Past, Present, and Future.",
            spreadType: "three-card",
          });
          const text = response.interpretation;
          setInterpretation(text);
          setCoreMessage(response.coreMessage || "");
          setActionAdvice(response.actionAdvice || "");
          setLuckyElements(response.luckyElements);
          setIsAILoading(false);

          if (response.meta?.isFallback) {
            toast("Using backup AI for reading", { icon: "⚠️", duration: 3000 });
          }

          const recs = await RecommendationEngine.getRecommendations(text, 3);
          setRecommendations(recs);

          // 保存到档案
          addArchive({
            id: `tarot_spread_${Date.now()}`,
            type: "Tarot",
            date: new Date(),
            title: `Three Card Spread: ${card0.name}, ${card1.name}, ${card2.name}`,
            summary: text.substring(0, 100) + "...",
            content: text,
            image: card1.image, // 使用中间的牌作为封面
          });
        } catch (e) {
          console.error("[TarotSpread] 3-card spread error:", e);
          setIsAILoading(false);
          if (e instanceof RateLimitError) {
            setShowLoginPrompt(true);
            setAiError("rate_limit");
            setInterpretation("");
          } else {
            const errorMsg = e instanceof Error ? e.message : "AI service unavailable";
            setAiError(errorMsg);
            if (!isLoggedIn) {
              setShowLoginPrompt(true);
              setInterpretation("");
            } else {
              setInterpretation(
                "The veil is thick today... but the cards speak of transformation."
              );
            }
          }
        }
      }, 1500);
    },
    [tarotSession, addArchive]
  );

  // 重置
  const resetReading = useCallback(() => {
    setReadingState("idle");
    setCards([]);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative bg-background bg-silk-pattern min-h-screen"
    >
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-surface/50 to-transparent -z-10"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate(PATHS.HOME)}
        className="absolute top-8 left-8 text-text-muted hover:text-foreground flex items-center gap-2 z-20 group transition-colors"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back
      </button>

      <section className="relative z-10 w-full flex flex-col items-center justify-center py-10 px-4 md:px-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-surface-border bg-surface/50 backdrop-blur-md text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm">
              auto_awesome
            </span>{" "}
            Three Card Spread
          </div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-light text-foreground tracking-tight mb-3 font-display"
          >
            Past, Present,{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">
              Future
            </span>
          </motion.h1>
          <p className="text-text-muted max-w-lg mx-auto mt-4 text-lg">
            {readingState === "selecting"
              ? "Choose three cards that resonate with your journey..."
              : readingState === "idle"
                ? "Focus on a question about your path..."
                : ""}
          </p>
        </div>

        <div className="w-full max-w-[1100px] mx-auto min-h-[400px]">
          {/* 空闲状态 - 显示开始按钮 */}
          {readingState === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8 mt-8"
            >
              <div
                onClick={handleStartSession}
                className="relative cursor-pointer group w-full max-w-64 aspect-[256/380] perspective-1000 mx-auto"
              >
                {/* Stack Effect - 使用统一的 TarotCardBack */}
                <div className="absolute top-0 left-0 w-full h-full rounded-2xl transform translate-x-4 translate-y-4 -z-20 opacity-50">
                  <TarotCardBack showPattern={false} />
                </div>
                <div className="absolute top-0 left-0 w-full h-full rounded-2xl transform translate-x-2 translate-y-2 -z-10 opacity-70">
                  <TarotCardBack showPattern={false} />
                </div>

                {/* Main Deck - 使用 TarotCardBack 并叠加三张牌标识 */}
                <div className="relative w-full h-full transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_0_60px_rgba(244,192,37,0.3)]">
                  <TarotCardBack showPattern={true} />

                  {/* 叠加三张牌阵特有的标识 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {/* Triple Icon */}
                    <div className="relative z-30 flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`w-10 h-10 rounded-full border-2 border-[#F4C025]/60 bg-[#0a0a0a]/80 flex items-center justify-center group-hover:border-[#F4C025] transition-all ${
                            i === 1 ? "scale-110" : ""
                          }`}
                          style={{ transitionDelay: `${i * 50}ms` }}
                        >
                          <span className="text-[#F4C025] text-sm font-serif font-bold">
                            {["I", "II", "III"][i]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Labels */}
                    <div className="mt-3 flex gap-3 text-[#F4C025]/60 text-[7px] uppercase tracking-widest z-30">
                      <span>Past</span>
                      <span className="text-[#F4C025]">Present</span>
                      <span>Future</span>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-16 w-full text-center">
                  <span className="inline-flex items-center gap-2 text-[#F4C025] font-serif tracking-[0.2em] text-xs font-bold uppercase border-b border-[#F4C025]/30 pb-1 group-hover:border-[#F4C025] transition-colors animate-pulse-slow">
                    Tap Deck to Shuffle
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 洗牌和选牌状态 */}
          {(readingState === "shuffling" || readingState === "selecting") &&
            tarotSession && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <CardSelector
                  displayCards={tarotSession.displayCards}
                  selectCount={3}
                  onComplete={handleCardsSelect}
                  onCancel={handleCancelSelect}
                  positionLabels={POSITION_LABELS}
                  isShuffling={readingState === "shuffling"}
                />
              </motion.div>
            )}

          {/* 翻牌和揭示状态 */}
          {(readingState === "drawing" || readingState === "revealed") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative mb-16 px-4">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#F4C025]/20 to-transparent -translate-y-1/2 z-0"></div>

              {cards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.3, duration: 0.6 }}
                >
                  <TarotCard
                    title={card.name}
                    position={i === 0 ? "I" : i === 1 ? "II" : "III"}
                    context={
                      i === 0
                        ? "The Past"
                        : i === 1
                          ? "The Present"
                          : "The Future"
                    }
                    subtitle={card.isReversed ? "Reversed" : "Upright"}
                    image={card.image}
                    delay={i * 0.2}
                    active={i === 1}
                    isReversed={card.isReversed}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {readingState === "revealed" && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-[960px] mx-auto bg-surface border border-surface-border rounded-xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-border/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">
                    psychology_alt
                  </span>
                </div>
                <div>
                  <h3 className="text-foreground font-bold text-lg">
                    Spark AI Interpretation
                  </h3>
                  <p className="text-text-muted text-xs">
                    Generated based on planetary transits & card symbology
                  </p>
                </div>
              </div>
              <div className="space-y-6 text-sm text-text-muted">
                {/* AI 加载状态 */}
                {isAILoading && (
                  <TarotLoadingOverlay
                    isLoading={isAILoading}
                    cards={cards}
                    startTime={aiLoadingStartTime || undefined}
                  />
                )}

                {/* 登录提示 */}
                {!isAILoading && showLoginPrompt && (
                  <div className="p-6 rounded-lg bg-background/50 border border-surface-border text-center">
                    <span className="material-symbols-outlined text-[#F4C025] text-4xl mb-3 block">
                      lock
                    </span>
                    <p className="text-gray-300 text-lg font-light mb-2">
                      {aiError === "rate_limit"
                        ? "You've reached your daily reading limit"
                        : "Sign in to unlock AI interpretations"}
                    </p>
                    <p className="text-text-muted text-sm mb-4">
                      {aiError === "rate_limit"
                        ? "Sign in to get more free readings"
                        : "Create an account to access personalized card readings"}
                    </p>
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

                {/* 解读内容 */}
                {!isAILoading && !showLoginPrompt && interpretation && (
                  <TarotInterpretation
                    interpretation={interpretation}
                    coreMessage={coreMessage}
                    actionAdvice={actionAdvice}
                    luckyElements={luckyElements}
                    isSpread={true}
                  />
                )}
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="mt-8 border-t border-surface-border pt-8">
                  <h4 className="text-foreground text-xs font-bold uppercase tracking-widest mb-4">
                    Recommended for your journey
                  </h4>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {recommendations.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => navigate(PATHS.PRODUCT(r.id))}
                        className="bg-surface-border/30 hover:bg-surface-border/50 border border-surface-border px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors"
                      >
                        <span className="text-primary material-symbols-outlined text-sm">
                          diamond
                        </span>
                        <span className="text-foreground text-sm">{r.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => navigate(PATHS.SHOP)}
                  className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-background-dark font-bold transition-all shadow-[0_0_20px_rgba(244,192,37,0.2)] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">
                    shopping_bag
                  </span>{" "}
                  Browse Sacred Shop
                </button>
                <button
                  onClick={resetReading}
                  className="px-6 py-3 rounded-lg border border-surface-border hover:bg-surface-border/30 text-foreground font-bold transition-all"
                >
                  New Reading
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default TarotSpread;
