/**
 * 会话管理测试
 */

import { test, expect } from "@playwright/test";
import { signIn, signOut, isSignedIn } from "../helpers/auth";

test.describe("会话管理", () => {
  test("会话应该持久化到 localStorage", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    // 检查 localStorage 中的 Supabase session
    const hasSession = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some((key) => key.includes("sb-") && key.includes("auth-token"));
    });

    expect(hasSession).toBe(true);
  });

  test("页面刷新后应保持登录状态", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
    expect(await isSignedIn(page)).toBe(true);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 等待 auth 状态同步
    await page.waitForTimeout(3000);

    // 应该仍然登录
    const stillSignedIn = await isSignedIn(page);
    expect(stillSignedIn).toBe(true);
  });

  test("登出应清除 localStorage 中的会话", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
    await signOut(page);

    // 等待清除完成
    await page.waitForTimeout(2000);

    // 检查 localStorage 中的 session 是否被清除
    const hasSession = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some((key) => {
        if (key.includes("sb-") && key.includes("auth-token")) {
          const value = localStorage.getItem(key);
          try {
            const parsed = JSON.parse(value || "{}");
            return !!parsed.access_token;
          } catch {
            return false;
          }
        }
        return false;
      });
    });

    expect(hasSession).toBe(false);
  });

  test("在新标签页中应保持登录状态", async ({ browser }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    // 创建第一个页面并登录
    const context = await browser.newContext();
    const page1 = await context.newPage();

    await signIn(page1, { email: email!, password: password! });
    expect(await isSignedIn(page1)).toBe(true);

    // 创建同一上下文中的新页面
    const page2 = await context.newPage();
    await page2.goto("/");
    await page2.waitForLoadState("domcontentloaded");
    await page2.waitForTimeout(3000);

    // 应该也是登录状态
    const signedInOnPage2 = await isSignedIn(page2);
    expect(signedInOnPage2).toBe(true);

    await context.close();
  });
});

test.describe("会话超时处理", () => {
  test("访问受保护页面未登录应重定向", async ({ page }) => {
    // 确保未登录
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    // 尝试访问受保护的页面
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该重定向到首页或显示登录提示
    const url = page.url();
    const isOnDashboard = url.includes("/dashboard");

    if (isOnDashboard) {
      // 如果仍在 dashboard，应该显示登录提示
      const loginPrompt = page.getByText(/Sign In|登录|请登录/i);
      const isPromptVisible = await loginPrompt.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isPromptVisible).toBe(true);
    } else {
      // 已重定向
      expect(url).not.toContain("/dashboard");
    }
  });
});

test.describe("多设备登录", () => {
  test("可以在同一浏览器的不同上下文中登录", async ({ browser }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    // 创建两个独立的上下文（模拟不同设备）
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // 在两个上下文中都登录
    const [success1, success2] = await Promise.all([
      signIn(page1, { email: email!, password: password! }),
      signIn(page2, { email: email!, password: password! }),
    ]);

    expect(success1).toBe(true);
    expect(success2).toBe(true);

    // 两个页面都应该是登录状态
    const [signedIn1, signedIn2] = await Promise.all([
      isSignedIn(page1),
      isSignedIn(page2),
    ]);

    expect(signedIn1).toBe(true);
    expect(signedIn2).toBe(true);

    await context1.close();
    await context2.close();
  });
});
