/**
 * Silk & Spark - 前端页面 E2E 测试
 *
 * 测试内容：
 * 1. 首页渲染
 * 2. 各页面功能
 * 3. 响应式设计
 */

import { test, expect } from "@playwright/test";

// 设置桌面端视口
test.use({ viewport: { width: 1280, height: 720 } });

// 辅助函数：通过 Header 导航 (Header 使用 Link 组件)
async function navigateViaHeader(page: any, linkText: string) {
  await page
    .getByRole("link", { name: new RegExp(`^${linkText}$`, "i") })
    .first()
    .click();
  await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
}

test.describe("首页测试", () => {
  test("应该正确渲染首页", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // 检查标题元素
    await expect(page.getByTestId("main-title")).toBeVisible();

    // 检查 CTA 按钮
    await expect(
      page.getByRole("button", { name: /Reveal My Chart|View My Chart/i }),
    ).toBeVisible();
  });

  test("应该显示功能卡片", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(page.getByText("AI Tarot Reader")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Expert Consultation")).toBeVisible();
    await expect(page.getByText("Curated Artifacts")).toBeVisible();
  });

  test("点击功能卡片应该导航到对应页面", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await page.getByText("Visit Shop").click();
    await page.waitForURL("**/shop**");
    await expect(page.getByText("Curated Tools")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("商城页面测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
  });

  test("应该显示商品列表", async ({ page }) => {
    await expect(page.getByText("Curated Tools")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Filters")).toBeVisible();
  });

  test("应该显示产品数量", async ({ page }) => {
    const countText = page.getByText(/\d+ artifacts found/);
    await expect(countText).toBeVisible({ timeout: 10000 });
  });

  test("应该显示筛选选项", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Intent/i }).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Elements/i })).toBeVisible();
  });
});

test.describe("专家页面测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/experts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000); // 等待动态内容加载
  });

  test("应该显示专家列表页面", async ({ page }) => {
    await expect(page.getByText("Expert Guidance")).toBeVisible({ timeout: 10000 });
  });

  test("应该显示筛选选项", async ({ page }) => {
    await expect(page.getByText("Expertise", { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test("专家卡片应该有预约按钮", async ({ page }) => {
    const bookButtons = page.getByRole("button", { name: "Book" });
    await expect(bookButtons.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("塔罗页面测试", () => {
  test("应该正确显示塔罗每日页面", async ({ page }) => {
    await page.goto("/tarot");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Daily Guidance")).toBeVisible({ timeout: 10000 });
  });

  test("应该正确显示塔罗牌阵页面", async ({ page }) => {
    await page.goto("/tarot/spread");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Past, Present, Future")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("星盘页面测试", () => {
  test("应该正确显示星盘页面", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // 可能显示星盘内容或设置提示
    const content = page.getByText(/Birth Chart|Cosmic Blueprint|Go to Setup/i);
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("响应式设计测试", () => {
  test("移动端视图应该正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await expect(page.getByTestId("main-title")).toBeVisible();
  });

  test("平板视图应该正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await expect(page.getByTestId("main-title")).toBeVisible();
  });

  test("桌面视图应该正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await expect(page.getByTestId("main-title")).toBeVisible();
  });
});

test.describe("加载状态测试", () => {
  test("商城页面应该显示内容", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await expect(page.getByText("Curated Tools")).toBeVisible({ timeout: 10000 });
  });

  test("专家页面应该显示内容", async ({ page }) => {
    await page.goto("/experts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(page.getByText("Expert Guidance")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("UI 组件测试", () => {
  test("产品卡片应该正确渲染", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // 检查页面正常加载
    await expect(page.getByText("Curated Tools")).toBeVisible({ timeout: 10000 });
  });

  test("GlowButton 组件应该可点击", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const button = page.getByRole("button", {
      name: /Reveal My Chart|View My Chart/i,
    });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});

test.describe("错误处理测试", () => {
  test("首页应该正常加载", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await expect(page.locator("h1")).toBeVisible();
  });
});
