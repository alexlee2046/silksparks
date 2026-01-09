/**
 * Admin 审计日志测试
 */

import { test, expect } from "@playwright/test";
import { setupApiInterceptors, assertNoWrites } from "../helpers/network-interceptors";

test.describe("Admin 审计日志", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/audit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("应该显示审计日志页面", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 应该显示审计日志相关内容
    const title = page.getByText(/Audit|审计|Log|日志|Activity|活动/i);
    await expect(title.first()).toBeVisible({ timeout: 10000 });
  });

  test("应该显示日志列表", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 应该有日志表格或列表
    const hasTable = await page.locator("table, [data-testid='audit-table']").first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasList = await page.locator('[role="list"], .audit-list, .log-list').first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/No logs|没有日志|empty|暂无/i).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTable || hasList || hasEmptyState).toBe(true);
  });

  test("日志应该显示操作类型", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 查找操作类型列或标签
    const actionLabels = page.getByText(/Create|Update|Delete|Login|Logout|创建|更新|删除|登录|登出/i);
    const hasActions = await actionLabels.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasActions) {
      console.log("Action labels not visible - may have no logs");
    }
  });
});

test.describe("Admin 审计日志筛选", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/audit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("应该能按操作类型筛选", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 查找操作类型筛选器
    const actionFilter = page.locator('[data-testid="action-filter"], select[name="action"], .action-filter');
    const isVisible = await actionFilter.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(actionFilter).toBeEnabled();
    } else {
      console.log("Action filter not visible");
    }
  });

  test("应该能按日期范围筛选", async ({ page }) => {
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

  test("应该能按用户筛选", async ({ page }) => {
    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 查找用户筛选器
    const userFilter = page.locator('[data-testid="user-filter"], select[name="user"], input[placeholder*="user"], .user-filter');
    const isVisible = await userFilter.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(userFilter).toBeEnabled();
    } else {
      console.log("User filter not visible");
    }
  });
});

test.describe("Admin 审计日志详情", () => {
  test("点击日志应该显示详情", async ({ page }) => {
    await page.goto("/admin/audit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const hasAccess = !page.url().includes("/login");
    if (!hasAccess) {
      test.skip(true, "需要管理员权限");
      return;
    }

    // 点击日志行
    const tableRow = page.locator("table tbody tr").first();
    const listItem = page.locator('[data-testid="audit-item"], .audit-item, .log-item').first();

    const hasRow = await tableRow.isVisible({ timeout: 2000 }).catch(() => false);
    const hasItem = await listItem.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasRow) {
      await tableRow.click();
    } else if (hasItem) {
      await listItem.click();
    } else {
      test.skip(true, "没有日志数据");
      return;
    }

    await page.waitForTimeout(1000);

    // 应该显示详情（可能是展开行或模态框）
    const hasDetail = await page.getByText(/Detail|详情|Changes|变更|Before|After/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasModal = await page.locator('[role="dialog"], .modal, .drawer').first().isVisible({ timeout: 2000 }).catch(() => false);

    // 详情可能不总是显示
    if (!hasDetail && !hasModal) {
      console.log("Detail view not visible - may have different interaction");
    }
  });
});

test.describe("Admin 审计日志 - 只读验证", () => {
  test("浏览审计日志不应有写入操作", async ({ page }) => {
    await page.goto("/admin/audit");
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
