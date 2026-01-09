/**
 * Stripe 测试辅助工具
 * 用于 E2E 测试中的支付流程
 */

import { Page, expect } from "@playwright/test";
import {
  STRIPE_TEST_CARDS,
  STRIPE_TEST_EXPIRY,
  STRIPE_TEST_CVC,
  STRIPE_TEST_ZIP,
} from "./test-data";

/**
 * Stripe Checkout 会话信息
 */
export interface StripeCheckoutInfo {
  sessionId: string;
  url: string;
}

/**
 * 拦截 Stripe Checkout 重定向
 * 捕获 checkout session ID 和 URL
 */
export async function interceptStripeCheckout(
  page: Page
): Promise<StripeCheckoutInfo | null> {
  return new Promise((resolve) => {
    let resolved = false;

    // 监听导航到 Stripe
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("checkout.stripe.com") && !resolved) {
        resolved = true;
        const sessionId = extractSessionId(url);
        resolve({ sessionId, url });
      }
    });

    // 超时处理
    setTimeout(() => {
      if (!resolved) {
        resolve(null);
      }
    }, 30000);
  });
}

/**
 * 从 URL 提取 Stripe session ID
 */
function extractSessionId(url: string): string {
  const match = url.match(/cs_(?:test_|live_)?[a-zA-Z0-9]+/);
  return match?.[0] || "";
}

/**
 * 在 Stripe Checkout 页面填写测试卡信息
 * 注意：这需要 Stripe Checkout 页面加载完成
 */
export async function fillStripeTestCard(
  page: Page,
  options?: {
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
    zip?: string;
    email?: string;
  }
): Promise<void> {
  const cardNumber = options?.cardNumber || STRIPE_TEST_CARDS.SUCCESS;
  const expiry = options?.expiry || STRIPE_TEST_EXPIRY.VALID;
  const cvc = options?.cvc || STRIPE_TEST_CVC;
  const zip = options?.zip || STRIPE_TEST_ZIP;

  // 等待 Stripe Checkout 页面加载
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Stripe 使用 iframe，需要特殊处理
  // 检查是否在 Stripe Checkout 页面
  const isStripeCheckout = page.url().includes("checkout.stripe.com");

  if (isStripeCheckout) {
    // 直接在 Stripe 页面填写
    await fillStripeFields(page, cardNumber, expiry, cvc, zip, options?.email);
  } else {
    // 可能是嵌入式 Elements，需要处理 iframe
    const _cardFrame = page.frameLocator('iframe[name*="__stripe"]').first();
    // 根据实际 Stripe Elements 结构填写
    console.log("Embedded Stripe Elements detected - iframe handling required", _cardFrame);
  }
}

/**
 * 在 Stripe Checkout 页面填写字段
 */
async function fillStripeFields(
  page: Page,
  cardNumber: string,
  expiry: string,
  cvc: string,
  zip: string,
  email?: string
): Promise<void> {
  // 等待表单加载
  await page.waitForSelector('[data-testid="card-tab-button"]', { timeout: 10000 }).catch(() => {
    // 可能已经在卡片选项卡
  });

  // 点击卡片支付选项（如果存在）
  const cardTab = page.locator('[data-testid="card-tab-button"]');
  if (await cardTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cardTab.click();
  }

  // 填写邮箱（如果需要）
  if (email) {
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(email);
    }
  }

  // 填写卡号
  const cardInput = page.locator('input[name="cardNumber"], input[placeholder*="card number" i]').first();
  await cardInput.waitFor({ state: "visible", timeout: 10000 });
  await cardInput.fill(cardNumber);

  // 填写有效期
  const expiryInput = page.locator('input[name="cardExpiry"], input[placeholder*="MM" i]').first();
  await expiryInput.fill(expiry);

  // 填写 CVC
  const cvcInput = page.locator('input[name="cardCvc"], input[placeholder*="CVC" i]').first();
  await cvcInput.fill(cvc);

  // 填写 ZIP（如果存在）
  const zipInput = page.locator('input[name="billingPostalCode"], input[placeholder*="ZIP" i]').first();
  if (await zipInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await zipInput.fill(zip);
  }
}

/**
 * 点击 Stripe Checkout 的支付按钮
 */
export async function submitStripePayment(page: Page): Promise<void> {
  // 查找提交按钮
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Pay"), button:has-text("支付")'
  ).first();

  await expect(submitButton).toBeEnabled({ timeout: 10000 });
  await submitButton.click();
}

/**
 * 等待 Stripe 支付完成并返回结果页面
 */
export async function waitForPaymentResult(
  page: Page,
  options?: {
    successUrl?: string;
    cancelUrl?: string;
    timeout?: number;
  }
): Promise<"success" | "cancel" | "error"> {
  const timeout = options?.timeout || 60000;
  const successPattern = options?.successUrl || /[?&]success=true/;
  const cancelPattern = options?.cancelUrl || /[?&]canceled=true/;

  try {
    await page.waitForURL(
      (url) => {
        const urlStr = url.toString();
        return (
          (typeof successPattern === "string"
            ? urlStr.includes(successPattern)
            : successPattern.test(urlStr)) ||
          (typeof cancelPattern === "string"
            ? urlStr.includes(cancelPattern)
            : cancelPattern.test(urlStr))
        );
      },
      { timeout }
    );

    const currentUrl = page.url();
    if (
      typeof successPattern === "string"
        ? currentUrl.includes(successPattern)
        : successPattern.test(currentUrl)
    ) {
      return "success";
    }
    return "cancel";
  } catch {
    return "error";
  }
}

/**
 * 验证使用的是 Stripe 测试密钥
 */
export async function verifyStripeTestMode(page: Page): Promise<boolean> {
  // 检查页面上的 Stripe 配置
  const stripeKey = await page.evaluate(() => {
    // 查找 Stripe publishable key
    const scripts = Array.from(document.querySelectorAll("script"));
    for (const script of scripts) {
      const content = script.textContent || "";
      if (content.includes("pk_test_")) {
        return true;
      }
    }
    // 检查 window 对象
    return (window as unknown as { Stripe?: { _apiKey?: string } }).Stripe?._apiKey?.startsWith("pk_test_") || false;
  });

  return stripeKey;
}

/**
 * 完整的 Stripe 测试支付流程
 */
export async function completeTestPayment(
  page: Page,
  options?: {
    cardNumber?: string;
    email?: string;
    expectSuccess?: boolean;
  }
): Promise<"success" | "cancel" | "error"> {
  const cardNumber = options?.cardNumber || STRIPE_TEST_CARDS.SUCCESS;
  const expectSuccess = options?.expectSuccess !== false;

  // 等待 Stripe Checkout 页面
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });

  // 填写卡片信息
  await fillStripeTestCard(page, {
    cardNumber,
    email: options?.email,
  });

  // 提交支付
  await submitStripePayment(page);

  // 等待结果
  const result = await waitForPaymentResult(page);

  if (expectSuccess && result !== "success") {
    console.warn(`Expected payment success but got: ${result}`);
  }

  return result;
}
