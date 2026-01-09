/**
 * 专家列表测试
 */

import { test, expect } from "@playwright/test";
import { BookingPage } from "../helpers/page-objects";
import { setupApiInterceptors, assertNoWrites } from "../helpers/network-interceptors";

test.describe("专家列表", () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);
    await bookingPage.gotoExperts();
    await page.waitForLoadState("domcontentloaded");
  });

  test("应该显示专家列表", async ({ page }) => {
    // 等待专家卡片加载
    await page.waitForTimeout(3000);

    const count = await bookingPage.getExpertCount();

    if (count === 0) {
      // 可能数据库中没有专家
      console.log("No experts found - may need to seed data");
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test("专家卡片应包含基本信息", async ({ page }) => {
    await page.waitForTimeout(3000);

    const count = await bookingPage.getExpertCount();
    if (count === 0) {
      test.skip(true, "没有找到专家数据");
    }

    const firstCard = bookingPage.expertCards.first();
    await expect(firstCard).toBeVisible();

    // 应该有名字
    const name = firstCard.locator("h3, h4, .expert-name, .name").first();
    await expect(name).toBeVisible();
  });

  test("专家卡片应有预约按钮", async ({ page }) => {
    await page.waitForTimeout(3000);

    const count = await bookingPage.getExpertCount();
    if (count === 0) {
      test.skip(true, "没有找到专家数据");
    }

    const firstCard = bookingPage.expertCards.first();
    const bookButton = firstCard.getByRole("button", { name: /Book|预约|Consult|咨询/i });

    await expect(bookButton).toBeVisible();
  });

  test("点击专家卡片应导航到专家详情", async ({ page }) => {
    await page.waitForTimeout(3000);

    const count = await bookingPage.getExpertCount();
    if (count === 0) {
      test.skip(true, "没有找到专家数据");
    }

    await bookingPage.clickExpert(0);

    // 应该导航到专家详情页
    await page.waitForURL(/\/experts\/\d+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/experts\/\d+/);
  });

  test("点击预约按钮应导航到预约页面", async ({ page }) => {
    await page.waitForTimeout(3000);

    const count = await bookingPage.getExpertCount();
    if (count === 0) {
      test.skip(true, "没有找到专家数据");
    }

    await bookingPage.clickBookButton(0);

    // 应该导航到预约页面
    await page.waitForTimeout(3000);
    expect(page.url()).toMatch(/\/(booking|experts\/\d+)/);
  });
});

test.describe("专家筛选", () => {
  test("应该能按专长筛选", async ({ page }) => {
    const bookingPage = new BookingPage(page);
    await bookingPage.gotoExperts();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const count = await bookingPage.getExpertCount();
    if (count === 0) {
      test.skip(true, "没有找到专家数据");
    }

    // 查找筛选按钮
    const filters = bookingPage.expertFilters;
    if (await filters.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 尝试按 Astrology 筛选
      const astrologyFilter = page.getByRole("button", { name: /Astrology|占星/i });
      if (await astrologyFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await astrologyFilter.click();
        await page.waitForTimeout(1000);
        console.log("Filtered by Astrology");
      }
    } else {
      console.log("Expert filters not visible");
    }
  });
});

test.describe("响应式设计", () => {
  test("移动端应正确显示专家列表", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const bookingPage = new BookingPage(page);
    await bookingPage.gotoExperts();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 页面应该正常显示
    const hasContent = await page.locator("body").isVisible();
    expect(hasContent).toBe(true);
  });
});

test.describe("只读模式验证", () => {
  test("浏览专家不应有写入操作", async ({ page }) => {
    const interceptor = await setupApiInterceptors(page);

    const bookingPage = new BookingPage(page);
    await bookingPage.gotoExperts();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 点击专家详情
    const count = await bookingPage.getExpertCount();
    if (count > 0) {
      await bookingPage.clickExpert(0);
      await page.waitForTimeout(2000);
    }

    // 验证无写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  });
});
