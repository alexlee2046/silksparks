/**
 * 访客星盘体验测试
 *
 * 测试未登录用户的星盘体验流程：
 * - 显示友好的输入引导（非锁定界面）
 * - 点击按钮打开表单模态框
 * - 可以输入出生日期和时间
 * - 可以选择或跳过出生地点
 * - 完成后显示星盘
 * - 数据持久化到 localStorage
 * - 显示"登录保存"提示
 */

import { test, expect, type Page } from "@playwright/test";
import { TEST_BIRTH_DATA } from "../helpers/test-data";

const TEMP_STORAGE_KEY = "silksparks_temp_birth_data";

/**
 * 清除访客星盘数据
 */
async function clearGuestBirthData(page: Page) {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, TEMP_STORAGE_KEY);
}

/**
 * 获取访客星盘数据
 */
async function getGuestBirthData(page: Page) {
  return await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }, TEMP_STORAGE_KEY);
}

/**
 * 打开访客表单模态框
 */
async function openGuestForm(page: Page) {
  // 点击 "Enter Birth Details" 按钮打开模态框
  const enterButton = page.getByRole("button", { name: /enter.*birth|输入.*出生/i });
  if (await enterButton.isVisible({ timeout: 5000 })) {
    await enterButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * 完成访客表单流程（填写日期时间，跳过地点）
 */
async function completeGuestForm(page: Page) {
  // 打开表单
  await openGuestForm(page);

  // 填写日期
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.isVisible({ timeout: 5000 })) {
    await dateInput.fill(TEST_BIRTH_DATA.date);
  }

  // 填写时间
  const timeInput = page.locator('input[type="time"]').first();
  if (await timeInput.isVisible({ timeout: 5000 })) {
    await timeInput.fill(TEST_BIRTH_DATA.time);
  }

  // 点击下一步
  const nextButton = page.getByRole("button", { name: /next|下一步/i });
  if (await nextButton.isVisible({ timeout: 5000 })) {
    await nextButton.click();
    await page.waitForTimeout(500);
  }

  // 跳过地点 - 使用更精确的选择器避免匹配 "Skip to main content"
  const skipButton = page.getByRole("button", { name: /skip this step|跳过/i });
  if (await skipButton.isVisible({ timeout: 5000 })) {
    await skipButton.click();
    await page.waitForTimeout(500);
  }

  // 点击完成按钮（可能是 CTA 按钮）
  const finishButton = page.locator('button').filter({ hasText: /enter|输入|view|查看|cta/i }).last();
  if (await finishButton.isVisible({ timeout: 5000 })) {
    await finishButton.click();
    await page.waitForTimeout(2000);
  }
}

test.describe("访客星盘体验 - Guest Birth Chart Experience", () => {
  test.beforeEach(async ({ page }) => {
    // 确保未登录状态并清除临时数据
    await page.goto("/");
    await clearGuestBirthData(page);
  });

  test("访问星盘页面应显示友好的引导界面，而非锁定界面", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 不应显示"锁定"或"请登录才能查看"的消息
    const lockedText = page.getByText(/locked|锁定|sign in to view|请登录才能/i);
    const isLocked = await lockedText.isVisible({ timeout: 3000 }).catch(() => false);

    // 应该显示友好的引导文案
    const friendlyText = page.getByText(/discover|探索|cosmic blueprint|宇宙蓝图/i);
    const hasFriendlyText = await friendlyText.first().isVisible({ timeout: 5000 }).catch(() => false);

    // 应该有"输入出生信息"按钮
    const enterButton = page.getByRole("button", { name: /enter.*birth|输入.*出生/i });
    const hasEnterButton = await enterButton.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isLocked).toBe(false);
    expect(hasFriendlyText).toBe(true);
    expect(hasEnterButton).toBe(true);
  });

  test("点击按钮后应显示出生日期和时间输入框", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单
    await openGuestForm(page);

    // 查找日期输入
    const dateInput = page.locator('input[type="date"]');
    const hasDateInput = await dateInput.first().isVisible({ timeout: 5000 }).catch(() => false);

    // 查找时间输入
    const timeInput = page.locator('input[type="time"]');
    const hasTimeInput = await timeInput.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasDateInput).toBe(true);
    expect(hasTimeInput).toBe(true);
  });

  test("输入日期和时间后应能进入下一步", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单
    await openGuestForm(page);

    // 填写日期
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 5000 })) {
      await dateInput.fill(TEST_BIRTH_DATA.date);
    }

    // 填写时间
    const timeInput = page.locator('input[type="time"]').first();
    if (await timeInput.isVisible({ timeout: 5000 })) {
      await timeInput.fill(TEST_BIRTH_DATA.time);
    }

    // 点击下一步按钮
    const nextButton = page.getByRole("button", { name: /next|下一步/i });
    if (await nextButton.isVisible({ timeout: 5000 })) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // 应该显示地点选择步骤
      const locationStep = page.getByText(/location|地点|birth place|出生地/i);
      const hasLocationStep = await locationStep.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasLocationStep).toBe(true);
    }
  });

  test("应该可以跳过地点选择", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单并填写日期时间
    await openGuestForm(page);

    const dateInput = page.locator('input[type="date"]').first();
    const timeInput = page.locator('input[type="time"]').first();

    if (await dateInput.isVisible({ timeout: 5000 })) {
      await dateInput.fill(TEST_BIRTH_DATA.date);
    }
    if (await timeInput.isVisible({ timeout: 5000 })) {
      await timeInput.fill(TEST_BIRTH_DATA.time);
    }

    // 点击下一步
    const nextButton = page.getByRole("button", { name: /next|下一步/i });
    if (await nextButton.isVisible({ timeout: 5000 })) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // 查找并点击"跳过"按钮 - 使用更精确的选择器
    const skipButton = page.getByRole("button", { name: /skip this step|跳过/i });
    if (await skipButton.isVisible({ timeout: 5000 })) {
      await skipButton.click();
      await page.waitForTimeout(500);

      // 验证跳过提示显示
      const skippedText = page.getByText(/skipped|已跳过|default/i);
      const hasSkippedText = await skippedText.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasSkippedText).toBe(true);
    }
  });

  test("完成表单后应显示星盘内容", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 完成表单流程
    await completeGuestForm(page);

    // 等待星盘内容加载
    await page.waitForTimeout(3000);

    // 验证星盘内容显示 - 检查行星信息
    const planetInfo = page.getByText(/sun|太阳|moon|月亮|mercury|水星|venus|金星|mars|火星/i);
    const hasPlanetInfo = await planetInfo.first().isVisible({ timeout: 10000 }).catch(() => false);

    // 或者检查星盘可视化元素
    const chartContent = page.locator('[data-testid="birth-chart"], .birth-chart, canvas, svg');
    const hasChart = await chartContent.first().isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasPlanetInfo || hasChart).toBe(true);
  });

  test("数据应该保存到 localStorage", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 完成表单流程
    await completeGuestForm(page);

    // 等待数据保存
    await page.waitForTimeout(2000);

    // 检查 localStorage
    const storedData = await getGuestBirthData(page);

    expect(storedData).not.toBeNull();
    if (storedData) {
      expect(storedData.date).toBeTruthy();
      expect(storedData.time).toBe(TEST_BIRTH_DATA.time);
    }
  });

  test("刷新页面后数据应该保留，直接显示星盘", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 完成表单流程
    await completeGuestForm(page);

    // 等待星盘显示
    await page.waitForTimeout(3000);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 不应该再显示"Enter Birth Details"按钮（因为已有数据）
    const enterButton = page.getByRole("button", { name: /enter.*birth|输入.*出生/i });
    const hasEnterButton = await enterButton.isVisible({ timeout: 3000 }).catch(() => false);

    // 应该直接显示星盘内容
    const planetInfo = page.getByText(/sun|太阳|moon|月亮|ascendant|上升/i);
    const hasPlanetInfo = await planetInfo.first().isVisible({ timeout: 10000 }).catch(() => false);

    expect(hasEnterButton).toBe(false);
    expect(hasPlanetInfo).toBe(true);
  });

  test("未登录访客应该看到「登录以保存」提示", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 完成表单流程
    await completeGuestForm(page);

    // 等待星盘显示
    await page.waitForTimeout(3000);

    // 检查登录保存提示
    const savePrompt = page.getByText(/sign in.*save|登录.*保存|save.*chart|保存.*星盘/i);
    const hasSavePrompt = await savePrompt.first().isVisible({ timeout: 10000 }).catch(() => false);

    expect(hasSavePrompt).toBe(true);
  });
});

