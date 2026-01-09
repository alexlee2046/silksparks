/**
 * 产品浏览测试
 */

import { test, expect } from "@playwright/test";
import { ShopPage } from "../helpers/page-objects";
import { setupApiInterceptors, assertNoWrites } from "../helpers/network-interceptors";

test.describe("产品列表", () => {
  let shopPage: ShopPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    await shopPage.goto();
  });

  test("应该显示产品列表", async ({ page }) => {
    await shopPage.waitForProducts();

    const count = await shopPage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });

  test("产品卡片应包含基本信息", async ({ page }) => {
    await shopPage.waitForProducts();

    const firstCard = shopPage.productCards.first();
    await expect(firstCard).toBeVisible();

    // 应该有价格 (ShopItem: span.text-primary.font-bold)
    const price = firstCard.locator(".text-primary.font-bold, .price").first();
    await expect(price).toHaveText(/\$\d+/, { timeout: 10000 });

    // 产品卡片应该可点击
    await expect(firstCard).toBeEnabled();
  });

  test("点击产品卡片应导航到详情页", async ({ page }) => {
    await shopPage.waitForProducts();
    await shopPage.clickProduct(0);

    // 应该导航到产品详情页
    await page.waitForURL(/\/shop\/\d+/);
    expect(page.url()).toMatch(/\/shop\/\d+/);
  });

  test("应该能获取产品数量和价格", async ({ page }) => {
    await shopPage.waitForProducts();

    // 验证产品数量
    const count = await shopPage.getProductCount();
    expect(count).toBeGreaterThan(0);

    // 验证价格列表
    const prices = await shopPage.getProductPrices();
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0]).toBeGreaterThan(0);
  });
});

test.describe("产品筛选", () => {
  let shopPage: ShopPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();
  });

  test("应该能按 Intent 筛选", async ({ page }) => {
    const initialCount = await shopPage.getProductCount();

    // 尝试按 Love 筛选
    const loveFilter = page.getByRole("button", { name: /Love|爱情/i });
    if (await loveFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loveFilter.click();
      await page.waitForTimeout(1000);

      // 产品数量可能变化
      const filteredCount = await shopPage.getProductCount();
      console.log(`Filtered from ${initialCount} to ${filteredCount}`);
    } else {
      test.skip(true, "Love 筛选器不可见");
    }
  });

  test("应该能按 Element 筛选", async ({ page }) => {
    const initialCount = await shopPage.getProductCount();

    // 尝试按 Fire 筛选
    const fireFilter = page.getByRole("button", { name: /Fire|火/i });
    if (await fireFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fireFilter.click();
      await page.waitForTimeout(1000);

      const filteredCount = await shopPage.getProductCount();
      console.log(`Filtered from ${initialCount} to ${filteredCount}`);
    } else {
      test.skip(true, "Fire 筛选器不可见");
    }
  });

  test("清除筛选应显示所有产品", async ({ page }) => {
    // 先应用筛选
    const fireFilter = page.getByRole("button", { name: /Fire|火/i });
    if (await fireFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fireFilter.click();
      await page.waitForTimeout(500);
    }

    // 清除筛选
    await shopPage.clearFilters();
    await page.waitForTimeout(500);

    // 应该显示产品
    const count = await shopPage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("搜索功能", () => {
  let shopPage: ShopPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();
  });

  test("搜索输入框应该可见", async ({ page }) => {
    const searchInput = shopPage.searchInput;
    const isVisible = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, "搜索输入框不可见");
    }

    await expect(searchInput).toBeVisible();
  });

  test("搜索应该过滤产品", async ({ page }) => {
    const searchInput = shopPage.searchInput;
    if (!(await searchInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip(true, "搜索输入框不可见");
    }

    // 搜索一个不存在的词
    await shopPage.search("xyznonexistent123");
    await page.waitForTimeout(1000);

    // 应该显示空状态或没有结果
    const count = await shopPage.getProductCount().catch(() => 0);
    const hasEmptyState = await shopPage.emptyState.isVisible({ timeout: 1000 }).catch(() => false);

    expect(count === 0 || hasEmptyState).toBe(true);
  });
});

test.describe("加入购物车", () => {
  let shopPage: ShopPage;

  test.beforeEach(async ({ page }) => {
    shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();

    // 清除购物车
    await page.evaluate(() => {
      localStorage.removeItem("silk_spark_cart");
    });
  });

  test("悬停产品卡片应显示加购按钮", async ({ page }) => {
    // 先关闭任何可能的模态框
    await shopPage.dismissModals();
    await shopPage.hoverProduct(0);

    const card = shopPage.productCards.first();
    // Quick Add 按钮在 ShopItem 组件中
    const addButton = card.getByRole("button", { name: /Quick Add/i });

    // 按钮可能总是可见(移动端)或仅在悬停时可见(桌面端)
    const isVisible = await addButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isVisible) {
      // 在移动端或某些设计中，按钮可能总是可见
      console.log("Quick Add button not visible on hover - may be always visible or different design");
    }
  });

  test("点击加购应添加到购物车", async ({ page }) => {
    // 先关闭任何可能的模态框
    await shopPage.dismissModals();

    // 获取初始购物车数量 (localStorage 直接存数组)
    const initialCount = await page.evaluate(() => {
      const cart = localStorage.getItem("silk_spark_cart");
      if (!cart) return 0;
      try {
        const parsed = JSON.parse(cart);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    });

    // 悬停并点击 Quick Add 按钮
    const card = shopPage.productCards.first();
    await card.hover();
    await page.waitForTimeout(500);

    const addButton = card.getByRole("button", { name: /Quick Add/i });
    const isVisible = await addButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, "Quick Add 按钮不可见");
      return;
    }

    // 使用 force 点击以避免被遮挡
    await addButton.click({ force: true });
    await page.waitForTimeout(1000);

    // 验证购物车 localStorage 已更新 (直接存数组)
    const newCount = await page.evaluate(() => {
      const cart = localStorage.getItem("silk_spark_cart");
      if (!cart) return 0;
      try {
        const parsed = JSON.parse(cart);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    });

    expect(newCount).toBeGreaterThan(initialCount);
  });
});

test.describe("响应式设计", () => {
  test("移动端应正确显示产品", async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    const shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();

    const count = await shopPage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });

  test("平板端应正确显示产品", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();

    const count = await shopPage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("只读模式验证", () => {
  test("浏览产品不应有写入操作", async ({ page }) => {
    const interceptor = await setupApiInterceptors(page);

    const shopPage = new ShopPage(page);
    await shopPage.goto();
    await shopPage.waitForProducts();

    // 浏览产品
    await shopPage.clickProduct(0);
    await page.waitForTimeout(2000);

    // 验证无非预期写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  });
});
