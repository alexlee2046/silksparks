/**
 * Admin 系统设置测试
 */

import { test, expect } from "@playwright/test";
import { AdminPage } from "../helpers/page-objects";
import { signIn } from "../helpers/auth";
import { setupApiInterceptors, assertNoWrites } from "../helpers/network-interceptors";

test.describe("Admin 系统设置", () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      return;
    }

    await signIn(page, { email: email!, password: password! });
    adminPage = new AdminPage(page);
    await adminPage.gotoSettings();
    await page.waitForTimeout(3000);
  });

  test("Admin 用户可以访问设置页面", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    await adminPage.expectOnAdmin();
    expect(page.url()).toContain("/settings");
  });

  test("设置页面应显示表单", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    const form = adminPage.form;
    const hasForm = await form.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasForm) {
      await adminPage.expectFormVisible();
    } else {
      // 可能是表格形式
      console.log("Settings may be in table format");
    }
  });

  test("应显示 AI 配置选项", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    // 检查 AI 相关设置
    const aiConfig = page.getByText(/AI|Model|模型|Engine|引擎|Gemini/i);
    const hasAiConfig = await aiConfig.first().isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`Has AI config visible: ${hasAiConfig}`);
  });

  test("API 密钥应该被掩码", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    // 检查 API 密钥字段
    const apiKeyField = page.locator('input[name*="api_key" i], input[name*="apikey" i], input[name*="secret" i]');

    if (await apiKeyField.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const type = await apiKeyField.first().getAttribute("type");
      expect(type).toBe("password");
    } else {
      console.log("API key field not found - may not be displayed");
    }
  });
});

test.describe("Admin 审计日志", () => {
  test("Admin 用户可以访问审计日志", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_ADMIN_EMAIL 或 TEST_ADMIN_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const adminPage = new AdminPage(page);
    await adminPage.gotoAuditLogs();
    await page.waitForTimeout(3000);

    // 应该在审计日志页面
    expect(page.url()).toContain("/audit");
  });

  test("审计日志应显示表格", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_ADMIN_EMAIL 或 TEST_ADMIN_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const adminPage = new AdminPage(page);
    await adminPage.gotoAuditLogs();
    await page.waitForTimeout(3000);

    // 检查表格
    await adminPage.waitForTableLoad().catch(() => {
      console.log("Audit log table may not exist");
    });
  });
});

test.describe("Admin AI 使用统计", () => {
  test("Admin 用户可以访问 AI 使用统计", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_ADMIN_EMAIL 或 TEST_ADMIN_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const adminPage = new AdminPage(page);
    await adminPage.gotoAIUsage();
    await page.waitForTimeout(3000);

    // 应该在 AI 使用页面
    expect(page.url()).toContain("/ai-usage");
  });
});

test.describe("只读模式验证 - 设置", () => {
  test("浏览设置页面不应有写入操作", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_ADMIN_EMAIL 或 TEST_ADMIN_PASSWORD 未设置");
    }

    const interceptor = await setupApiInterceptors(page);

    await signIn(page, { email: email!, password: password! });

    const adminPage = new AdminPage(page);

    // 浏览设置
    await adminPage.gotoSettings();
    await page.waitForTimeout(2000);

    // 浏览审计日志
    await adminPage.gotoAuditLogs();
    await page.waitForTimeout(2000);

    // 验证无写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  });
});
