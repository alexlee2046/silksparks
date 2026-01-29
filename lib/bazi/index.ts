/**
 * BaZi (八字) Module
 *
 * Chinese Four Pillars astrology calculation and analysis.
 */

// Types
export * from "./types";

// Constants
export * from "./constants";

// Calculations
export {
  calculateFourPillars,
  calculateHourPillar,
  calculateWuXingDistribution,
  formatPillar,
  formatFourPillars,
  getGanZhiIndex,
  type CalculateFourPillarsInput,
  type CalculateFourPillarsResult,
} from "./calculations";

// Ten Gods
export {
  getTenGod,
  calculateTenGods,
  calculateDayMasterStrength,
  calculateElementPreferences,
  getTenGodCategory,
  isTenGodDirect,
} from "./tenGods";
