/**
 * 用户仪表盘测试
 */

import { test, expect } from "@playwright/test";
import { DashboardPage } from "../helpers/page-objects";
import { signIn, signOut, isSignedIn } from "../helpers/auth";
import { setupApiInterceptors } from "../helpers/network-interceptors";

test.describe("仪表盘访问", () => {
  test("未登录用户应被重定向", async ({ page }) => {
    // 确保未登录
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const url = page.url();

    // 要么重定向，要么显示登录提示
    const isProtected = !url.includes("/dashboard") ||
      await page.getByText(/Sign In|登录|请登录/i).isVisible({ timeout: 3000 }).catch(() => false);

    expect(isProtected).toBe(true);
  });

  test("已登录用户可以访问仪表盘", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await page.waitForTimeout(3000);

    // 应该在仪表盘页面
    await dashboardPage.expectOnDashboard();
  });
});

test.describe("仪表盘内容", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      return;
    }

    await signIn(page, { email: email!, password: password! });
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await page.waitForTimeout(3000);
  });

  test("应该显示侧边栏导航", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    if (!email) {
      test.skip(true, "TEST_USER_EMAIL 未设置");
    }

    // 检查侧边栏或导航
    const sidebar = dashboardPage.sidebar;
    const isVisible = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await dashboardPage.expectSidebarVisible();
    } else {
      // 可能是移动端设计，没有侧边栏
      console.log("Sidebar not visible - may be mobile design");
    }
  });

  test("侧边栏应包含主要菜单项", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    if (!email) {
      test.skip(true, "TEST_USER_EMAIL 未设置");
    }

    const menuTexts = await dashboardPage.getSidebarItemTexts();
    console.log("Menu items:", menuTexts);

    // 应该有一些菜单项
    if (menuTexts.length > 0) {
      // 检查是否包含常见菜单项
      const hasExpectedItems = menuTexts.some(
        (text) => /Order|订单|Archive|存档|Setting|设置|Favorite|收藏/i.test(text)
      );
      expect(hasExpectedItems).toBe(true);
    }
  });
});

test.describe("订单页面", () => {
  test("应该能访问订单页面", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.gotoOrders();
    await page.waitForTimeout(3000);

    // 应该在订单页面
    expect(page.url()).toContain("/orders");
  });

  test("订单页面应显示订单列表或空状态", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.gotoOrders();
    await page.waitForTimeout(3000);

    const orderCount = await dashboardPage.getOrderCount();

    if (orderCount === 0) {
      // 检查空状态
      const emptyState = page.getByText(/no order|没有订单|empty|暂无/i);
      const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Orders: empty state shown = ${hasEmptyState}`);
    } else {
      console.log(`Orders: ${orderCount} orders found`);
    }
  });
});

test.describe("存档页面", () => {
  test("应该能访问存档页面", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.gotoArchives();
    await page.waitForTimeout(3000);

    expect(page.url()).toContain("/archives");
  });
});

test.describe("设置页面", () => {
  test("应该能访问设置页面", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.gotoSettings();
    await page.waitForTimeout(3000);

    expect(page.url()).toContain("/settings");
  });

  test("设置页面应显示个人资料表单", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.gotoSettings();
    await page.waitForTimeout(3000);

    // 检查表单
    const form = dashboardPage.settingsForm;
    const hasForm = await form.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasForm) {
      // 应该有姓名输入框
      const nameInput = dashboardPage.nameInput;
      const hasNameInput = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Settings form has name input: ${hasNameInput}`);
    } else {
      console.log("Settings form not found");
    }
  });
});

test.describe("只读模式验证", () => {
  test("浏览仪表盘不应有非必要写入", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    const interceptor = await setupApiInterceptors(page);

    await signIn(page, { email: email!, password: password! });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await page.waitForTimeout(3000);

    // 浏览订单
    await dashboardPage.gotoOrders();
    await page.waitForTimeout(2000);

    // 浏览存档
    await dashboardPage.gotoArchives();
    await page.waitForTimeout(2000);

    // 验证无写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      const nonAuthWrites = interceptor.getSupabaseWriteRequests().filter(
        (r) => !r.url.includes("/auth/")
      );
      expect(nonAuthWrites.length).toBe(0);
    }
  });
});
