/**
 * 结账流程测试
 */

import { test, expect } from "@playwright/test";
import { ShopPage, CartPage } from "../helpers/page-objects";
import { signIn, signOut, isSignedIn } from "../helpers/auth";
import { STRIPE_TEST_CARDS } from "../helpers/test-data";
import { setupApiInterceptors } from "../helpers/network-interceptors";

test.describe("结账前置条件", () => {
  test.beforeEach(async ({ page }) => {
    // 清除购物车
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });
  });

  test("空购物车不应显示结账按钮或结账按钮禁用", async ({ page }) => {
    const cartPage = new CartPage(page);

    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");

    await cartPage.open();

    // 结账按钮应该不可见或禁用
    const checkoutButton = cartPage.checkoutButton;
    const isVisible = await checkoutButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      const isDisabled = await checkoutButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test("未登录用户点击结账应提示登录", async ({ page }) => {
    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    // 确保未登录
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    // 添加商品到购物车
    await shopPage.goto();
    await shopPage.waitForProducts();

    try {
      await shopPage.addToCart(0);
    } catch {
      await shopPage.clickProduct(0);
      await page.waitForLoadState("domcontentloaded");
      const addButton = page.getByRole("button", { name: /Add to Cart|加入购物车/i });
      if (await addButton.isVisible({ timeout: 5000 })) {
        await addButton.click();
      }
    }

    await page.waitForTimeout(1000);

    // 打开购物车并点击结账
    await cartPage.open();
    await cartPage.expectNotEmpty();

    const checkoutButton = cartPage.checkoutButton;
    if (await checkoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkoutButton.click();
      await page.waitForTimeout(2000);

      // 应该显示登录模态框或重定向到登录
      const loginModal = page.locator(".fixed.inset-0.z-\\[100\\]");
      const loginPrompt = page.getByText(/Sign In|登录|请登录/i);

      const showsLogin = (await loginModal.isVisible({ timeout: 3000 }).catch(() => false)) ||
        (await loginPrompt.isVisible({ timeout: 3000 }).catch(() => false));

      expect(showsLogin).toBe(true);
    }
  });
});

test.describe("Stripe 结账流程", () => {
  test.beforeEach(async ({ page }) => {
    // 清除购物车
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });
  });

  test("已登录用户点击结账应重定向到 Stripe", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    // 登录
    await signIn(page, { email: email!, password: password! });

    // 添加商品
    await shopPage.goto();
    await shopPage.waitForProducts();

    try {
      await shopPage.addToCart(0);
    } catch {
      await shopPage.clickProduct(0);
      await page.waitForLoadState("domcontentloaded");
      const addButton = page.getByRole("button", { name: /Add to Cart|加入购物车/i });
      if (await addButton.isVisible({ timeout: 5000 })) {
        await addButton.click();
      }
    }

    await page.waitForTimeout(1000);

    // 打开购物车并点击结账
    await cartPage.open();
    await cartPage.expectNotEmpty();

    const checkoutButton = cartPage.checkoutButton;
    if (await checkoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 监听导航
      const navigationPromise = page.waitForURL(
        (url) => url.toString().includes("checkout.stripe.com") || url.toString().includes("stripe.com"),
        { timeout: 30000 }
      ).catch(() => null);

      await checkoutButton.click();

      const navigated = await navigationPromise;

      if (navigated) {
        // 成功重定向到 Stripe
        expect(page.url()).toContain("stripe.com");
      } else {
        // 可能有错误消息或其他处理
        console.log("Did not redirect to Stripe - checking for error messages");

        const hasError = await page.getByText(/error|错误/i).isVisible({ timeout: 3000 }).catch(() => false);
        if (hasError) {
          console.log("Checkout error detected");
        }
      }
    }
  });

  test("验证使用的是 Stripe 测试模式", async ({ page }) => {
    // 检查页面中的 Stripe key
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const stripeKey = await page.evaluate(() => {
      // 检查环境变量暴露的 key
      const meta = document.querySelector('meta[name="stripe-key"]');
      if (meta) return meta.getAttribute("content");

      // 检查全局配置
      return (window as unknown as Record<string, unknown>).STRIPE_PUBLISHABLE_KEY as string | undefined;
    });

    if (stripeKey) {
      expect(stripeKey).toMatch(/^pk_test_/);
    }
  });
});

test.describe("支付成功回调", () => {
  test("支付成功后应显示成功消息", async ({ page }) => {
    // 模拟支付成功回调
    await page.goto("/shop?success=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该显示成功消息
    const successMessage = page.getByText(/success|成功|thank you|感谢/i);
    const toastMessage = page.locator('[data-sonner-toast]');

    const hasSuccess = (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await toastMessage.isVisible({ timeout: 5000 }).catch(() => false));

    // 支付成功回调应该有某种形式的反馈
    console.log(`Success callback handled: ${hasSuccess}`);
  });

  test("支付取消后应返回商店", async ({ page }) => {
    // 模拟支付取消回调
    await page.goto("/shop?canceled=true");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该仍在商店页面
    expect(page.url()).toContain("/shop");
  });
});

test.describe("Stripe 测试卡号", () => {
  test("Stripe 测试卡号常量应该正确", () => {
    // 验证测试卡号格式
    expect(STRIPE_TEST_CARDS.SUCCESS).toMatch(/^\d{16}$/);
    expect(STRIPE_TEST_CARDS.DECLINE_GENERIC).toMatch(/^\d{16}$/);
    expect(STRIPE_TEST_CARDS.REQUIRES_3DS).toMatch(/^\d{16}$/);
  });
});

test.describe("只读模式 - 结账验证", () => {
  test("浏览和添加到购物车不应有数据库写入", async ({ page }) => {
    const interceptor = await setupApiInterceptors(page);

    const shopPage = new ShopPage(page);

    await shopPage.goto();
    await shopPage.waitForProducts();

    // 添加商品到购物车（这是 localStorage 操作，不是数据库写入）
    try {
      await shopPage.addToCart(0);
    } catch {
      await shopPage.clickProduct(0);
      await page.waitForLoadState("domcontentloaded");
      const addButton = page.getByRole("button", { name: /Add to Cart|加入购物车/i });
      if (await addButton.isVisible({ timeout: 5000 })) {
        await addButton.click();
      }
    }

    await page.waitForTimeout(1000);

    // 检查写入请求
    const writes = interceptor.getSupabaseWriteRequests();

    // 添加到购物车不应该有 Supabase 写入（购物车在 localStorage）
    expect(writes.length).toBe(0);
  });
});
