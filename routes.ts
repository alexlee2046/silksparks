/**
 * @deprecated 使用 lib/paths.ts 中的 PATHS 常量替代
 *
 * 此文件与 Screen enum 一起废弃。新代码请使用:
 * ```ts
 * import { PATHS, getRouteMetadata } from "./lib/paths";
 * import { useNavigate } from "react-router-dom";
 *
 * const navigate = useNavigate();
 * navigate(PATHS.HOROSCOPE);
 * navigate(PATHS.PRODUCT(productId));
 *
 * const meta = getRouteMetadata(pathname);
 * if (meta.requiresAuth && !session) { ... }
 * ```
 *
 * routes.ts 和 Screen enum 将在未来版本移除。
 */

import { Screen } from "./types";

export interface RouteConfig {
  path: string;
  screen: Screen;
  layoutType: "public" | "user" | "admin";
  requiresAuth: boolean;
  requiresAdmin: boolean;
}

/**
 * Screen 到 URL 路径的映射
 */
export const ROUTES: Record<Screen, RouteConfig> = {
  // 公开页面
  [Screen.HOME]: {
    path: "/",
    screen: Screen.HOME,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.BIRTH_CHART]: {
    path: "/horoscope",
    screen: Screen.BIRTH_CHART,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.REPORT]: {
    path: "/horoscope/report",
    screen: Screen.REPORT,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.TAROT_DAILY]: {
    path: "/tarot",
    screen: Screen.TAROT_DAILY,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.TAROT_SPREAD]: {
    path: "/tarot/spread",
    screen: Screen.TAROT_SPREAD,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },

  // 商店页面
  [Screen.SHOP_LIST]: {
    path: "/shop",
    screen: Screen.SHOP_LIST,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.PRODUCT_DETAIL]: {
    path: "/shop/:productId",
    screen: Screen.PRODUCT_DETAIL,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },

  // 专家咨询页面
  [Screen.EXPERTS]: {
    path: "/experts",
    screen: Screen.EXPERTS,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.EXPERT_PROFILE]: {
    path: "/experts/:expertId",
    screen: Screen.EXPERT_PROFILE,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.BOOKING]: {
    path: "/booking",
    screen: Screen.BOOKING,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.INTAKE]: {
    path: "/booking/intake",
    screen: Screen.INTAKE,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },
  [Screen.DELIVERY]: {
    path: "/booking/delivery",
    screen: Screen.DELIVERY,
    layoutType: "public",
    requiresAuth: false,
    requiresAdmin: false,
  },

  // 用户中心 (需要登录)
  [Screen.USER_DASHBOARD]: {
    path: "/dashboard",
    screen: Screen.USER_DASHBOARD,
    layoutType: "user",
    requiresAuth: true,
    requiresAdmin: false,
  },
  [Screen.ARCHIVES]: {
    path: "/dashboard/archives",
    screen: Screen.ARCHIVES,
    layoutType: "user",
    requiresAuth: true,
    requiresAdmin: false,
  },
  [Screen.ORDERS]: {
    path: "/dashboard/orders",
    screen: Screen.ORDERS,
    layoutType: "user",
    requiresAuth: true,
    requiresAdmin: false,
  },
  [Screen.CONSULTATIONS]: {
    path: "/dashboard/consultations",
    screen: Screen.CONSULTATIONS,
    layoutType: "user",
    requiresAuth: true,
    requiresAdmin: false,
  },
  [Screen.SETTINGS]: {
    path: "/dashboard/settings",
    screen: Screen.SETTINGS,
    layoutType: "user",
    requiresAuth: true,
    requiresAdmin: false,
  },
  [Screen.FAVORITES]: {
    path: "/dashboard/favorites",
    screen: Screen.FAVORITES,
    layoutType: "user",
    requiresAuth: true,
    requiresAdmin: false,
  },

  // 管理后台 (需要管理员权限)
  [Screen.ADMIN_PAYMENTS]: {
    path: "/manage/payments",
    screen: Screen.ADMIN_PAYMENTS,
    layoutType: "admin",
    requiresAuth: true,
    requiresAdmin: true,
  },
  [Screen.ADMIN_CURRENCY]: {
    path: "/manage/currency",
    screen: Screen.ADMIN_CURRENCY,
    layoutType: "admin",
    requiresAuth: true,
    requiresAdmin: true,
  },
  [Screen.ADMIN_SHIPPING]: {
    path: "/manage/shipping",
    screen: Screen.ADMIN_SHIPPING,
    layoutType: "admin",
    requiresAuth: true,
    requiresAdmin: true,
  },
  [Screen.ADMIN_SETTINGS]: {
    path: "/manage/settings",
    screen: Screen.ADMIN_SETTINGS,
    layoutType: "admin",
    requiresAuth: true,
    requiresAdmin: true,
  },
};

/**
 * 根据 Screen 获取路径
 */
export function getPathForScreen(
  screen: Screen,
  params?: Record<string, string>,
): string {
  const route = ROUTES[screen];
  let path = route.path;

  // 替换路径参数
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }

  return path;
}

/**
 * 根据路径获取 Screen (用于反向查找)
 */
export function getScreenForPath(pathname: string): Screen | null {
  // 精确匹配
  for (const [screen, config] of Object.entries(ROUTES)) {
    // 处理动态路由
    const pattern = config.path.replace(/:[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(pathname)) {
      return screen as Screen;
    }
  }
  return null;
}

/**
 * 获取路由配置
 */
export function getRouteConfig(screen: Screen): RouteConfig {
  return ROUTES[screen];
}
