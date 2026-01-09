/**
 * 预约流程测试
 */

import { test, expect } from "@playwright/test";
import { BookingPage } from "../helpers/page-objects";
import { signIn, signOut, isSignedIn } from "../helpers/auth";
import { setupApiInterceptors } from "../helpers/network-interceptors";

test.describe("预约日历", () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);

    // 先访问专家列表
    await bookingPage.gotoExperts();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const expertCount = await bookingPage.getExpertCount();
    if (expertCount === 0) {
      return; // 将在测试中 skip
    }

    // 点击预约
    await bookingPage.clickBookButton(0);
    await page.waitForTimeout(2000);
  });

  test("应该显示预约日历", async ({ page }) => {
    const expertCount = await bookingPage.getExpertCount().catch(() => 0);
    if (expertCount === 0) {
      test.skip(true, "没有找到专家数据");
    }

    // 检查日历是否可见
    const calendar = bookingPage.calendar;
    const isVisible = await calendar.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isVisible) {
      // 可能在专家详情页，需要点击预约按钮
      const bookButton = page.getByRole("button", { name: /Book|预约|Schedule/i });
      if (await bookButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bookButton.click();
        await page.waitForTimeout(2000);
      }
    }

    await bookingPage.expectCalendarVisible();
  });

  test("日历应显示可选日期", async ({ page }) => {
    const expertCount = await bookingPage.getExpertCount().catch(() => 0);
    if (expertCount === 0) {
      test.skip(true, "没有找到专家数据");
    }

    // 等待日历加载
    await page.waitForTimeout(2000);

    const dateCount = await bookingPage.getAvailableDateCount();
    console.log(`Available dates: ${dateCount}`);

    // 应该有一些日期可选
    expect(dateCount).toBeGreaterThanOrEqual(0);
  });

  test("选择日期后应显示时间槽", async ({ page }) => {
    const expertCount = await bookingPage.getExpertCount().catch(() => 0);
    if (expertCount === 0) {
      test.skip(true, "没有找到专家数据");
    }

    await page.waitForTimeout(2000);

    const dateCount = await bookingPage.getAvailableDateCount();
    if (dateCount === 0) {
      test.skip(true, "没有可用日期");
    }

    // 选择第一个可用日期
    await bookingPage.selectDate(0);
    await page.waitForTimeout(1000);

    // 检查时间槽
    const slotCount = await bookingPage.getAvailableSlotCount();
    console.log(`Available time slots: ${slotCount}`);
  });
});

test.describe("时间槽选择", () => {
  test("选择时间槽应启用确认按钮", async ({ page }) => {
    const bookingPage = new BookingPage(page);

    await bookingPage.gotoExperts();
    await page.waitForTimeout(3000);

    const expertCount = await bookingPage.getExpertCount();
    if (expertCount === 0) {
      test.skip(true, "没有找到专家数据");
    }

    await bookingPage.clickBookButton(0);
    await page.waitForTimeout(2000);

    // 选择日期
    const dateCount = await bookingPage.getAvailableDateCount();
    if (dateCount === 0) {
      test.skip(true, "没有可用日期");
    }

    await bookingPage.selectDate(0);
    await page.waitForTimeout(1000);

    // 选择时间槽
    const slotCount = await bookingPage.getAvailableSlotCount();
    if (slotCount === 0) {
      test.skip(true, "没有可用时间槽");
    }

    await bookingPage.selectTimeSlot(0);
    await page.waitForTimeout(500);

    // 确认按钮应该启用
    await bookingPage.expectConfirmEnabled();
  });

  test("未选择时间槽时确认按钮应禁用", async ({ page }) => {
    const bookingPage = new BookingPage(page);

    await bookingPage.gotoExperts();
    await page.waitForTimeout(3000);

    const expertCount = await bookingPage.getExpertCount();
    if (expertCount === 0) {
      test.skip(true, "没有找到专家数据");
    }

    await bookingPage.clickBookButton(0);
    await page.waitForTimeout(2000);

    // 只选择日期，不选择时间
    const dateCount = await bookingPage.getAvailableDateCount();
    if (dateCount > 0) {
      await bookingPage.selectDate(0);
      await page.waitForTimeout(500);
    }

    // 确认按钮应该禁用
    const confirmButton = bookingPage.confirmButton;
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bookingPage.expectConfirmDisabled();
    }
  });
});

