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
}

export const TarotCard: React.FC<TarotCardProps> = ({
  title,
  position,
  context,
  subtitle,
  image,
  active = false,
  delay = 0,
}) => {
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
              : "shadow-2xl border border-surface-border hover:border-[#F4C025]"
          }`}
      >
        {/* Inner Gold Border */}
        <div className="absolute inset-2 border border-[#F4C025] rounded-lg opacity-80 pointer-events-none z-20"></div>

        {/* Top Number */}
        <div className="h-[10%] flex items-center justify-center pt-2">
          <span className="text-[#F4C025] font-serif font-bold text-xl tracking-widest z-20">
            {displayNumber}
          </span>
        </div>

        {/* Image Area */}
        <div className="flex-1 relative overflow-hidden my-2 mx-2">
          <div
            className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110 opacity-90"
            style={{
              backgroundImage: `url('${image}')`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: GOLD_FOIL_FILTER,
            }}
          ></div>
        </div>

        {/* Bottom Title */}
        <div className="h-[12%] flex flex-col items-center justify-center pb-2 z-20">
          <h3 className="text-[#F4C025] font-serif font-bold text-sm uppercase tracking-[0.1em] text-center leading-tight">
            {title}
          </h3>
          {subtitle === "Reversed" && (
            <span className="text-[8px] text-[#F4C025]/60 uppercase tracking-widest mt-0.5">
              Reversed
            </span>
          )}
        </div>

        {/* Shine Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30"></div>
      </div>
    </motion.div>
  );
};

export default TarotCard;
