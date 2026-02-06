import { useState, useCallback, useMemo } from "react";
import { useUser } from "../context/UserContext";

type Feature = "tarot" | "astrology" | "fusion" | "shop" | "experts";

const STORAGE_KEY = "silksparks_journey";
const VISITED_KEY = "silksparks_visited";

interface StoredJourney {
  completedFeatures: Feature[];
  lastFeature: Feature | null;
}

function loadJourney(): StoredJourney {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { completedFeatures: [], lastFeature: null };
}

function saveJourney(journey: StoredJourney) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
}

export function useJourneyState() {
  const { session, isBirthDataComplete } = useUser();

  const [isFirstVisit, setIsFirstVisit] = useState(
    () => !localStorage.getItem(VISITED_KEY)
  );
  const [journey, setJourney] = useState<StoredJourney>(loadJourney);

  const hasAccount = !!session?.user;
  const hasBirthData = isBirthDataComplete;

  const markVisited = useCallback(() => {
    localStorage.setItem(VISITED_KEY, "true");
    setIsFirstVisit(false);
  }, []);

  const completeFeature = useCallback((feature: Feature) => {
    setJourney((prev) => {
      if (prev.completedFeatures.includes(feature)) {
        const updated = { ...prev, lastFeature: feature };
        saveJourney(updated);
        return updated;
      }
      const updated = {
        completedFeatures: [...prev.completedFeatures, feature],
        lastFeature: feature,
      };
      saveJourney(updated);
      return updated;
    });
  }, []);

  const suggestedNext = useMemo((): Feature | "register" => {
    const { completedFeatures } = journey;

    if (!completedFeatures.includes("tarot")) return "tarot";
    if (!hasBirthData) return "astrology";
    if (!completedFeatures.includes("fusion")) return "fusion";
    if (!hasAccount) return "register";
    if (!completedFeatures.includes("shop")) return "shop";
    return "experts";
  }, [journey, hasBirthData, hasAccount]);

  return {
    isFirstVisit,
    hasAccount,
    hasBirthData,
    completedFeatures: journey.completedFeatures,
    lastFeature: journey.lastFeature,
    suggestedNext,
    markVisited,
    completeFeature,
  };
}
