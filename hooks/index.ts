// Generic Supabase query hook
export {
  useSupabaseQuery,
  invalidateQueryCache,
  invalidateQueryCachePrefix,
  clearQueryCache,
} from "./useSupabaseQuery";
export type { UseSupabaseQueryOptions, UseSupabaseQueryReturn } from "./useSupabaseQuery";

// Lazy-loading data hooks
export { useArchives, invalidateArchivesCache } from "./useArchives";
export { useOrders, invalidateOrdersCache } from "./useOrders";
export {
  useFavorites,
  invalidateFavoritesCache,
} from "./useFavorites";

// Location search
export { useLocationSearch } from "./useLocationSearch";

// Tarot tracking
export { useTarotStreak } from "./useTarotStreak";

// Responsive utilities
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmallScreen,
  useIsTouchDevice,
  usePrefersReducedMotion,
  useBreakpoint,
} from "./useMediaQuery";

// Animation utilities
export { useAnimationConfig, useAnimationsEnabled } from "./useAnimationConfig";
