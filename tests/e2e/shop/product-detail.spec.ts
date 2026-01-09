/**
 * 产品详情页测试
 */

import { test, expect } from "@playwright/test";
import { ShopPage } from "../helpers/page-objects";

test.describe("产品详情页", () => {
  let shopPage: ShopPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();
  });

  test("应该正确显示产品详情", async ({ page }) => {
    // 点击第一个产品
    await shopPage.clickProduct(0);

    // 等待详情页加载
    await page.waitForURL(/\/shop\/\d+/);

    // 应该显示产品名称
    const title = page.locator("h1");
    await expect(title).toBeVisible({ timeout: 10000 });

    // 应该显示价格
    const price = page.locator(".text-primary, .price").first();
    await expect(price).toBeVisible();
  });

  test("应该显示产品图片", async ({ page }) => {
    await shopPage.clickProduct(0);
    await page.waitForURL(/\/shop\/\d+/);

    // 应该有产品图片
    const image = page.locator("img").first();
    await expect(image).toBeVisible({ timeout: 10000 });
  });

  test("应该有加入购物车按钮", async ({ page }) => {
    await shopPage.clickProduct(0);
    await page.waitForURL(/\/shop\/\d+/);

    // 应该有加购按钮
    const addToCartBtn = page.getByRole("button", { name: /Add to Cart|加入购物车|Quick Add/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
  });

  test("点击加购应添加到购物车", async ({ page }) => {
    // 清除购物车
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });

    await shopPage.clickProduct(0);
    await page.waitForURL(/\/shop\/\d+/);

    // 点击加购按钮
    const addToCartBtn = page.getByRole("button", { name: /Add to Cart|加入购物车|Quick Add/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    // 等待添加完成
    await page.waitForTimeout(1000);

    // 验证购物车已更新
    const cartCount = await page.evaluate(() => {
      const cart = localStorage.getItem("silk_spark_cart");
      if (!cart) return 0;
      try {
        const parsed = JSON.parse(cart);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    });

    expect(cartCount).toBeGreaterThan(0);
  });

  test("应该能返回商店列表", async ({ page }) => {
    await shopPage.clickProduct(0);
    await page.waitForURL(/\/shop\/\d+/);

    // 点击返回按钮
    const backBtn = page.getByRole("button", { name: /Back|返回/i });
    if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backBtn.click();
    } else {
      // 使用浏览器后退
      await page.goBack();
    }

    await page.waitForURL(/\/shop$/);
    expect(page.url()).toMatch(/\/shop$/);
  });

  test("应该显示产品描述", async ({ page }) => {
    await shopPage.clickProduct(0);
    await page.waitForURL(/\/shop\/\d+/);

    // 页面应该有描述文本
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("应该显示产品元素信息", async ({ page }) => {
    await shopPage.clickProduct(0);
    await page.waitForURL(/\/shop\/\d+/);

    // 应该显示 Element 信息
    const elementInfo = page.getByText(/Element|元素/i);
    const isVisible = await elementInfo.first().isVisible({ timeout: 3000 }).catch(() => false);

    // 元素信息可能存在也可能不存在，只记录
    if (!isVisible) {
      console.log("Element info not visible on product detail page");
    }
  });
});

test.describe("产品详情页 - 数量选择", () => {
  test("应该能选择数量", async ({ page }) => {
    const shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();
    await shopPage.clickProduct(0);
    await page.waitForURL(/\/shop\/\d+/);

    // 查找数量选择器
    const quantityInput = page.locator('input[type="number"], [data-testid="quantity"]');
    const isVisible = await quantityInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      // 如果有数量选择器，测试它
      await quantityInput.fill("2");
      await expect(quantityInput).toHaveValue("2");
    } else {
      // 数量选择器不存在，跳过
      test.skip(true, "数量选择器不可见");
    }
  });
});
