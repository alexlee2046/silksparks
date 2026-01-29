/**
 * Fusion Tier Configuration
 *
 * Feature gating for different user tiers.
 */

import type { FusionTierConfig, UserTier } from "./types";

/**
 * Tier configurations
 */
export const TIER_CONFIGS: Record<UserTier, FusionTierConfig> = {
  free: {
    tier: "free",
    features: {
      basicDayMaster: true,
      westernSigns: true,
      briefFusion: true,
      fullFourPillars: false,
      tenGodsAnalysis: false,
      hiddenStems: false,
      dayMasterStrength: false,
      elementPreferences: false,
      literatureQuotes: 1,
      detailedFusion: false,
      pdfDownload: false,
      yearlyForecast: false,
      compatibility: false,
    },
  },
  member: {
    tier: "member",
    features: {
      basicDayMaster: true,
      westernSigns: true,
      briefFusion: true,
      fullFourPillars: true,
      tenGodsAnalysis: true,
      hiddenStems: true,
      dayMasterStrength: true,
      elementPreferences: true,
      literatureQuotes: 3,
      detailedFusion: true,
      pdfDownload: true,
      yearlyForecast: false,
      compatibility: false,
    },
  },
  premium: {
    tier: "premium",
    features: {
      basicDayMaster: true,
      westernSigns: true,
      briefFusion: true,
      fullFourPillars: true,
      tenGodsAnalysis: true,
      hiddenStems: true,
      dayMasterStrength: true,
      elementPreferences: true,
      literatureQuotes: 10,
      detailedFusion: true,
      pdfDownload: true,
      yearlyForecast: true,
      compatibility: true,
    },
  },
};

/**
 * Get tier config
 */
export function getTierConfig(tier: UserTier): FusionTierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Check if a feature is available for a tier
 */
export function hasFeature(
  tier: UserTier,
  feature: keyof FusionTierConfig["features"]
): boolean {
  const config = TIER_CONFIGS[tier];
  const value = config.features[feature];
  return typeof value === "boolean" ? value : value > 0;
}

/**
 * Get max literature quotes for tier
 */
export function getMaxQuotes(tier: UserTier): number {
  return TIER_CONFIGS[tier].features.literatureQuotes;
}

/**
 * Map profile tier string to UserTier
 */
export function profileTierToUserTier(profileTier: string): UserTier {
  switch (profileTier.toLowerCase()) {
    case "premium":
    case "gold":
    case "platinum":
      return "premium";
    case "member":
    case "silver":
    case "basic":
      return "member";
    default:
      return "free";
  }
}
