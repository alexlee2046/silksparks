/**
 * TarotChat - 塔罗追问功能组件
 * 用户可以基于已抽取的牌面进行追问
 * 免费用户每次解读限2次追问，会员无限
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard, TarotReadingResponse } from "../../services/ai/types";
import { useUser } from "../../context/UserContext";
import AIService from "../../services/ai";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TarotChatProps {
  /** 已抽取的牌 */
  drawnCards: TarotCard[];
  /** 初始解读 */
  initialReading: TarotReadingResponse;
  /** 关闭回调 */
  onClose: () => void;
}

/** 免费用户每次解读的追问限制 */
const FREE_FOLLOWUP_LIMIT = 2;

export const TarotChat: React.FC<TarotChatProps> = ({
  drawnCards,
  initialReading,
  onClose,
}) => {
  const { session, profile } = useUser();
  const isPremium = profile?.tier === "premium";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 剩余免费追问次数
  const remainingFreeFollowUps = Math.max(
    0,
    FREE_FOLLOWUP_LIMIT - followUpCount
  );
  const canAskMore = isPremium || remainingFreeFollowUps > 0;

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始化时聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 发送追问
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !canAskMore) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 构建上下文
      const previousContext = messages
        .map((m) => `${m.role === "user" ? "问" : "答"}: ${m.content}`)
        .join("\n");

      const cardsDescription = drawnCards
        .map(
          (c) => `${c.name} (${c.isReversed ? "Reversed" : "Upright"}) - ${c.position || "single"}`
        )
        .join(", ");

      // 调用 AI 追问
      const response = await AIService.generateTarotReading({
        cards: drawnCards,
        question: `Previous reading: ${initialReading.interpretation}\n\nPrevious Q&A:\n${previousContext}\n\nNew question: ${userMessage.content}`,
        spreadType: drawnCards.length === 1 ? "single" : "three-card",
      });

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: response.interpretation,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setFollowUpCount((prev) => prev + 1);

      if (!isPremium && remainingFreeFollowUps <= 1) {
        toast("You've used all free follow-ups", {
          icon: "✨",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("[TarotChat] Follow-up error:", error);
      toast.error("Failed to get response. Please try again.");

      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: "assistant",
        content:
          "The cosmic connection is unstable... Please try your question again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">
                forum
              </span>
            </div>
            <div>
              <h3 className="text-foreground font-bold">Ask the Cards</h3>
              <p className="text-text-muted text-xs">
                {drawnCards.length} card{drawnCards.length > 1 ? "s" : ""} drawn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 剩余次数指示 */}
            {!isPremium && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-border/50 text-xs">
                <span className="text-text-muted">Free questions:</span>
                <span
                  className={`font-bold ${remainingFreeFollowUps > 0 ? "text-primary" : "text-red-400"}`}
                >
                  {remainingFreeFollowUps}
                </span>
              </div>
            )}
            {isPremium && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-xs text-primary">
                <span className="material-symbols-outlined text-sm">
                  diamond
                </span>
                <span>Unlimited</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-border/50 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-text-muted">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Cards Summary */}
        <div className="px-4 py-3 bg-background/50 border-b border-surface-border/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {drawnCards.map((card, i) => (
              <div
                key={card.id}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs"
              >
                <span className="text-primary font-bold mr-1">
                  {["I", "II", "III"][i] || ""}
                </span>
                <span className="text-foreground">{card.name}</span>
                {card.isReversed && (
                  <span className="text-text-muted ml-1">(R)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 初始解读作为第一条消息 */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">
                auto_awesome
              </span>
            </div>
            <div className="flex-1">
              <p className="text-text-muted text-xs mb-1">Initial Reading</p>
              <div className="bg-surface-border/30 rounded-xl p-4 text-foreground text-sm leading-relaxed">
                {initialReading.interpretation}
              </div>
            </div>
          </div>

          {/* 对话消息 */}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-surface-border"
                      : "bg-primary/10"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-sm ${
                      message.role === "user" ? "text-text-muted" : "text-primary"
                    }`}
                  >
                    {message.role === "user" ? "person" : "auto_awesome"}
                  </span>
                </div>
                <div className="flex-1 max-w-[80%]">
                  <div
                    className={`rounded-xl p-4 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-primary/10 text-foreground ml-auto"
                        : "bg-surface-border/30 text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 加载指示器 */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm animate-pulse">
                  auto_awesome
                </span>
              </div>
              <div className="flex items-center gap-1 text-text-muted text-sm">
                <span className="animate-pulse">Consulting the stars</span>
                <span className="animate-bounce">...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-surface-border bg-surface/80">
          {canAskMore ? (
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a follow-up question..."
                disabled={isLoading}
                className="flex-1 bg-background border border-surface-border rounded-xl px-4 py-3 text-foreground placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-12 h-12 rounded-xl bg-primary hover:bg-primary-hover text-background flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-text-muted text-sm mb-3">
                You've used all free follow-up questions
              </p>
              <button
                onClick={() => toast("Premium membership coming soon!")}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover text-background font-bold text-sm transition-colors flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-sm">
                  diamond
                </span>
                Upgrade for Unlimited
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TarotChat;
