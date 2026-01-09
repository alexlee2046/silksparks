/**
 * Application-wide constants
 *
 * Centralizes magic values, localStorage keys, and configuration defaults
 * to improve maintainability and prevent typos.
 */

// ============ Spiritual Elements ============
export const ELEMENTS = ["Fire", "Water", "Air", "Earth", "Spirit"] as const;
export type Element = (typeof ELEMENTS)[number];

// ============ localStorage Keys ============
export const STORAGE_KEYS = {
  CART: "silk_spark_cart",
  THEME: "silk-spark-theme",
  LOCALE: "silk-spark-locale",
  QUALITY: "silk-spark-quality",
  BOOKING_DRAFT: "booking_draft",
  DAILY_SPARK: "daily_spark",
  DAILY_SPARK_DATE: "daily_spark_date",
} as const;

// ============ Timing & Limits ============
export const TIMING = {
  /** AI request timeout in milliseconds */
  AI_TIMEOUT_MS: 30000,
  /** Cache TTL for recommendations (5 minutes) */
  RECOMMENDATION_CACHE_TTL: 5 * 60 * 1000,
  /** Default query cache TTL (5 minutes) */
  DEFAULT_CACHE_TTL: 5 * 60 * 1000,
  /** Toast notification duration */
  TOAST_DURATION_MS: 3000,
  /** Long toast duration for important messages */
  TOAST_LONG_DURATION_MS: 4000,
} as const;

// ============ Booking Configuration ============
export const BOOKING = {
  /** Number of days shown in the booking calendar */
  CALENDAR_DAYS: 14,
  /** Default session duration in minutes */
  DEFAULT_SESSION_MINUTES: 30,
} as const;

// ============ Pagination Defaults ============
export const PAGINATION = {
  /** Default page size for lists */
  DEFAULT_PAGE_SIZE: 20,
  /** Max items per page */
  MAX_PAGE_SIZE: 100,
} as const;

// ============ Animation Durations ============
export const ANIMATION = {
  /** Fast transition duration */
  FAST_MS: 150,
  /** Default transition duration */
  DEFAULT_MS: 300,
  /** Slow transition duration */
  SLOW_MS: 500,
  /** Page transition duration */
  PAGE_TRANSITION_MS: 400,
} as const;
