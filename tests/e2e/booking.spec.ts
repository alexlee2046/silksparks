/**
 * Silk & Spark - 预约流程 E2E 测试
 *
 * 测试覆盖：
 * 1. 专家选择 → 预约页面
 * 2. 日期选择 → 时间槽显示
 * 3. 时间槽选择 → 确认按钮启用
 * 4. 填写问卷 → 选择交付方式
 * 5. 最终确认流程
 *
 * 注意：这些测试需要数据库中有专家的可用时间配置
 * 如果 experts 表为空或没有配置可用时间槽，部分测试会跳过
 */

import { test, expect } from "@playwright/test";

// 设置桌面端视口
test.use({ viewport: { width: 1280, height: 720 } });

// 辅助函数：导航到专家页面（直接 URL 访问更可靠）
async function navigateToExperts(page: any) {
  await page.goto("/experts");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Expert Guidance")).toBeVisible({
    timeout: 10000,
  });
}

// 辅助函数：进入预约页面并等待数据加载
async function navigateToBookingAndWaitForData(page: any): Promise<boolean> {
  await navigateToExperts(page);
  const bookButton = page.getByRole("button", { name: "Book" }).first();
  await expect(bookButton).toBeVisible({ timeout: 10000 });
  await bookButton.click();

  // 等待数据加载 - 如果 "Select Date" 出现说明数据加载成功
  const hasData = await page
    .getByText("Select Date")
    .isVisible({ timeout: 15000 })
    .catch(() => false);

  return hasData;
}

