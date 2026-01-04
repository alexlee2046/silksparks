/**
 * 认证相关测试工具函数
 * 用于 E2E 测试中的登录/登出操作
 */

import { Page, expect } from "@playwright/test";
import * as dotenv from "dotenv";

// 加载测试环境变量
dotenv.config({ path: ".env.test" });

export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * 登录到应用
 * @param page Playwright Page 对象
 * @param credentials 登录凭据，不提供则使用环境变量中的测试凭据
 * @returns 是否登录成功
 */
export async function signIn(
  page: Page,
  credentials?: AuthCredentials
): Promise<boolean> {
  const email = credentials?.email || process.env.TEST_ADMIN_EMAIL || "";
  const password = credentials?.password || process.env.TEST_ADMIN_PASSWORD || "";

  if (!email || !password) {
    console.log("No credentials provided for sign in");
    return false;
  }

  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const header = page.getByRole("banner");

  // 直接等待 Sign In 或 Sign Out 按钮出现
  const signInBtn = header.getByRole("button", { name: /Sign In|登录/i });
  const signOutBtn = header.getByRole("button", { name: /Sign Out|退出登录|登出/i });

  // 等待其中一个按钮出现
  try {
    await Promise.race([
      signInBtn.waitFor({ state: "visible", timeout: 30000 }),
      signOutBtn.waitFor({ state: "visible", timeout: 30000 }),
    ]);
  } catch (e) {
    console.log("Neither Sign In nor Sign Out button found after 30s");
    return false;
  }

  // 检查是否已登录
  if (await signOutBtn.isVisible().catch(() => false)) {
    console.log("Already logged in");
    return true;
  }

  // 检查 Sign In 按钮
  if (!(await signInBtn.isVisible().catch(() => false))) {
    console.log("Could not find Sign In button");
    return false;
  }

  await signInBtn.click();

  // 等待登录模态框出现
  const modal = page.locator(".fixed.inset-0.z-\\[100\\]");
  await expect(modal).toBeVisible({ timeout: 5000 });

  // 填写凭据
  const emailInput = page.getByPlaceholder("seeker@silkspark.com");
  const passwordInput = page.getByPlaceholder("••••••••");

  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await expect(passwordInput).toBeVisible({ timeout: 5000 });

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // 提交 (支持中英文)
  const submitBtn = modal.getByRole("button", { name: /Sign In|登录/i });
  await submitBtn.click();

  // 等待登录完成 - header 中出现 Sign Out 按钮
  const signOutAfterLogin = header.getByRole("button", { name: /Sign Out|退出登录|登出/i });

  // 等待模态框关闭
  try {
    await modal.waitFor({ state: "hidden", timeout: 30000 });
  } catch (e) {
    console.log("Login timeout - modal did not close");
    return false;
  }

  // 等待 auth 状态同步和页面刷新
  await page.waitForTimeout(2000);

  // 尝试多次检查 Sign Out 按钮（最多 15 秒）
  for (let i = 0; i < 5; i++) {
    if (await signOutAfterLogin.isVisible().catch(() => false)) {
      console.log("Login successful");
      return true;
    }
    await page.waitForTimeout(3000);
  }

  console.log("Login may have failed - Sign Out button not visible after retries");
  return false;
}

/**
 * 登出
 * @param page Playwright Page 对象
 */
export async function signOut(page: Page): Promise<void> {
  const header = page.getByRole("banner");
  const signOutBtn = header.getByRole("button", { name: /Sign Out|退出登录|登出/i });
  if (await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signOutBtn.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * 检查是否已登录
 * @param page Playwright Page 对象
 * @returns 是否已登录
 */
export async function isSignedIn(page: Page): Promise<boolean> {
  const header = page.getByRole("banner");
  const signOutBtn = header.getByRole("button", { name: /Sign Out|退出登录|登出/i });
  return await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * 注册新用户 (用于测试)
 * @param page Playwright Page 对象
 * @param credentials 注册凭据
 * @returns 是否注册成功
 */
export async function signUp(
  page: Page,
  credentials: AuthCredentials
): Promise<boolean> {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const header = page.getByRole("banner");

  // 点击 Header 中的登录按钮打开模态框
  const headerSignInBtn = header.getByRole("button", { name: /Sign In|登录/i });

  // 等待按钮出现
  try {
    await headerSignInBtn.waitFor({ state: "visible", timeout: 30000 });
  } catch (e) {
    console.log("Sign In button not found after 30s");
    return false;
  }

  if (!(await headerSignInBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }

  await headerSignInBtn.click();

  // 等待登录模态框出现
  const modal = page.locator(".fixed.inset-0.z-\\[100\\]");
  await expect(modal).toBeVisible({ timeout: 5000 });

  // 切换到注册模式
  const signUpToggle = modal.getByText(/Sign Up|Create Account|注册|创建账户/i);
  if (await signUpToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signUpToggle.click();
  }

  // 填写凭据
  const emailInput = page.getByPlaceholder("seeker@silkspark.com");
  const passwordInput = page.getByPlaceholder("••••••••");

  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  // 提交
  const submitBtn = modal.getByRole("button", { name: /Sign Up|Create|注册|创建/i });
  await submitBtn.click();

  // 等待注册完成
  const signOutBtn = header.getByRole("button", { name: /Sign Out|退出登录|登出/i });
  return await signOutBtn.isVisible({ timeout: 15000 }).catch(() => false);
}
