/**
 * AI Service Constants
 * Centralized configuration and magic strings
 */

/** Edge Function name for AI generation */
export const EDGE_FUNCTION_NAME = "ai-generate";

/** System settings key for AI configuration */
export const AI_CONFIG_KEY = "ai_config";

/** Request types for AI endpoints */
export const REQUEST_TYPES = {
  BIRTH_CHART: "birth_chart",
  TAROT: "tarot",
  DAILY_SPARK: "daily_spark",
} as const;

/** Error codes returned by the Edge Function */
export const ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  NO_API_KEY: "NO_API_KEY",
  INVALID_REQUEST: "INVALID_REQUEST",
} as const;

/** Cache configuration */
export const CACHE_CONFIG = {
  /** Maximum number of cached items */
  MAX_SIZE: 50,
  /** Cache TTL in milliseconds (7 days) */
  TTL_MS: 7 * 24 * 60 * 60 * 1000,
  /** Prefix for localStorage keys */
  PREFIX: "silk_spark_",
} as const;

/** Cache key prefixes */
export const CACHE_KEYS = {
  DAILY_SPARK: "daily_spark",
  DAILY_SPARK_DATE: "daily_spark_date",
  REPORT_PREFIX: "silk_spark_report_",
} as const;

/** Default values */
export const DEFAULTS = {
  /** Default daily AI request limit per user */
  DAILY_LIMIT: 50,
  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 30000,
  /** Default locale */
  LOCALE: "en-US" as const,
} as const;

/** Fallback messages when AI is unavailable */
export const FALLBACK_MESSAGES = {
  birth_chart:
    "The cosmic signals are momentarily unclear... Please try again to reconnect with the stellar energies.",
  tarot:
    "The tarot veil is temporarily obscured... Take a deep breath and draw again shortly.",
  daily_spark:
    "Today's inspiration is brewing... Trust your intuition and embrace the present.",
  default: "Connecting to cosmic energies, please try again...",
} as const;

/** Supported locales */
export const LOCALES = {
  ZH_CN: "zh-CN",
  EN_US: "en-US",
} as const;

export type RequestType = (typeof REQUEST_TYPES)[keyof typeof REQUEST_TYPES];
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type Locale = (typeof LOCALES)[keyof typeof LOCALES];