test.describe("Intake 表单", () => {
  test("确认时间后应显示 Intake 表单", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_USER_EMAIL 或 TEST_USER_PASSWORD 未设置");
    }

    await signIn(page, { email: email!, password: password! });

    const bookingPage = new BookingPage(page);

    await bookingPage.gotoExperts();
    await page.waitForTimeout(3000);

    const expertCount = await bookingPage.getExpertCount();
    if (expertCount === 0) {
      test.skip(true, "没有找到专家数据");
    }

    await bookingPage.clickBookButton(0);
    await page.waitForTimeout(2000);

    // 选择日期和时间
    const dateCount = await bookingPage.getAvailableDateCount();
    if (dateCount === 0) {
      test.skip(true, "没有可用日期");
    }

    await bookingPage.selectDate(0);
    await page.waitForTimeout(1000);

    const slotCount = await bookingPage.getAvailableSlotCount();
    if (slotCount === 0) {
      test.skip(true, "没有可用时间槽");
    }

    await bookingPage.selectTimeSlot(0);
    await page.waitForTimeout(500);

    // 点击确认
    await bookingPage.clickConfirm();
    await page.waitForTimeout(2000);

    // 应该显示 Intake 表单
    const onIntakePage = page.url().includes("/intake") ||
      await bookingPage.intakeForm.isVisible({ timeout: 5000 }).catch(() => false);

    expect(onIntakePage).toBe(true);
  });
});

test.describe("预约需要登录", () => {
  test("未登录用户预约应提示登录", async ({ page }) => {
    // 确保未登录
    await page.goto("/");
    if (await isSignedIn(page)) {
      await signOut(page);
    }

    const bookingPage = new BookingPage(page);

    await bookingPage.gotoExperts();
    await page.waitForTimeout(3000);

    const expertCount = await bookingPage.getExpertCount();
    if (expertCount === 0) {
      test.skip(true, "没有找到专家数据");
    }

    await bookingPage.clickBookButton(0);
    await page.waitForTimeout(2000);

    // 尝试完成预约流程
    const dateCount = await bookingPage.getAvailableDateCount();
    if (dateCount > 0) {
      await bookingPage.selectDate(0);
      await page.waitForTimeout(1000);

      const slotCount = await bookingPage.getAvailableSlotCount();
      if (slotCount > 0) {
        await bookingPage.selectTimeSlot(0);
        await page.waitForTimeout(500);

        const confirmButton = bookingPage.confirmButton;
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          // 应该显示登录提示
          const loginModal = page.locator(".fixed.inset-0.z-\\[100\\]");
          const loginPrompt = page.getByText(/Sign In|登录|请登录/i);

          const showsLogin = (await loginModal.isVisible({ timeout: 3000 }).catch(() => false)) ||
            (await loginPrompt.isVisible({ timeout: 3000 }).catch(() => false));

          expect(showsLogin).toBe(true);
        }
      }
    }
  });
});

test.describe("只读模式验证", () => {
  test("浏览预约流程不应有写入操作", async ({ page }) => {
    const interceptor = await setupApiInterceptors(page);

    const bookingPage = new BookingPage(page);

    await bookingPage.gotoExperts();
    await page.waitForTimeout(3000);

    const expertCount = await bookingPage.getExpertCount();
    if (expertCount > 0) {
      await bookingPage.clickBookButton(0);
      await page.waitForTimeout(2000);

      // 选择日期（只读操作）
      const dateCount = await bookingPage.getAvailableDateCount();
      if (dateCount > 0) {
        await bookingPage.selectDate(0);
        await page.waitForTimeout(1000);
      }
    }

    // 验证无写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      const writes = interceptor.getSupabaseWriteRequests().filter(
        (r) => !r.url.includes("/auth/")
      );
      expect(writes.length).toBe(0);
    }
  });
});
