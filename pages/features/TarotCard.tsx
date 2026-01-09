import React from "react";
import { motion } from "framer-motion";
import tarotData from "../../src/data/tarot_cards.json";
import { getCardNumberDisplay, GOLD_FOIL_FILTER } from "./tarotUtils";

interface TarotCardProps {
  title: string;
  position: string;
  context: string;
  subtitle?: string;
  image: string;
  active?: boolean;
  delay?: number;
  /** Whether the card is reversed (inverted meaning) */
  isReversed?: boolean;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  title,
  position,
  context,
  subtitle,
  image,
  active = false,
  delay = 0,
  isReversed = false,
}) => {
  // Determine if reversed from either prop or subtitle
  const reversed = isReversed || subtitle === "Reversed";
  // Try to find the card object from title if cardData not passed directly
  const foundCard = tarotData.find((t) => t.name === title);
  const displayNumber = foundCard ? getCardNumberDisplay(foundCard) : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className={`relative z-10 flex flex-col items-center gap-6 group ${active ? "md:-mt-8" : ""}`}
    >
      <div className="text-center transition-opacity">
        <span className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-1 block">
          Position {position}
        </span>
        <span
          className={`font-medium ${active ? "text-[#F4C025]" : "text-foreground"}`}
        >
          {context}
        </span>
      </div>

      {/* Card Container mimicking the physical card */}
      <div
        className={`relative w-full max-w-[260px] aspect-[4/7] rounded-xl bg-[#141414] transition-all duration-700 transform group-hover:-translate-y-4 group-hover:scale-105 overflow-hidden cursor-pointer flex flex-col p-[6%]
          ${
            active
              ? "shadow-[0_0_30px_rgba(244,192,37,0.2)] border border-[#F4C025]"
              : reversed
                ? "shadow-2xl border-2 border-red-500/70"
                : "shadow-2xl border border-surface-border hover:border-[#F4C025]"
          }`}
      >
        {/* Reversed Card Pulsing Border Effect */}
        {reversed && (
          <motion.div
            className="absolute -inset-[2px] rounded-xl pointer-events-none z-0"
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.2), rgba(239, 68, 68, 0.4))",
              boxShadow: "0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.1)",
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

        {/* Reversed Badge Indicator */}
        {reversed && (
          <motion.div
            className="absolute -top-2 -right-2 z-50"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: delay + 0.3 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border-2 border-red-400/50">
              <span className="material-symbols-outlined text-white text-lg rotate-180">
                arrow_upward
              </span>
            </div>
          </motion.div>
        )}

        {/* Inner Gold/Red Border */}
        <div className={`absolute inset-2 border rounded-lg opacity-80 pointer-events-none z-20 ${
          reversed ? "border-red-500/50" : "border-[#F4C025]"
        }`}></div>

        {/* Top Number */}
        <div className="h-[10%] flex items-center justify-center pt-2">
          <span className="text-[#F4C025] font-serif font-bold text-xl tracking-widest z-20">
            {displayNumber}
          </span>
        </div>

        {/* Image Area */}
        <div className="flex-1 relative overflow-hidden my-2 mx-2">
          <motion.div
            className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110 opacity-90"
            style={{
              backgroundImage: `url('${image}')`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: reversed
                ? `${GOLD_FOIL_FILTER} hue-rotate(-30deg)`
                : GOLD_FOIL_FILTER,
            }}
            initial={{ rotate: 0 }}
            animate={{ rotate: reversed ? 180 : 0 }}
            transition={{ duration: 0.8, delay: delay + 0.1 }}
          />
        </div>

        {/* Bottom Title */}
        <div className="h-[12%] flex flex-col items-center justify-center pb-2 z-20">
          <h3 className={`font-serif font-bold text-sm uppercase tracking-[0.1em] text-center leading-tight ${
            reversed ? "text-red-400" : "text-[#F4C025]"
          }`}>
            {title}
          </h3>
          {reversed && (
            <motion.span
              className="text-[9px] text-red-400/80 uppercase tracking-widest mt-0.5 flex items-center gap-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.4 }}
            >
              <span className="material-symbols-outlined text-[10px]">
                rotate_right
              </span>
              Reversed
            </motion.span>
          )}
        </div>

        {/* Shine Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30"></div>
      </div>
    </motion.div>
  );
};

export default TarotCard;
