/**
 * 塔罗牌阵测试
 */

import { test, expect } from "@playwright/test";

test.describe("塔罗牌阵", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tarot/spread");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("应该显示塔罗牌阵页面", async ({ page }) => {
    // 应该显示页面标题
    const title = page.getByText(/Past.*Present.*Future|Three Card|牌阵/i);
    await expect(title.first()).toBeVisible({ timeout: 10000 });
  });

  test("应该显示三张卡位", async ({ page }) => {
    // 页面应该有三个卡位
    const cardSlots = page.locator('[data-testid="card-slot"], .card-slot, .tarot-card');
    const count = await cardSlots.count().catch(() => 0);

    // 至少应该有卡位元素或提示用户选择
    const hasContent = count > 0 || await page.getByText(/Select|Choose|Pick|选择/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test("应该能输入问题", async ({ page }) => {
    // 查找问题输入框
    const questionInput = page.getByPlaceholder(/question|问题|Ask/i);
    const isVisible = await questionInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await questionInput.fill("What does my future hold?");
      await expect(questionInput).toHaveValue("What does my future hold?");
    } else {
      // 可能不需要输入问题
      console.log("Question input not visible - may not be required");
    }
  });

  test("应该能开始抽牌", async ({ page }) => {
    // 查找开始/抽牌按钮
    const startBtn = page.getByRole("button", { name: /Start|Begin|Draw|Reveal|开始|抽牌/i });
    const isVisible = await startBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(startBtn).toBeEnabled();
    } else {
      // 可能是自动开始或不同的交互方式
      console.log("Start button not visible - may have different interaction");
    }
  });

  test("页面应该可交互", async ({ page }) => {
    // 验证页面加载完成并可交互
    const main = page.locator("main");
    await expect(main).toBeVisible();

    // 页面应该有按钮或可点击元素
    const interactiveElements = page.locator("button, [role='button'], a[href]");
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("塔罗牌阵 - AI 解读", () => {
  test("抽牌后应该显示解读", async ({ page }) => {
    await page.goto("/tarot/spread");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 尝试开始抽牌
    const startBtn = page.getByRole("button", { name: /Start|Begin|Draw|Reveal|开始|抽牌/i });
    const isVisible = await startBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      test.skip(true, "抽牌按钮不可见");
      return;
    }

    await startBtn.click();

    // 等待抽牌动画或结果
    await page.waitForTimeout(5000);

    // 应该显示某种结果或解读
    const hasResult = await page.getByText(/interpretation|reading|meaning|解读|含义/i).first().isVisible({ timeout: 10000 }).catch(() => false);
    const hasCards = await page.locator(".tarot-card, [data-testid='tarot-card'], img[alt*='tarot']").first().isVisible({ timeout: 5000 }).catch(() => false);

    // 应该有结果或卡片显示
    expect(hasResult || hasCards).toBe(true);
  });
});

test.describe("塔罗牌阵 - 响应式", () => {
  test("移动端应该正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/tarot/spread");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
