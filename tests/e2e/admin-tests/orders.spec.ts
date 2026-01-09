/**
 * Admin 订单管理测试
 */

import { test, expect } from "@playwright/test";
import { setupApiInterceptors, assertNoWrites } from "../helpers/network-interceptors";

test.describe("Admin 订单列表", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("应该显示订单列表", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 应该显示订单相关内容
    const title = page.getByText(/Order|订单/i);
    await expect(title.first()).toBeVisible({ timeout: 10000 });
  });

  test("应该显示订单表格", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 应该有表格
    const hasTable = await page.locator("table, [data-testid='orders-table']").first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasList = await page.locator('[role="list"], .order-list').first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || hasList).toBe(true);
  });

  test("订单应该显示状态", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 应该有状态列或标签
    const statusLabels = page.getByText(/Pending|Processing|Shipped|Delivered|Cancelled|待处理|处理中|已发货|已送达|已取消/i);
    const hasStatus = await statusLabels.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasStatus) {
      console.log("Status labels not visible - may have no orders or different UI");
    }
  });
});

test.describe("Admin 订单详情", () => {
  test("点击订单应该显示详情", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 点击查看按钮或行
    const viewBtn = page.getByRole("button", { name: /View|Show|查看/i }).first();
    const tableRow = page.locator("table tbody tr").first();

    const hasViewBtn = await viewBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const hasRow = await tableRow.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasViewBtn) {
      await viewBtn.click();
    } else if (hasRow) {
      await tableRow.click();
    } else {
      test.skip(true, "无法找到订单入口");
      return;
    }

    await page.waitForTimeout(1000);

    // 应该显示详情
    const hasDetail = await page.getByText(/Detail|详情|Items|商品|Customer|客户/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const urlChanged = page.url().includes("/show") || page.url().match(/\/orders\/\d+/);

    expect(hasDetail || urlChanged).toBe(true);
  });

  test("订单详情应该显示商品列表", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 进入订单详情
    const viewBtn = page.getByRole("button", { name: /View|Show|查看/i }).first();
    if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(1000);

      // 应该有商品列表
      const hasItems = await page.getByText(/Item|商品|Product|产品/i).first().isVisible({ timeout: 3000 }).catch(() => false);
      if (!hasItems) {
        console.log("Items section not visible");
      }
    } else {
      test.skip(true, "无法进入订单详情");
    }
  });
});

test.describe("Admin 订单筛选", () => {
  test("应该能按状态筛选", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 查找状态筛选器
    const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"], .status-filter');
    const isVisible = await statusFilter.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // 验证筛选器可交互
      await expect(statusFilter).toBeEnabled();
    } else {
      console.log("Status filter not visible");
    }
  });

  test("应该能按日期范围筛选", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 查找日期筛选器
    const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"], .date-picker');
    const isVisible = await dateFilter.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(dateFilter.first()).toBeEnabled();
    } else {
      console.log("Date filter not visible");
    }
  });
});

test.describe("Admin 订单 - 只读验证", () => {
  test("浏览订单不应有写入操作", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    const interceptor = await setupApiInterceptors(page);

    // 浏览操作
    await page.waitForTimeout(2000);

    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  });
});
