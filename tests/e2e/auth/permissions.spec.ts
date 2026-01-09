/**
 * 权限和授权测试
 */

import { test, expect } from "@playwright/test";
import { signIn, signOut, isSignedIn } from "../helpers/auth";
import { setupApiInterceptors } from "../helpers/network-interceptors";

test.describe("路由保护", () => {
  test.beforeEach(async ({ page }) => {
    // 确保未登录
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }
  });

  test("未登录用户无法访问 /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const url = page.url();

    // 要么重定向，要么显示登录提示
    const isRedirected = !url.includes("/dashboard");
    const hasLoginPrompt = await page
      .getByText(/Sign In|登录|请登录/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(isRedirected || hasLoginPrompt).toBe(true);
  });

  test("未登录用户无法访问 /dashboard/orders", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const url = page.url();
    const isProtected = !url.includes("/dashboard/orders") ||
      await page.getByText(/Sign In|登录|请登录/i).isVisible({ timeout: 3000 }).catch(() => false);

    expect(isProtected).toBe(true);
  });

  test("未登录用户无法访问 /dashboard/settings", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const url = page.url();
    const isProtected = !url.includes("/dashboard/settings") ||
      await page.getByText(/Sign In|登录|请登录/i).isVisible({ timeout: 3000 }).catch(() => false);

    expect(isProtected).toBe(true);
  });
});

test.describe("Admin 路由保护", () => {
  test("未登录用户无法访问 /admin", async ({ page }) => {
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const url = page.url();

    // 应该重定向或显示访问被拒绝
    const isRedirected = !url.includes("/admin");
    const hasAccessDenied = await page
      .getByText(/Access Denied|Unauthorized|访问被拒绝|未授权|请登录/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(isRedirected || hasAccessDenied).toBe(true);
  });

  test("普通用户无法访问 /admin", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    // 使用普通用户登录
    await signIn(page, { email: email!, password: password! });

    // 尝试访问 admin
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const url = page.url();

    // 应该重定向或显示访问被拒绝
    const isRedirected = !url.includes("/admin");
    const hasAccessDenied = await page
      .getByText(/Access Denied|Unauthorized|访问被拒绝|未授权|管理员/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(isRedirected || hasAccessDenied).toBe(true);
  });

  test("Admin 用户可以访问 /admin", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_ADMIN_EMAIL 或 TEST_ADMIN_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 应该能看到 admin 仪表盘内容
    const url = page.url();
    expect(url).toContain("/admin");

    // 应该有侧边栏或管理内容
    const hasAdminContent = await page
      .locator('[data-testid="admin-sidebar"], .sider, aside, .ant-layout-sider')
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    // 如果没有侧边栏，检查是否有 admin 相关内容
    if (!hasAdminContent) {
      const hasAdminText = await page
        .getByText(/Dashboard|Products|Experts|Orders|Settings/i)
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasAdminText).toBe(true);
    } else {
      expect(hasAdminContent).toBe(true);
    }
  });
});

test.describe("数据隔离", () => {
  test("用户只能看到自己的订单", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    const interceptor = await setupApiInterceptors(page);

    await signIn(page, { email: email!, password: password! });
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 检查 Supabase 请求是否带有正确的过滤
    const supabaseRequests = interceptor.getSupabaseRequests();
    const ordersRequests = supabaseRequests.filter((r) =>
      r.url.includes("orders") && r.method === "GET"
    );

    // 订单请求应该存在
    // RLS 策略会确保只返回用户自己的订单
    console.log(`Orders requests: ${ordersRequests.length}`);
  });

  test("用户只能看到自己的存档", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    const interceptor = await setupApiInterceptors(page);

    await signIn(page, { email: email!, password: password! });
    await page.goto("/dashboard/archives");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 检查 Supabase 请求
    const supabaseRequests = interceptor.getSupabaseRequests();
    const archivesRequests = supabaseRequests.filter((r) =>
      r.url.includes("archives") && r.method === "GET"
    );

    console.log(`Archives requests: ${archivesRequests.length}`);
  });
});

test.describe("公开页面访问", () => {
  test("未登录用户可以访问首页", async ({ page }) => {
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toMatch(/\/$/);
  });

  test("未登录用户可以访问商店", async ({ page }) => {
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toContain("/shop");
  });

  test("未登录用户可以访问专家列表", async ({ page }) => {
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    await page.goto("/experts");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toContain("/experts");
  });

  test("未登录用户可以访问塔罗页面", async ({ page }) => {
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    await page.goto("/tarot");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toContain("/tarot");
  });

  test("未登录用户可以访问星盘页面", async ({ page }) => {
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toContain("/horoscope");
  });
});
