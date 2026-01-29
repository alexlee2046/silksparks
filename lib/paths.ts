/**
 * 路径常量
 * 使用简单字符串常量替代 Screen enum
 *
 * 用法:
 * ```ts
 * import { PATHS } from "../lib/paths";
 * import { useNavigate } from "react-router-dom";
 *
 * const navigate = useNavigate();
 * navigate(PATHS.HOROSCOPE);
 * navigate(PATHS.PRODUCT(productId));
 * ```
 */

// ============ 公开页面 ============

export const PATHS = {
  // 首页
  HOME: "/",

  // 星盘
  HOROSCOPE: "/horoscope",
  HOROSCOPE_REPORT: "/horoscope/report",
  HOROSCOPE_YEARLY: "/horoscope/yearly",

  // 塔罗
  TAROT: "/tarot",
  TAROT_SPREAD: "/tarot/spread",

  // 商店
  SHOP: "/shop",
  PRODUCT: (id: string | number) => `/shop/${id}`,

  // 专家咨询
  EXPERTS: "/experts",
  EXPERT: (id: string | number) => `/experts/${id}`,
  BOOKING: "/booking",
  BOOKING_INTAKE: "/booking/intake",
  BOOKING_DELIVERY: "/booking/delivery",

  // 用户中心
  DASHBOARD: "/dashboard",
  DASHBOARD_ARCHIVES: "/dashboard/archives",
  DASHBOARD_ORDERS: "/dashboard/orders",
  DASHBOARD_CONSULTATIONS: "/dashboard/consultations",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_FAVORITES: "/dashboard/favorites",

  // 积分与会员
  REWARDS: "/rewards",
  MEMBERSHIP: "/membership",

  // 管理后台 (legacy - 大部分已迁移到 /admin)
  MANAGE_PAYMENTS: "/manage/payments",
  MANAGE_CURRENCY: "/manage/currency",
  MANAGE_SHIPPING: "/manage/shipping",
  MANAGE_SETTINGS: "/manage/settings",

  // Refine 管理后台
  ADMIN: "/admin",

  // 法律页面
  LEGAL_PRIVACY: "/legal/privacy",
  LEGAL_TERMS: "/legal/terms",
  LEGAL_COOKIES: "/legal/cookies",
} as const;

// ============ 路由元数据 ============

export interface RouteMetadata {
  layoutType: "public" | "user" | "admin";
  requiresAuth: boolean;
  requiresAdmin: boolean;
}

/**
 * 根据路径获取路由元数据
 */
export function getRouteMetadata(pathname: string): RouteMetadata {
  // 用户中心
  if (pathname.startsWith("/dashboard")) {
    return { layoutType: "user", requiresAuth: true, requiresAdmin: false };
  }

  // 管理后台
  if (pathname.startsWith("/manage") || pathname.startsWith("/admin")) {
    return { layoutType: "admin", requiresAuth: true, requiresAdmin: true };
  }

  // 默认公开
  return { layoutType: "public", requiresAuth: false, requiresAdmin: false };
}

// ============ 辅助函数 ============

/**
 * 从路径提取 ID 参数
 */
export function extractIdFromPath(pathname: string, pattern: string): string | null {
  const regex = new RegExp(pattern.replace(":id", "([^/]+)"));
  const match = pathname.match(regex);
  return match?.[1] ?? null;
}

/**
 * 检查路径是否匹配模式
 */
export function matchPath(pathname: string, pattern: string): boolean {
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}$`);
  return regex.test(pathname);
}
