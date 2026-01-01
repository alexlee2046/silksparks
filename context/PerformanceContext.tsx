/**
 * Performance Context - Quality Level Management
 * Manages Three.js rendering quality based on device capabilities
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useDevicePerformance, PerformanceTier } from "../hooks/useDevicePerformance";

export type QualityLevel = "high" | "medium" | "low" | "off";

interface QualitySettings {
  stars: number;
  sparkles: number;
  enableSparkles: boolean;
  enableFloat: boolean;
  enableFog: boolean;
  dpr: [number, number];
}

interface PerformanceContextType {
  qualityLevel: QualityLevel;
  setQualityLevel: (level: QualityLevel) => void;
  isAutoDetected: boolean;
  deviceTier: PerformanceTier;
  settings: QualitySettings;
  resetToAuto: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

const STORAGE_KEY = "silk-spark-quality";

const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  high: {
    stars: 5000,
    sparkles: 450,
    enableSparkles: true,
    enableFloat: true,
    enableFog: true,
    dpr: [1, 2],
  },
  medium: {
    stars: 2000,
    sparkles: 200,
    enableSparkles: true,
    enableFloat: true,
    enableFog: true,
    dpr: [1, 1.5],
  },
  low: {
    stars: 500,
    sparkles: 50,
    enableSparkles: true,
    enableFloat: false,
    enableFog: false,
    dpr: [1, 1],
  },
  off: {
    stars: 0,
    sparkles: 0,
    enableSparkles: false,
    enableFloat: false,
    enableFog: false,
    dpr: [1, 1],
  },
};

function tierToQuality(tier: PerformanceTier): QualityLevel {
  switch (tier) {
    case "high": return "high";
    case "medium": return "medium";
    case "low": return "low";
  }
}

function getStoredQuality(): QualityLevel | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "high" || stored === "medium" || stored === "low" || stored === "off") {
    return stored;
  }
  return null;
}

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const device = useDevicePerformance();
  const [isAutoDetected, setIsAutoDetected] = useState(true);
  const [qualityLevel, setQualityLevelState] = useState<QualityLevel>(() => {
    const stored = getStoredQuality();
    if (stored) {
      return stored;
    }
    return tierToQuality(device.tier);
  });

  // Update quality when device detection completes (for SSR hydration)
  useEffect(() => {
    const stored = getStoredQuality();
    if (!stored) {
      setQualityLevelState(tierToQuality(device.tier));
      setIsAutoDetected(true);
    } else {
      setIsAutoDetected(false);
    }
  }, [device.tier]);

  const setQualityLevel = useCallback((level: QualityLevel) => {
    setQualityLevelState(level);
    setIsAutoDetected(false);
    localStorage.setItem(STORAGE_KEY, level);
  }, []);

  const resetToAuto = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setQualityLevelState(tierToQuality(device.tier));
    setIsAutoDetected(true);
  }, [device.tier]);

  const settings = QUALITY_PRESETS[qualityLevel];

  return (
    <PerformanceContext.Provider
      value={{
        qualityLevel,
        setQualityLevel,
        isAutoDetected,
        deviceTier: device.tier,
        settings,
        resetToAuto,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error("usePerformance must be used within a PerformanceProvider");
  }
  return context;
}

export { QUALITY_PRESETS };
