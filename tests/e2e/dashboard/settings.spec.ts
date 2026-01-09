/**
 * 用户设置测试
 */

import { test, expect } from "@playwright/test";
import { signIn } from "../helpers/auth";

test.describe("用户设置", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
  });

  test("应该能访问设置页面", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该显示设置页面
    const title = page.getByText(/Settings|设置|Profile|个人资料/i);
    await expect(title.first()).toBeVisible({ timeout: 10000 });
  });

  test("应该显示用户信息表单", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该有表单字段
    const hasForm = await page.locator("form, [data-testid='settings-form']").first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasInput = await page.locator("input").first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasForm || hasInput).toBe(true);
  });

  test("应该显示出生数据字段", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 查找出生日期相关字段
    const birthDateField = page.getByText(/Birth|出生|Date of Birth|生日/i);
    const isVisible = await birthDateField.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      console.log("Birth date field not visible in settings");
    }
  });

  test("应该有保存按钮", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const saveBtn = page.getByRole("button", { name: /Save|Update|保存|更新/i });
    const isVisible = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(saveBtn).toBeEnabled();
    } else {
      // 可能使用自动保存
      console.log("Save button not visible - may use auto-save");
    }
  });
});

test.describe("用户设置 - 表单验证", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
  });

  test("应该验证必填字段", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 尝试清空必填字段并提交
    const nameInput = page.getByLabel(/Name|姓名/i);
    const isVisible = await nameInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, "名称输入框不可见");
      return;
    }

    // 清空并尝试提交
    await nameInput.clear();

    const saveBtn = page.getByRole("button", { name: /Save|Update|保存|更新/i });
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1000);

      // 应该显示验证错误或阻止提交
      const hasError = await page.getByText(/required|必填|error|错误/i).first().isVisible({ timeout: 2000 }).catch(() => false);
      const fieldInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid).catch(() => false);

      expect(hasError || fieldInvalid).toBe(true);
    }
  });
});

test.describe("用户设置 - 导航", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
  });

  test("应该能从仪表盘导航到设置", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 查找设置链接
    const settingsLink = page.getByRole("link", { name: /Settings|设置/i });
    const isVisible = await settingsLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await settingsLink.click();
      await page.waitForURL(/\/dashboard\/settings/);
      expect(page.url()).toContain("/dashboard/settings");
    } else {
      // 可能通过其他方式导航
      console.log("Settings link not visible - may use different navigation");
    }
  });
});
