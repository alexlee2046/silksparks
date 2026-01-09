/**
 * 购物车功能测试
 */

import { test, expect } from "@playwright/test";
import { ShopPage, CartPage } from "../helpers/page-objects";

test.describe("购物车基础功能", () => {
  let shopPage: ShopPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    cartPage = new CartPage(page);

    // 清除购物车
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });

    // 前往商店
    await shopPage.goto();
    await shopPage.waitForProducts();
  });

  test("购物车图标应该可见", async ({ page }) => {
    const cartButton = page.getByRole("banner").getByRole("button", { name: /Cart|购物车/i });
    await expect(cartButton).toBeVisible({ timeout: 10000 });
  });

  test("点击购物车图标应打开购物车抽屉", async ({ page }) => {
    await shopPage.openCart();

    // 购物车抽屉应该可见
    await cartPage.expectOpen();
  });

  test("空购物车应显示空状态", async ({ page }) => {
    await cartPage.open();
    await cartPage.expectEmpty();
  });

  test("添加商品后购物车应显示商品", async ({ page }) => {
    // 添加商品
    try {
      await shopPage.addToCart(0);
    } catch {
      // 如果直接添加失败，通过详情页添加
      await shopPage.clickProduct(0);
      await page.waitForLoadState("domcontentloaded");

      const addButton = page.getByRole("button", { name: /Add to Cart|加入购物车/i });
      await addButton.click();
    }

    await page.waitForTimeout(1000);

    // 打开购物车
    await cartPage.open();
    await cartPage.expectNotEmpty();
  });
});

test.describe("购物车商品操作", () => {
  let shopPage: ShopPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    cartPage = new CartPage(page);

    // 清除购物车并添加一个商品
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });

    await shopPage.goto();
    await shopPage.waitForProducts();

    // 添加商品
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
  });

  test("应该能增加商品数量", async ({ page }) => {
    await cartPage.open();
    await cartPage.expectNotEmpty();

    const infoBefore = await cartPage.getItemInfo(0);
    await cartPage.increaseQuantity(0);

    const infoAfter = await cartPage.getItemInfo(0);
    expect(infoAfter.quantity).toBeGreaterThan(infoBefore.quantity);
  });

  test("应该能减少商品数量", async ({ page }) => {
    await cartPage.open();
    await cartPage.expectNotEmpty();

    // 先增加到 2
    await cartPage.increaseQuantity(0);
    await page.waitForTimeout(300);

    const infoBefore = await cartPage.getItemInfo(0);
    expect(infoBefore.quantity).toBeGreaterThanOrEqual(2);

    // 减少
    await cartPage.decreaseQuantity(0);

    const infoAfter = await cartPage.getItemInfo(0);
    expect(infoAfter.quantity).toBeLessThan(infoBefore.quantity);
  });

  test("应该能删除商品", async ({ page }) => {
    await cartPage.open();
    await cartPage.expectNotEmpty();

    const countBefore = await cartPage.getItemCount();

    await cartPage.removeItem(0);
    await page.waitForTimeout(500);

    const countAfter = await cartPage.getItemCount();
    expect(countAfter).toBeLessThan(countBefore);
  });

  test("删除所有商品后应显示空状态", async ({ page }) => {
    await cartPage.open();
    await cartPage.expectNotEmpty();

    // 删除所有商品
    while ((await cartPage.getItemCount()) > 0) {
      await cartPage.removeItem(0);
      await page.waitForTimeout(300);
    }

    await cartPage.expectEmpty();
  });
});

test.describe("购物车总价", () => {
  test("总价应该正确计算", async ({ page }) => {
    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    // 清除购物车
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });

    await shopPage.goto();
    await shopPage.waitForProducts();

    // 添加商品
    await shopPage.clickProduct(0);
    await page.waitForLoadState("domcontentloaded");

    // 获取产品价格
    const priceText = await page.locator(".price, [data-testid='price']").first().textContent();
    const productPrice = parseFloat((priceText || "0").replace(/[^0-9.]/g, ""));

    const addButton = page.getByRole("button", { name: /Add to Cart|加入购物车/i });
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(1000);

      await cartPage.open();
      const total = await cartPage.getTotal();

      // 总价应该等于产品价格（数量为1）
      expect(total).toBeCloseTo(productPrice, 0);
    }
  });
});

test.describe("购物车持久化", () => {
  test("购物车应在页面刷新后保持", async ({ page }) => {
    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    // 清除购物车
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });

    await shopPage.goto();
    await shopPage.waitForProducts();

    // 添加商品
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

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 购物车应该仍有商品
    await cartPage.open();
    const count = await cartPage.getItemCount();
    expect(count).toBeGreaterThan(0);
  });

  test("购物车应存储在 localStorage", async ({ page }) => {
    const shopPage = new ShopPage(page);

    // 清除购物车
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });

    await shopPage.goto();
    await shopPage.waitForProducts();

    // 添加商品
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

    // 检查 localStorage
    const cartData = await page.evaluate(() => {
      return localStorage.getItem("silk_spark_cart");
    });

    expect(cartData).toBeTruthy();

    // 应该是有效的 JSON
    const parsed = JSON.parse(cartData!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });
});

test.describe("购物车关闭", () => {
  test("点击关闭按钮应关闭购物车", async ({ page }) => {
    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    await shopPage.goto();
    await shopPage.waitForProducts();

    await cartPage.open();
    await cartPage.expectOpen();

    await cartPage.close();
    await cartPage.expectClosed();
  });

  test("点击背景应关闭购物车", async ({ page }) => {
    const shopPage = new ShopPage(page);
    const cartPage = new CartPage(page);

    await shopPage.goto();
    await shopPage.waitForProducts();

    await cartPage.open();
    await cartPage.expectOpen();

    // 点击背景
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50, .backdrop');
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click({ position: { x: 10, y: 10 } });
      await cartPage.expectClosed();
    }
  });
});
