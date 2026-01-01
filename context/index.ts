/**
 * Context Exports
 *
 * Architecture:
 * - AuthContext: 纯认证状态 (session, signOut)
 * - ProfileContext: 用户资料 (name, email, birthData, points, tier, isAdmin)
 * - UserContext: 向后兼容包装器 (已拆分，逐步废弃)
 * - CartContext: 购物车状态
 * - ThemeContext: 主题状态
 * - LanguageContext: 语言状态
 * - PerformanceContext: 性能优化状态
 *
 * 新代码应使用 AuthContext + ProfileContext
 * 旧代码可继续使用 UserContext (向后兼容)
 */

// ============ 核心认证 ============
export { AuthProvider, useAuth, useIsAuthenticated, useUserId } from "./AuthContext";
export type { } from "./AuthContext";

// ============ 用户资料 ============
export { ProfileProvider, useProfile, useBirthData, useIsAdmin } from "./ProfileContext";
export type { UserLocation, UserBirthData, UserPreferences, Profile } from "./ProfileContext";

// ============ 向后兼容 ============
export { UserProvider, useUser } from "./UserContext";
export type {
  UserProfile,
  Order,
  ArchiveItem,
  FavoriteItem,
} from "./UserContext";

// ============ 其他 Context ============
export { CartProvider, useCart } from "./CartContext";
export { ThemeProvider, useTheme } from "./ThemeContext";
export { LanguageProvider, useLanguage } from "./LanguageContext";
export { PerformanceProvider, usePerformance } from "./PerformanceContext";
