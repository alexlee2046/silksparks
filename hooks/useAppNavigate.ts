/**
 * 应用导航 Hook
 * 封装 react-router 的 useNavigate，提供类型安全的导航
 */

import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { Screen } from "../types";
import { getPathForScreen, getScreenForPath, getRouteConfig } from "../routes";

interface UseAppNavigateReturn {
  /** 导航到指定 Screen */
  navigateTo: (screen: Screen, params?: Record<string, string>) => void;
  /** 当前 Screen */
  currentScreen: Screen;
  /** 当前路由参数 */
  params: Record<string, string>;
  /** 当前布局类型 */
  layoutType: "public" | "user" | "admin";
  /** 返回上一页 */
  goBack: () => void;
  /** 替换当前路由 (不添加历史记录) */
  replaceTo: (screen: Screen, params?: Record<string, string>) => void;
}

export function useAppNavigate(): UseAppNavigateReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const routeParams = useParams();

  const currentScreen = useMemo(() => {
    return getScreenForPath(location.pathname) || Screen.HOME;
  }, [location.pathname]);

  const routeConfig = useMemo(() => {
    return getRouteConfig(currentScreen);
  }, [currentScreen]);

  const navigateTo = useCallback(
    (screen: Screen, params?: Record<string, string>) => {
      const path = getPathForScreen(screen, params);
      navigate(path);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  const replaceTo = useCallback(
    (screen: Screen, params?: Record<string, string>) => {
      const path = getPathForScreen(screen, params);
      navigate(path, { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate],
  );

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return {
    navigateTo,
    currentScreen,
    params: routeParams as Record<string, string>,
    layoutType: routeConfig.layoutType,
    goBack,
    replaceTo,
  };
}

/**
 * 兼容层：将 setScreen 风格的调用转换为路由导航
 * 用于逐步迁移现有组件
 */
export function useScreenNavigation() {
  const { navigateTo, currentScreen } = useAppNavigate();

  const setScreen = useCallback(
    (screen: Screen) => {
      navigateTo(screen);
    },
    [navigateTo],
  );

  return {
    currentScreen,
    setScreen,
  };
}
