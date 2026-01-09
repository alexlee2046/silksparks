/**
 * 订单历史测试
 */

import { test, expect } from "@playwright/test";
import { signIn, isSignedIn } from "../helpers/auth";
import { DashboardPage } from "../helpers/page-objects";

test.describe("订单历史", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    // 登录
    await signIn(page, { email: email!, password: password! });
  });

  test("应该能访问订单页面", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该在订单页面
    expect(page.url()).toContain("/dashboard/orders");

    // 应该显示订单相关内容
    const content = page.getByText(/Order|订单|History|历史/i);
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test("应该显示订单列表或空状态", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该显示订单列表或空状态提示
    const hasOrders = await page.locator('[data-testid="order-item"], .order-item, .order-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/No orders|没有订单|empty|暂无/i).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasOrders || hasEmptyState).toBe(true);
  });

  test("订单应该显示基本信息", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const orderItem = page.locator('[data-testid="order-item"], .order-item, .order-card').first();
    const hasOrder = await orderItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasOrder) {
      test.skip(true, "没有订单数据");
      return;
    }

    // 订单应该显示日期或金额
    const hasDate = await page.getByText(/\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/i).first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasAmount = await page.getByText(/\$\d+|\d+\.\d{2}/i).first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasDate || hasAmount).toBe(true);
  });
});

test.describe("订单详情", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
  });

  test("点击订单应该显示详情", async ({ page }) => {
    await page.goto("/dashboard/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const orderItem = page.locator('[data-testid="order-item"], .order-item, .order-card').first();
    const hasOrder = await orderItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasOrder) {
      test.skip(true, "没有订单数据");
      return;
    }

    // 点击订单
    await orderItem.click();
    await page.waitForTimeout(1000);

    // 应该显示详情（可能是模态框或新页面）
    const hasDetail = await page.getByText(/Detail|详情|Items|商品/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const urlChanged = page.url().includes("/order/") || page.url().includes("orderId");
    const hasModal = await page.locator('[role="dialog"], .modal, .drawer').first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasDetail || urlChanged || hasModal).toBe(true);
  });
});

test.describe("订单页面 - 未登录", () => {
  test("未登录应该重定向到登录", async ({ page }) => {
    // 清除会话
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto("/dashboard/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该被重定向或显示登录提示
    const isRedirected = !page.url().includes("/dashboard/orders");
    const hasLoginPrompt = await page.getByText(/Sign In|Login|登录/i).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isRedirected || hasLoginPrompt).toBe(true);
  });
});