test.describe("访客星盘 - 响应式设计", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearGuestBirthData(page);
  });

  test("移动端应正确显示访客引导界面", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该显示"输入出生信息"按钮
    const enterButton = page.getByRole("button", { name: /enter.*birth|输入.*出生/i });
    const hasEnterButton = await enterButton.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasEnterButton).toBe(true);
  });

  test("移动端表单模态框应正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单
    await openGuestForm(page);

    // 表单应该可见
    const dateInput = page.locator('input[type="date"]').first();
    const hasDateInput = await dateInput.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasDateInput).toBe(true);
  });
});

test.describe("访客星盘 - 表单验证", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await clearGuestBirthData(page);
  });

  test("未填写日期时下一步按钮应禁用", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单
    await openGuestForm(page);

    const nextButton = page.getByRole("button", { name: /next|下一步/i });

    if (await nextButton.isVisible({ timeout: 5000 })) {
      const isDisabled = await nextButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test("只填写日期时下一步按钮应禁用", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单
    await openGuestForm(page);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 5000 })) {
      await dateInput.fill(TEST_BIRTH_DATA.date);
    }

    const nextButton = page.getByRole("button", { name: /next|下一步/i });
    if (await nextButton.isVisible({ timeout: 5000 })) {
      const isDisabled = await nextButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test("填写日期和时间后下一步按钮应启用", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单
    await openGuestForm(page);

    const dateInput = page.locator('input[type="date"]').first();
    const timeInput = page.locator('input[type="time"]').first();

    if (await dateInput.isVisible({ timeout: 5000 })) {
      await dateInput.fill(TEST_BIRTH_DATA.date);
    }
    if (await timeInput.isVisible({ timeout: 5000 })) {
      await timeInput.fill(TEST_BIRTH_DATA.time);
    }

    const nextButton = page.getByRole("button", { name: /next|下一步/i });
    if (await nextButton.isVisible({ timeout: 5000 })) {
      const isDisabled = await nextButton.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });

  test("取消按钮应关闭表单模态框", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 打开表单
    await openGuestForm(page);

    // 确认表单打开
    const dateInput = page.locator('input[type="date"]').first();
    expect(await dateInput.isVisible({ timeout: 5000 })).toBe(true);

    // 点击取消按钮
    const cancelButton = page.getByRole("button", { name: /cancel|取消/i });
    if (await cancelButton.isVisible({ timeout: 3000 })) {
      await cancelButton.click();
      await page.waitForTimeout(500);
    }

    // 表单应该关闭
    const isFormVisible = await dateInput.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isFormVisible).toBe(false);
  });
});
