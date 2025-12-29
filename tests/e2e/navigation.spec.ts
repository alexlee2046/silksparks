/**
 * Silk & Spark - 完整导航和组件 E2E 测试
 *
 * 测试覆盖：
 * 1. Header 导航
 * 2. Footer 导航
 * 3. 首页按钮和组件
 * 4. 页面内容验证
 */

import { test, expect, Page } from "@playwright/test";

// ============================================================
// Header 导航测试
// ============================================================
test.describe("Header 导航测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("点击 Shop 应导航到商店页面", async ({ page }) => {
    await page
      .getByRole("button", { name: /^shop$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Curated Tools")).toBeVisible();
  });

  test("点击 Experts 应导航到专家页面", async ({ page }) => {
    await page
      .getByRole("button", { name: /^experts$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Expert Guidance")).toBeVisible();
  });

  test("点击 Horoscope 应导航到星盘页面", async ({ page }) => {
    await page
      .getByRole("button", { name: /^horoscope$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    // 可能显示星盘或设置提示
    const content = page.getByText(/Birth Chart|Cosmic Blueprint|Go to Setup/i);
    await expect(content.first()).toBeVisible();
  });

  test("点击 Tarot 应导航到塔罗页面", async ({ page }) => {
    await page
      .getByRole("button", { name: /^daily tarot|tarot$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Daily Guidance")).toBeVisible();
  });

  test("点击 AI Chat 应导航到塔罗牌阵页面", async ({ page }) => {
    await page
      .getByRole("button", { name: /AI Chat/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Past, Present, Future")).toBeVisible();
  });
});

// ============================================================
// Footer 导航测试
// ============================================================
test.describe("Footer 导航测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });

  test("Footer 应显示所有导航区域", async ({ page }) => {
    await expect(page.getByText("The Spark").last()).toBeVisible();
    await expect(page.getByText("The Silk").last()).toBeVisible();
    await expect(page.getByText("My Space")).toBeVisible();
    await expect(page.getByText("Newsletter")).toBeVisible();
  });

  test("点击 Birth Chart 链接应导航到星盘页面", async ({ page }) => {
    await page
      .getByRole("button", { name: /Birth Chart/i })
      .first()
      .click();
    await page.waitForTimeout(800);
    const content = page.getByText(/Birth Chart|Cosmic Blueprint|Go to Setup/i);
    await expect(content.first()).toBeVisible();
  });

  test("点击 Daily Tarot 链接应导航到塔罗页面", async ({ page }) => {
    await page
      .getByRole("button", { name: /Daily Tarot/i })
      .first()
      .click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Daily Guidance")).toBeVisible();
  });

  test("点击 Shop Artifacts 链接应导航到商店", async ({ page }) => {
    await page.getByRole("button", { name: /Shop Artifacts/i }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Curated Tools")).toBeVisible();
  });

  test("点击 Expert Guides 链接应导航到专家页面", async ({ page }) => {
    await page.getByRole("button", { name: /Expert Guides/i }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Expert Guidance")).toBeVisible();
  });
});

// ============================================================
// 首页组件和按钮测试
// ============================================================
test.describe("首页组件和按钮测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("页面应显示主标题", async ({ page }) => {
    await expect(page.getByTestId("main-title")).toBeVisible();
  });

  test("Daily Spark 区域应可见", async ({ page }) => {
    await expect(page.getByText("Daily Spark")).toBeVisible();
  });

  test("CTA 按钮应存在且可点击", async ({ page }) => {
    const ctaButton = page.getByRole("button", {
      name: /Reveal My Chart|View My Chart/i,
    });
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeEnabled();
  });

  test("点击 View Horoscope 应导航到星盘", async ({ page }) => {
    await page.getByRole("button", { name: "View Horoscope" }).click();
    await page.waitForTimeout(500);
    const content = page.getByText(/Birth Chart|Cosmic Blueprint|Go to Setup/i);
    await expect(content.first()).toBeVisible();
  });

  test("功能卡片应该可见", async ({ page }) => {
    await expect(page.getByText("AI Tarot Reader")).toBeVisible();
    await expect(page.getByText("Expert Consultation")).toBeVisible();
    await expect(page.getByText("Curated Artifacts")).toBeVisible();
  });

  test("点击 Start Reading 应导航到塔罗页面", async ({ page }) => {
    // FeatureCard 的 action 是 div 不是 button，需要点击包含该文本的卡片
    await page.getByText("Start Reading").click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Daily Guidance")).toBeVisible();
  });

  test("点击 Book Expert 应导航到专家页面", async ({ page }) => {
    await page.getByText("Book Expert").click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Expert Guidance")).toBeVisible();
  });

  test("点击 Visit Shop 应导航到商店", async ({ page }) => {
    await page.getByText("Visit Shop").click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Curated Tools")).toBeVisible();
  });
});

// ============================================================
// 商店页面测试
// ============================================================
test.describe("商店页面测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Shop" }).first().click();
    await page.waitForTimeout(1000);
  });

  test("商店页面应显示标题", async ({ page }) => {
    await expect(page.getByText("Curated Tools")).toBeVisible();
  });

  test("商店页面应显示返回按钮", async ({ page }) => {
    await expect(page.getByText("Back to Home")).toBeVisible();
  });

  test("返回按钮应导航到首页", async ({ page }) => {
    await page.getByRole("button", { name: /Back to Home/i }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("h1")).toContainText(
      /Ancient Wisdom|Digital Age/i,
    );
  });

  test("应显示筛选器", async ({ page }) => {
    await expect(page.getByText("Filters")).toBeVisible();
  });
});

