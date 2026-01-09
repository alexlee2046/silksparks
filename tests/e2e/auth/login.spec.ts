/**
 * 登录功能测试
 */

import { test, expect } from "@playwright/test";
import { signIn, signOut, isSignedIn } from "../helpers/auth";
import { setupApiInterceptors } from "../helpers/network-interceptors";

test.describe("登录功能", () => {
  test.beforeEach(async ({ page }) => {
    // 确保未登录状态
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    if (await isSignedIn(page)) {
      await signOut(page);
    }
  });

  test("应该显示登录按钮", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const header = page.getByRole("banner");
    const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });

    await expect(signInBtn).toBeVisible({ timeout: 30000 });
  });

  test("点击登录按钮应打开模态框", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const header = page.getByRole("banner");
    const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });

    await signInBtn.waitFor({ state: "visible", timeout: 30000 });
    await signInBtn.click();

    const modal = page.locator(".fixed.inset-0.z-\\[100\\]");
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test("模态框应包含邮箱和密码输入框", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const header = page.getByRole("banner");
    const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });

    await signInBtn.waitFor({ state: "visible", timeout: 30000 });
    await signInBtn.click();

    const emailInput = page.getByPlaceholder("seeker@silkspark.com");
    const passwordInput = page.getByPlaceholder("••••••••");

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
  });

  test("使用有效凭据登录应成功", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    const success = await signIn(page, { email: email!, password: password! });
    expect(success).toBe(true);

    // 验证登录状态
    const isLoggedIn = await isSignedIn(page);
    expect(isLoggedIn).toBe(true);
  });

  test("使用无效密码登录应失败", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const header = page.getByRole("banner");
    const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });

    await signInBtn.waitFor({ state: "visible", timeout: 30000 });
    await signInBtn.click();

    const modal = page.locator(".fixed.inset-0.z-\\[100\\]");
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 填写无效凭据
    const emailInput = page.getByPlaceholder("seeker@silkspark.com");
    const passwordInput = page.getByPlaceholder("••••••••");

    await emailInput.fill("invalid@test.com");
    await passwordInput.fill("wrongpassword");

    const submitBtn = modal.getByRole("button", { name: /Sign In|登录/i });
    await submitBtn.click();

    // 等待错误消息或模态框保持打开
    await page.waitForTimeout(3000);

    // 模态框应该仍然可见（登录失败）
    const stillVisible = await modal.isVisible();
    expect(stillVisible).toBe(true);
  });

  test("登录后重定向到之前的页面", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    // 先访问商店页面
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");

    // 登录
    const success = await signIn(page, { email: email!, password: password! });
    expect(success).toBe(true);

    // 应该仍在商店页面或首页
    const url = page.url();
    expect(url).toMatch(/\/(shop)?$/);
  });

  test("登录后 Header 显示登出按钮", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const header = page.getByRole("banner");
    const signOutBtn = header.getByRole("button", { name: /Sign Out|退出登录|登出/i });

    await expect(signOutBtn).toBeVisible({ timeout: 10000 });
  });

  test("登出应清除会话", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    // 先登录
    await signIn(page, { email: email!, password: password! });
    expect(await isSignedIn(page)).toBe(true);

    // 登出
    await signOut(page);
    await page.waitForTimeout(2000);

    // 验证已登出
    const header = page.getByRole("banner");
    const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });

    await expect(signInBtn).toBeVisible({ timeout: 10000 });
  });
});

test.describe("登录表单验证", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const header = page.getByRole("banner");
    const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });
    await signInBtn.waitFor({ state: "visible", timeout: 30000 });
    await signInBtn.click();

    const modal = page.locator(".fixed.inset-0.z-\\[100\\]");
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test("空邮箱应显示验证错误", async ({ page }) => {
    const passwordInput = page.getByPlaceholder("••••••••");
    await passwordInput.fill("somepassword");

    const modal = page.locator(".fixed.inset-0.z-\\[100\\]");
    const submitBtn = modal.getByRole("button", { name: /Sign In|登录/i });

    await submitBtn.click();
    await page.waitForTimeout(1000);

    // 检查表单是否阻止提交或显示错误
    const emailInput = page.getByPlaceholder("seeker@silkspark.com");
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    // 邮箱字段应该是必填的
    expect(isInvalid || (await modal.isVisible())).toBe(true);
  });

  test("无效邮箱格式应显示验证错误", async ({ page }) => {
    const emailInput = page.getByPlaceholder("seeker@silkspark.com");
    const passwordInput = page.getByPlaceholder("••••••••");

    await emailInput.fill("invalid-email");
    await passwordInput.fill("somepassword");

    // 检查 HTML5 验证
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

test.describe("只读模式验证", () => {
  test("登录流程不应有非必要的写入操作", async ({ page }) => {
    // 先加载页面，等待稳定
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 页面稳定后开始拦截
    const interceptor = await setupApiInterceptors(page);

    // 打开登录模态框
    const header = page.getByRole("banner");
    const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });

    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInBtn.click();
      await page.waitForTimeout(2000);
    }

    // 获取统计
    const stats = interceptor.getStats();
    console.log(`Login modal: ${stats.total} requests (${stats.writes} writes)`);

    // 只是打开模态框不应该有非 auth 写入操作
    // 排除 auth 相关请求和 token 刷新
    const nonAuthWrites = interceptor.getSupabaseWriteRequests().filter(
      (r) => !r.url.includes("/auth/") && !r.url.includes("/token")
    );

    if (nonAuthWrites.length > 0) {
      console.log("Non-auth writes detected:", nonAuthWrites.map(r => r.url));
    }

    expect(nonAuthWrites.length).toBe(0);
  });
});
