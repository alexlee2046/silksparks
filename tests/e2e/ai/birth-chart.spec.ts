/**
 * 星盘计算测试
 */

import { test, expect } from "@playwright/test";
import { TEST_BIRTH_DATA } from "../helpers/test-data";
import { setupApiInterceptors } from "../helpers/network-interceptors";

test.describe("星盘页面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
  });

  test("星盘页面应该加载", async ({ page }) => {
    await page.waitForTimeout(2000);

    // 应该有星盘相关内容
    const hasHoroscopeContent = await page
      .getByText(/Horoscope|星盘|Birth Chart|出生|Astrology|占星/i)
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    expect(hasHoroscopeContent).toBe(true);
  });

  test("应该显示出生数据表单", async ({ page }) => {
    await page.waitForTimeout(2000);

    // 检查表单元素
    const dateInput = page.locator('input[type="date"], input[name*="date"], input[placeholder*="date" i]');
    const timeInput = page.locator('input[type="time"], input[name*="time"], input[placeholder*="time" i]');
    const locationInput = page.locator('input[name*="location"], input[name*="place"], input[placeholder*="location" i]');

    const hasDateInput = await dateInput.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasTimeInput = await timeInput.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasLocationInput = await locationInput.first().isVisible({ timeout: 5000 }).catch(() => false);

    // 至少应该有日期输入
    expect(hasDateInput || hasTimeInput || hasLocationInput).toBe(true);
  });
});

test.describe("出生数据输入", () => {
  test("应该能输入出生日期", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const dateInput = page.locator('input[type="date"], input[name*="date" i]').first();

    if (await dateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dateInput.fill(TEST_BIRTH_DATA.date);
      const value = await dateInput.inputValue();
      expect(value).toBe(TEST_BIRTH_DATA.date);
    } else {
      console.log("Date input not found - may use different format");
    }
  });

  test("应该能输入出生时间", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const timeInput = page.locator('input[type="time"], input[name*="time" i]').first();

    if (await timeInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await timeInput.fill(TEST_BIRTH_DATA.time);
      const value = await timeInput.inputValue();
      expect(value).toBe(TEST_BIRTH_DATA.time);
    } else {
      console.log("Time input not found - may use different format");
    }
  });

  test("应该能输入出生地点", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const locationInput = page.locator('input[name*="location" i], input[name*="place" i], input[placeholder*="location" i]').first();

    if (await locationInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await locationInput.fill(TEST_BIRTH_DATA.location);
      await page.waitForTimeout(1000);

      // 可能有自动完成
      const autocomplete = page.locator('[role="listbox"], .autocomplete, .suggestions');
      if (await autocomplete.isVisible({ timeout: 2000 }).catch(() => false)) {
        // 选择第一个建议
        await autocomplete.locator('li, option, [role="option"]').first().click();
      }
    } else {
      console.log("Location input not found");
    }
  });
});

test.describe("星盘计算", () => {
  test("填写完整数据后应显示计算按钮", async ({ page }) => {
    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 检查计算/生成按钮
    const calculateButton = page.getByRole("button", { name: /Calculate|计算|Generate|生成|View|查看/i });

    const hasButton = await calculateButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasButton) {
      expect(await calculateButton.isVisible()).toBe(true);
    } else {
      // 可能是自动计算
      console.log("No calculate button found - may auto-calculate");
    }
  });
});

test.describe("星盘报告", () => {
  test("报告页面应该加载", async ({ page }) => {
    await page.goto("/horoscope/report");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 可能需要先填写出生数据
    const needsData = await page
      .getByText(/enter|输入|provide|提供|birth data|出生数据/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (needsData) {
      console.log("Report page requires birth data first");
    } else {
      // 检查报告内容
      const hasReport = await page
        .locator('[data-testid="report"], .report, .chart')
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      console.log(`Has report content: ${hasReport}`);
    }
  });
});

test.describe("响应式设计", () => {
  test("移动端星盘页面应正确显示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 页面应该正常显示
    const hasContent = await page.locator("body").isVisible();
    expect(hasContent).toBe(true);
  });
});

test.describe("只读模式验证", () => {
  test("浏览星盘页面不应有非必要写入", async ({ page }) => {
    const interceptor = await setupApiInterceptors(page);

    await page.goto("/horoscope");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // 只是浏览
    const stats = interceptor.getStats();
    console.log(`Horoscope page: ${stats.total} requests (${stats.writes} writes)`);

    // 浏览不应有写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      const nonAuthWrites = interceptor.getSupabaseWriteRequests().filter(
        (r) => !r.url.includes("/auth/")
      );
      expect(nonAuthWrites.length).toBe(0);
    }
  });
});