// ============================================================
// 专家页面测试
// ============================================================
test.describe("专家页面测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Experts" }).first().click();
    await page.waitForTimeout(1000);
  });

  test("专家页面应显示标题", async ({ page }) => {
    await expect(page.getByText("Expert Guidance")).toBeVisible();
  });

  test("专家页面应显示返回按钮", async ({ page }) => {
    await expect(page.getByText("Back to Home")).toBeVisible();
  });

  test("返回按钮应导航到首页", async ({ page }) => {
    await page.getByRole("button", { name: /Back to Home/i }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("h1")).toContainText(
      /Ancient Wisdom|Digital Age/i,
    );
  });

  test("应显示专家筛选选项", async ({ page }) => {
    await expect(page.getByText("Expertise")).toBeVisible();
  });
});

// ============================================================
// 塔罗页面测试
// ============================================================
test.describe("塔罗页面测试", () => {
  test("塔罗每日页面应显示正确内容", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Tarot" }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Daily Guidance")).toBeVisible();
    // 页面加载成功即可
    await expect(page.locator("body")).toContainText(
      /Daily Guidance|Draw Card|Touch/i,
    );
  });

  test("塔罗每日页面返回按钮应工作", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: /^daily tarot|tarot$/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /Back/i }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("h1")).toContainText(
      /Ancient Wisdom|Digital Age/i,
    );
  });

  test("塔罗牌阵页面应显示三张牌位", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: /AI Chat/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Past, Present, Future")).toBeVisible();
  });
});

// ============================================================
// 滚动到顶部功能测试
// ============================================================
test.describe("滚动到顶部功能测试", () => {
  test("导航后页面应滚动到顶部", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 滚动到页面底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // 点 Footer 导航链接
    await page.getByRole("button", { name: /Shop Artifacts/i }).click();
    await page.waitForTimeout(1000); // 等待平滑滚动

    // 检查页面是否滚动到顶部
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});

// ============================================================
// 响应式设计测试
// ============================================================
test.describe("响应式设计测试", () => {
  test("移动端视图应正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("main-title")).toBeVisible();
  });

  test("平板视图应正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("main-title")).toBeVisible();
  });

  test("桌面视图应正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("main-title")).toBeVisible();
  });
});
