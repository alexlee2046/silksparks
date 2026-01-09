/**
 * Playwright 自定义 Fixtures
 * 扩展基础测试，提供认证、页面对象等便捷功能
 */

import { test as base, Page } from "@playwright/test";
import { signIn, signOut, AuthCredentials } from "../helpers/auth";
import { setupApiInterceptors, assertNoWrites, ApiInterceptor } from "../helpers/network-interceptors";
import { generateTestId } from "../helpers/test-data";
import {
  ShopPage,
  CartPage,
  BookingPage,
  DashboardPage,
  AdminPage,
} from "../helpers/page-objects";

// ============ 类型定义 ============

export interface CustomFixtures {
  /** 已认证的普通用户页面 */
  authenticatedPage: Page;
  /** 已认证的管理员页面 */
  adminPage: Page;
  /** 商店页面对象 */
  shopPage: ShopPage;
  /** 购物车页面对象 */
  cartPage: CartPage;
  /** 预约页面对象 */
  bookingPage: BookingPage;
  /** 仪表盘页面对象 */
  dashboardPage: DashboardPage;
  /** 管理后台页面对象 */
  adminPageObject: AdminPage;
  /** API 拦截器 */
  apiInterceptor: ApiInterceptor;
  /** 测试运行 ID */
  testRunId: string;
}

// ============ 自定义测试 ============

export const test = base.extend<CustomFixtures>({
  /**
   * 已认证的普通用户页面
   * 使用 TEST_USER_EMAIL 和 TEST_USER_PASSWORD 登录
   */
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (email && password) {
      const success = await signIn(page, { email, password });
      if (!success) {
        console.warn("Failed to sign in test user, continuing without auth");
      }
    } else {
      console.warn("TEST_USER_EMAIL or TEST_USER_PASSWORD not set");
    }

    await use(page);

    // 清理：登出
    await signOut(page).catch(() => {});
  },

  /**
   * 已认证的管理员页面
   * 使用 TEST_ADMIN_EMAIL 和 TEST_ADMIN_PASSWORD 登录
   */
  adminPage: async ({ page }, use) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (email && password) {
      const success = await signIn(page, { email, password });
      if (!success) {
        throw new Error("Failed to sign in admin user");
      }
    } else {
      throw new Error("TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD not set");
    }

    await use(page);

    // 清理：登出
    await signOut(page).catch(() => {});
  },

  /**
   * 商店页面对象
   */
  shopPage: async ({ page }, use) => {
    const shopPage = new ShopPage(page);
    await use(shopPage);
  },

  /**
   * 购物车页面对象
   */
  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },

  /**
   * 预约页面对象
   */
  bookingPage: async ({ page }, use) => {
    const bookingPage = new BookingPage(page);
    await use(bookingPage);
  },

  /**
   * 仪表盘页面对象（已认证用户）
   */
  dashboardPage: async ({ authenticatedPage }, use) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await use(dashboardPage);
  },

  /**
   * 管理后台页面对象（已认证管理员）
   */
  adminPageObject: async ({ adminPage }, use) => {
    const adminPageObject = new AdminPage(adminPage);
    await use(adminPageObject);
  },

  /**
   * API 拦截器
   * 自动设置并在只读模式下验证无写入
   */
  apiInterceptor: async ({ page }, use) => {
    const interceptor = await setupApiInterceptors(page);
    await use(interceptor);

    // 只读模式下验证
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  },

  /**
   * 测试运行 ID
   */
  testRunId: async ({}, use) => {
    const id = generateTestId("run");
    await use(id);
  },
});

// ============ 导出 ============

export { expect } from "@playwright/test";

// ============ 辅助函数 ============

/**
 * 创建带认证的测试上下文
 */
export async function withAuth(
  page: Page,
  credentials?: AuthCredentials
): Promise<boolean> {
  return signIn(page, credentials);
}

/**
 * 创建带只读验证的测试上下文
 */
export async function withReadOnlyCheck(
  page: Page,
  testFn: (interceptor: ApiInterceptor) => Promise<void>
): Promise<void> {
  const interceptor = await setupApiInterceptors(page);

  try {
    await testFn(interceptor);
  } finally {
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  }
}

// ============ 测试钩子 ============

/**
 * 通用的 beforeEach 钩子
 */
export async function setupTest(page: Page): Promise<{
  interceptor: ApiInterceptor;
  testId: string;
}> {
  const interceptor = await setupApiInterceptors(page);
  const testId = generateTestId("test");

  return { interceptor, testId };
}

/**
 * 通用的 afterEach 钩子
 */
export async function teardownTest(
  interceptor: ApiInterceptor,
  page: Page
): Promise<void> {
  // 只读模式验证
  if (process.env.E2E_READ_ONLY_MODE === "true") {
    await assertNoWrites(interceptor);
  }

  // 打印请求统计
  const stats = interceptor.getStats();
  console.log(`API Stats: ${stats.total} requests (${stats.writes} writes, ${stats.supabase} Supabase)`);
}
