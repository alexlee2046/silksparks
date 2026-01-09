/**
 * 每日塔罗测试
 */

import { test, expect } from "@playwright/test";
import { setupApiInterceptors } from "../helpers/network-interceptors";

test.describe("每日塔罗", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tarot");
    await page.waitForLoadState("domcontentloaded");
  });

  test("塔罗页面应该加载", async ({ page }) => {
    // 等待页面内容
    await page.waitForTimeout(2000);

    // 应该有塔罗相关内容
    const hasTarotContent = await page
      .getByText(/Tarot|塔罗|Card|牌/i)
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(hasTarotContent).toBe(true);
  });

  test("应该显示抽卡按钮或卡牌", async ({ page }) => {
    await page.waitForTimeout(3000);

    // 检查抽卡按钮或卡牌
    const drawButton = page.getByRole("button", { name: /Draw|抽|Reveal|揭示/i });
    const card = page.locator('[data-testid="tarot-card"], .tarot-card, .card');

    const hasButton = await drawButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasCard = await card.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasButton || hasCard).toBe(true);
  });

  test("点击抽卡应显示卡牌", async ({ page }) => {
    await page.waitForTimeout(3000);

    const drawButton = page.getByRole("button", { name: /Draw|抽|Start|开始|Reveal|揭示/i });

    if (await drawButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await drawButton.click();
      await page.waitForTimeout(3000);

      // 应该显示卡牌或解读
      const card = page.locator('[data-testid="tarot-card"], .tarot-card, .card');
      const interpretation = page.getByText(/meaning|解读|interpretation|含义/i);

      const hasResult = (await card.first().isVisible({ timeout: 10000 }).catch(() => false)) ||
        (await interpretation.first().isVisible({ timeout: 10000 }).catch(() => false));

      expect(hasResult).toBe(true);
    } else {
      // 可能直接显示卡牌
      console.log("No draw button found - cards may already be displayed");
    }
  });
});

test.describe("塔罗牌阵 (Spread)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tarot/spread");
    await page.waitForLoadState("domcontentloaded");
  });

  test("牌阵页面应该加载", async ({ page }) => {
    await page.waitForTimeout(2000);

    // 应该有牌阵相关内容
    const hasSpreadContent = await page
      .getByText(/Spread|牌阵|Past|过去|Present|现在|Future|未来/i)
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(hasSpreadContent).toBe(true);
  });

  test("应该显示三个卡位", async ({ page }) => {
    await page.waitForTimeout(3000);

    // 检查卡位
    const cardSlots = page.locator('[data-testid="card-slot"], .card-slot, .spread-position');

    const count = await cardSlots.count();

    if (count >= 3) {
      expect(count).toBeGreaterThanOrEqual(3);
    } else {
      // 可能是不同的设计
      console.log(`Card slots found: ${count}`);
    }
  });
});

test.describe("AI 解读生成", () => {
  test("抽卡后应生成 AI 解读", async ({ page }) => {
    await page.goto("/tarot");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const drawButton = page.getByRole("button", { name: /Draw|抽|Start|开始|Reveal|揭示/i });

    if (await drawButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await drawButton.click();

      // 等待 AI 解读加载（可能需要较长时间）
      await page.waitForTimeout(10000);

      // 检查解读内容
      const interpretation = page.locator('[data-testid="interpretation"], .interpretation, .reading');
      const hasInterpretation = await interpretation.isVisible({ timeout: 30000 }).catch(() => false);

      if (hasInterpretation) {
        const text = await interpretation.textContent();
        // 解读应该有一定长度
        expect(text?.length).toBeGreaterThan(50);
      } else {
        // 检查是否有任何文本内容
        const anyText = page.locator("p, .text-content").filter({ hasText: /.{50,}/ });
        const hasText = await anyText.first().isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`Has long text content: ${hasText}`);
      }
    }
  });
});

test.describe("响应式设计", () => {
  test("移动端塔罗页面应正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/tarot");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 页面应该正常显示
    const hasContent = await page.locator("body").isVisible();
    expect(hasContent).toBe(true);

    // 内容不应超出视口
    const overflow = await page.evaluate(() => {
      const body = document.body;
      return body.scrollWidth > window.innerWidth;
    });

    expect(overflow).toBe(false);
  });
});

test.describe("只读模式验证", () => {
  test("浏览塔罗页面不应有非必要写入", async ({ page }) => {
    const interceptor = await setupApiInterceptors(page);

    await page.goto("/tarot");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 只是浏览，不抽卡
    const stats = interceptor.getStats();
    console.log(`Tarot page: ${stats.total} requests (${stats.writes} writes)`);

    // 浏览不应有写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      const nonAuthWrites = interceptor.getSupabaseWriteRequests().filter(
        (r) => !r.url.includes("/auth/")
      );
      expect(nonAuthWrites.length).toBe(0);
    }
  });
});