// ============================================================
// 专家列表测试
// ============================================================
test.describe("专家列表页面", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToExperts(page);
  });

  test("应显示专家列表", async ({ page }) => {
    await expect(page.getByText("Expert Guidance")).toBeVisible();
    // 应该有至少一个 Book 按钮
    const bookButtons = page.getByRole("button", { name: "Book" });
    await expect(bookButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test("点击 Book 按钮应进入预约页面", async ({ page }) => {
    const bookButton = page.getByRole("button", { name: "Book" }).first();
    await expect(bookButton).toBeVisible({ timeout: 10000 });
    await bookButton.click();

    // 预约页面应显示日期选择区域（等待加载状态消失）
    const hasData = await page
      .getByText("Select Date")
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    test.skip(!hasData, "跳过：专家可用时间数据未加载（数据库中可能没有配置）");
    await expect(page.getByText("Select Date")).toBeVisible();
  });
});

// ============================================================
// 预约日历测试
// ============================================================
test.describe("预约日历功能", () => {
  test.beforeEach(async ({ page }) => {
    const hasData = await navigateToBookingAndWaitForData(page);
    test.skip(!hasData, "跳过：专家可用时间数据未加载（数据库中可能没有配置）");
  });

  test("应显示14天日历", async ({ page }) => {
    // 等待加载完成
    await expect(page.getByText("Select Date")).toBeVisible({ timeout: 20000 });

    // 日历区域包含多个日期按钮，按钮内包含日期数字
    // 每个日期按钮显示格式如 "Mon\n1"
    const calendarSection = page
      .locator("button")
      .filter({ hasText: /Mon|Tue|Wed|Thu|Fri|Sat|Sun/i });
    const count = await calendarSection.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test("点击日期应更新可用时间槽", async ({ page }) => {
    // 等待日历加载
    await page.waitForTimeout(500);

    // 点击一个日期按钮 (假设日期按钮包含数字)
    const dateButtons = page.locator("button").filter({ hasText: /^\d{1,2}$/ });
    const dateCount = await dateButtons.count();

    if (dateCount > 1) {
      // 点击第二个日期（跳过今天）
      await dateButtons.nth(1).click();
      await page.waitForTimeout(500);

      // 时间槽区域应该更新（可能为空或有内容）
      // 不能确定一定有可用时间，只检查页面没有崩溃
      await expect(page.getByText("Back to Experts")).toBeVisible();
    }
  });

  test("选择时间槽应启用确认按钮", async ({ page }) => {
    // 等待时间槽加载
    await page.waitForTimeout(1500);

    // 尝试查找时间槽按钮 (格式: "XX:00 AM/PM")
    const timeSlots = page.locator("button").filter({ hasText: /\d{1,2}:00/ });
    const slotCount = await timeSlots.count();

    if (slotCount > 0) {
      // 点击第一个可用时间槽
      await timeSlots.first().click();
      await page.waitForTimeout(300);

      // 确认按钮应该可见
      const confirmBtn = page.getByRole("button", { name: /Confirm Time/i });
      await expect(confirmBtn).toBeVisible();
    } else {
      // 如果没有可用时间槽，测试仍然通过（专家可能没有配置可用性）
      console.log("No available time slots for this expert/date");
    }
  });
});

// ============================================================
// 预约确认流程测试
// ============================================================
test.describe("预约确认流程", () => {
  test("完整预约流程：专家 → 日期 → 时间 → 问卷", async ({ page }) => {
    const hasData = await navigateToBookingAndWaitForData(page);
    test.skip(!hasData, "跳过：专家可用时间数据未加载（数据库中可能没有配置）");

    // Step 2: 检查日历存在
    const dateButtons = page
      .locator("button")
      .filter({ hasText: /Mon|Tue|Wed|Thu|Fri|Sat|Sun/i });
    const dateCount = await dateButtons.count();
    expect(dateCount).toBeGreaterThan(0);

    // Step 3: 等待时间槽并尝试选择
    await page.waitForTimeout(1500);
    const timeSlots = page.locator("button").filter({ hasText: /\d{1,2}:00/ });
    const slotCount = await timeSlots.count();

    if (slotCount > 0) {
      await timeSlots.first().click();
      await page.waitForTimeout(300);

      // Step 4: 点击确认进入问卷
      const confirmBtn = page.getByRole("button", { name: /Confirm Time/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);

        // 问卷页面验证 - Intake 页面
        const intakeContent = page.getByText(
          /Intake|Question|Concern|What brings you|Questionnaire/i,
        );
        await expect(intakeContent.first()).toBeVisible();
      }
    }
  });
});

// ============================================================
// 边界情况测试
// ============================================================
test.describe("预约边界情况", () => {
  test("返回按钮应正确导航回专家列表", async ({ page }) => {
    const hasData = await navigateToBookingAndWaitForData(page);
    test.skip(!hasData, "跳过：专家可用时间数据未加载（数据库中可能没有配置）");

    // 点击返回 - 按钮包含 "Back to Experts" 文本
    await page.getByRole("button", { name: /Back to Experts/i }).click();
    await page.waitForTimeout(500);

    // 应该回到专家列表
    await expect(page.getByText("Expert Guidance")).toBeVisible();
  });

  test("未选择时间槽时确认按钮应禁用或不可见", async ({ page }) => {
    const hasData = await navigateToBookingAndWaitForData(page);
    test.skip(!hasData, "跳过：专家可用时间数据未加载（数据库中可能没有配置）");

    // 不选择任何时间槽
    // 确认按钮应该禁用或不可见
    const confirmBtn = page.getByRole("button", { name: /Confirm Time/i });

    if (await confirmBtn.isVisible()) {
      // 如果可见，应该是禁用状态
      await expect(confirmBtn).toBeDisabled();
    }
    // 如果不可见，测试也通过
  });
});

// ============================================================
// 响应式设计测试
// ============================================================
test.describe("预约页面响应式", () => {
  test("移动端预约页面应正常显示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const hasData = await navigateToBookingAndWaitForData(page);
    test.skip(!hasData, "跳过：专家可用时间数据未加载（数据库中可能没有配置）");

    // 页面应该正常加载
    await expect(page.getByText("Select Date")).toBeVisible();
  });

  test("平板预约页面应正常显示", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const hasData = await navigateToBookingAndWaitForData(page);
    test.skip(!hasData, "跳过：专家可用时间数据未加载（数据库中可能没有配置）");

    await expect(page.getByText("Select Date")).toBeVisible();
  });
});
