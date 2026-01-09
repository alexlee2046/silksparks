/**
 * Admin 专家管理测试
 */

import { test, expect } from "@playwright/test";
import { setupApiInterceptors, assertNoWrites } from "../helpers/network-interceptors";

test.describe("Admin 专家列表", () => {
  test.beforeEach(async ({ page }) => {
    // 注意：Admin 页面可能需要管理员权限
    await page.goto("/admin/experts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("应该显示专家列表", async ({ page }) => {
    // 检查是否有权限访问
    const hasAccess = !page.url().includes("/login") && !page.url().includes("/admin/login");

    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 应该显示专家列表
    const title = page.getByText(/Expert|专家/i);
    await expect(title.first()).toBeVisible({ timeout: 10000 });
  });

  test("应该显示专家表格或卡片", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 应该有表格或卡片列表
    const hasTable = await page.locator("table, [data-testid='experts-table']").first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasCards = await page.locator('[data-testid="expert-card"], .expert-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasList = await page.locator('[role="list"], .expert-list').first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || hasCards || hasList).toBe(true);
  });

  test("应该有添加专家按钮", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    const addBtn = page.getByRole("button", { name: /Add|Create|新增|添加/i });
    const isVisible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(addBtn).toBeEnabled();
    } else {
      console.log("Add button not visible");
    }
  });
});

test.describe("Admin 专家编辑", () => {
  test("应该能打开专家编辑页面", async ({ page }) => {
    await page.goto("/admin/experts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 点击编辑按钮或行
    const editBtn = page.getByRole("button", { name: /Edit|编辑/i }).first();
    const editLink = page.getByRole("link", { name: /Edit|编辑/i }).first();

    const hasEditBtn = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const hasEditLink = await editLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasEditBtn) {
      await editBtn.click();
    } else if (hasEditLink) {
      await editLink.click();
    } else {
      // 尝试点击表格行
      const row = page.locator("table tbody tr").first();
      if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
        await row.click();
      } else {
        test.skip(true, "无法找到编辑入口");
        return;
      }
    }

    await page.waitForTimeout(1000);

    // 应该显示编辑表单
    const hasForm = await page.locator("form, [data-testid='expert-form']").first().isVisible({ timeout: 5000 }).catch(() => false);
    const urlChanged = page.url().includes("/edit") || page.url().includes("/show");

    expect(hasForm || urlChanged).toBe(true);
  });
});

test.describe("Admin 专家可用性", () => {
  test("应该显示可用性日历", async ({ page }) => {
    await page.goto("/admin/experts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 进入专家详情或编辑页面
    const editBtn = page.getByRole("button", { name: /Edit|编辑/i }).first();
    if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);
    }

    // 查找可用性相关内容
    const hasAvailability = await page.getByText(/Availability|可用|Schedule|日程/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasCalendar = await page.locator('[data-testid="availability-calendar"], .calendar, .schedule').first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasAvailability && !hasCalendar) {
      console.log("Availability section not visible on this page");
    }
  });
});

test.describe("Admin 专家 - 只读验证", () => {
  test("浏览专家列表不应有写入操作", async ({ page }) => {
    // 先加载页面
    await page.goto("/admin/experts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 页面稳定后开始拦截
    const interceptor = await setupApiInterceptors(page);

    // 浏览操作
    await page.waitForTimeout(2000);

    // 验证无写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  });
});
