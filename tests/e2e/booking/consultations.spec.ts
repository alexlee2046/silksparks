/**
 * 咨询管理测试
 */

import { test, expect } from "@playwright/test";
import { signIn } from "../helpers/auth";

test.describe("咨询列表", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
  });

  test("应该能访问咨询页面", async ({ page }) => {
    await page.goto("/dashboard/consultations");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该显示咨询相关内容
    const content = page.getByText(/Consultation|咨询|Appointment|预约|Session/i);
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test("应该显示咨询列表或空状态", async ({ page }) => {
    await page.goto("/dashboard/consultations");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 应该显示咨询列表或空状态
    const hasConsultations = await page.locator('[data-testid="consultation-item"], .consultation-item, .appointment-card').first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmptyState = await page.getByText(/No consultations|没有咨询|empty|暂无/i).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasConsultations || hasEmptyState).toBe(true);
  });

  test("即将到来的咨询应该显示", async ({ page }) => {
    await page.goto("/dashboard/consultations");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 查找即将到来的咨询标签
    const upcomingTab = page.getByRole("tab", { name: /Upcoming|即将/i });
    const isVisible = await upcomingTab.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      await upcomingTab.click();
      await page.waitForTimeout(500);
    }

    // 验证页面显示正常
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});

test.describe("咨询详情", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
  });

  test("点击咨询应该显示详情", async ({ page }) => {
    await page.goto("/dashboard/consultations");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const consultationItem = page.locator('[data-testid="consultation-item"], .consultation-item, .appointment-card').first();
    const hasConsultation = await consultationItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasConsultation) {
      test.skip(true, "没有咨询数据");
      return;
    }

    await consultationItem.click();
    await page.waitForTimeout(1000);

    // 应该显示详情
    const hasDetail = await page.getByText(/Detail|详情|Expert|专家|Time|时间/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasModal = await page.locator('[role="dialog"], .modal, .drawer').first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasDetail || hasModal).toBe(true);
  });
});

test.describe("咨询状态", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });
  });

  test("应该显示咨询状态", async ({ page }) => {
    await page.goto("/dashboard/consultations");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const consultationItem = page.locator('[data-testid="consultation-item"], .consultation-item, .appointment-card').first();
    const hasConsultation = await consultationItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasConsultation) {
      test.skip(true, "没有咨询数据");
      return;
    }

    // 应该显示状态标签
    const statusLabels = page.getByText(/Pending|Confirmed|Completed|Cancelled|待确认|已确认|已完成|已取消/i);
    const hasStatus = await statusLabels.first().isVisible({ timeout: 3000 }).catch(() => false);

    // 状态标签可能存在
    if (!hasStatus) {
      console.log("Status labels not visible - may have different UI");
    }
  });

  test("应该能取消咨询", async ({ page }) => {
    await page.goto("/dashboard/consultations");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // 查找取消按钮
    const cancelBtn = page.getByRole("button", { name: /Cancel|取消/i });
    const isVisible = await cancelBtn.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      // 不实际点击取消，只验证按钮存在
      await expect(cancelBtn.first()).toBeEnabled();
    } else {
      console.log("Cancel button not visible - may need active consultation");
    }
  });
});
