import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { variants } from "../lib/animations";
import { useJourneyState } from "../hooks/useJourneyState";
import { useJourneyTrack } from "../hooks/useJourneyTrack";
import { PATHS } from "../lib/paths";

type Feature = "tarot" | "astrology" | "fusion" | "shop" | "experts";

interface Props {
  currentFeature: Feature;
}

interface Recommendation {
  target: Feature | "register";
  path: string;
  icon: string;
  title: string;
  description: string;
}

function getRecommendation(
  current: Feature,
  hasBirthData: boolean,
  hasAccount: boolean,
  completedFeatures: string[],
): Recommendation | null {
  if (current === "tarot") {
    if (!hasBirthData) {
      return {
        target: "astrology",
        path: PATHS.HOROSCOPE,
        icon: "astronomy",
        title: "Unlock Your Star Chart",
        description:
          "Your card hints at transformation — your star chart can tell you why.",
      };
    }
    if (!completedFeatures.includes("fusion")) {
      return {
        target: "fusion",
        path: PATHS.FUSION,
        icon: "yin_yang",
        title: "East Meets West",
        description:
          "Combine your BaZi with this card for a deeper perspective.",
      };
    }
    if (!hasAccount) {
      return {
        target: "register",
        path: PATHS.DASHBOARD,
        icon: "bookmark",
        title: "Save Your Journey",
        description:
          "Save to your Grimoire and track how your cards evolve.",
      };
    }
  }

  if (current === "astrology") {
    if (!completedFeatures.includes("tarot")) {
      return {
        target: "tarot",
        path: PATHS.TAROT,
        icon: "psychology",
        title: "Try Today's Tarot",
        description:
          "Your chart shows strong intuition — let the cards confirm it.",
      };
    }
    if (hasBirthData && !completedFeatures.includes("fusion")) {
      return {
        target: "fusion",
        path: PATHS.FUSION,
        icon: "yin_yang",
        title: "Complete Fusion Reading",
        description: "East meets West — see the complete picture.",
      };
    }
  }

  if (current === "fusion") {
    if (!completedFeatures.includes("shop")) {
      return {
        target: "shop",
        path: PATHS.SHOP,
        icon: "storefront",
        title: "Curated for You",
        description:
          "Crystals and accessories that resonate with your energy.",
      };
    }
    return {
      target: "experts",
      path: PATHS.EXPERTS,
      icon: "group",
      title: "One-on-One Guidance",
      description:
        "Want a deeper, personalized reading with an expert?",
    };
  }

  return null;
}

export const JourneyNext: React.FC<Props> = ({ currentFeature }) => {
  const navigate = useNavigate();
  const { hasAccount, hasBirthData, completedFeatures } = useJourneyState();
  const { track } = useJourneyTrack();
  const [dismissed, setDismissed] = useState(false);

  const recommendation = getRecommendation(
    currentFeature,
    hasBirthData,
    hasAccount,
    completedFeatures,
  );

  if (!recommendation || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        data-testid="journey-next"
        variants={variants.slideUp}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="mt-12 mb-8 w-full max-w-2xl mx-auto"
      >
        <div
          className="relative flex items-start gap-4 p-6 rounded-2xl bg-surface/60 backdrop-blur-md border border-surface-border hover:border-primary/30 transition-colors group cursor-pointer"
          onClick={() => {
            track("journey_next_click", {
              from: currentFeature,
              to: recommendation.target,
            });
            navigate(recommendation.path);
          }}
        >
          {/* Left accent line */}
          <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-primary rounded-full" />

          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">
              {recommendation.icon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-foreground font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
              {recommendation.title}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              {recommendation.description}
            </p>
          </div>

          <span className="material-symbols-outlined text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all text-lg mt-1">
            arrow_forward
          </span>

          {/* Dismiss button */}
          <button
            aria-label="Dismiss recommendation"
            className="absolute top-2 right-2 p-1 text-text-muted/50 hover:text-text-muted rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              track("journey_next_dismiss", { from: currentFeature });
              setDismissed(true);
            }}
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
