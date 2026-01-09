/**
 * 预约页面对象
 * 处理专家预约流程的交互
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./common";

export class BookingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============ 专家列表页定位器 ============

  /** 专家卡片列表 */
  get expertCards(): Locator {
    return this.page.locator('[data-testid="expert-card"], .expert-card');
  }

  /** 专家筛选器 */
  get expertFilters(): Locator {
    return this.page.locator('[data-testid="expert-filters"], .expert-filters');
  }

  // ============ 预约页定位器 ============

  /** 日历容器 */
  get calendar(): Locator {
    return this.page.locator('[data-testid="booking-calendar"], .booking-calendar, .calendar');
  }

  /** 日期按钮 */
  get dateButtons(): Locator {
    return this.calendar.locator('button[data-date], .date-button, .day-button');
  }

  /** 选中的日期 */
  get selectedDate(): Locator {
    return this.calendar.locator('[data-selected="true"], .selected, [aria-selected="true"]');
  }

  /** 时间槽列表 */
  get timeSlots(): Locator {
    return this.page.locator('[data-testid="time-slot"], .time-slot');
  }

  /** 选中的时间槽 */
  get selectedTimeSlot(): Locator {
    return this.timeSlots.filter({ has: this.page.locator('[data-selected="true"], .selected') });
  }

  /** 确认按钮 */
  get confirmButton(): Locator {
    return this.page.getByRole("button", { name: /Confirm|确认|Continue|继续/i });
  }

  /** 返回按钮 */
  get backButton(): Locator {
    return this.page.getByRole("button", { name: /Back|返回/i });
  }

  // ============ Intake 页定位器 ============

  /** Intake 表单 */
  get intakeForm(): Locator {
    return this.page.locator('[data-testid="intake-form"], form');
  }

  /** 问题列表 */
  get questions(): Locator {
    return this.intakeForm.locator('[data-testid="question"], .question, .form-group');
  }

  /** 提交 Intake 按钮 */
  get submitIntakeButton(): Locator {
    return this.page.getByRole("button", { name: /Submit|提交|Next|下一步/i });
  }

  // ============ Delivery 页定位器 ============

  /** 配送选项 */
  get deliveryOptions(): Locator {
    return this.page.locator('[data-testid="delivery-option"], .delivery-option');
  }

  /** 确认预约按钮 */
  get confirmBookingButton(): Locator {
    return this.page.getByRole("button", { name: /Book|预约|Confirm|确认/i });
  }

  // ============ 导航方法 ============

  /**
   * 导航到专家列表
   */
  async gotoExperts(): Promise<void> {
    await super.goto("/experts");
  }

  /**
   * 导航到预约页面
   */
  async gotoBooking(): Promise<void> {
    await super.goto("/booking");
  }

  // ============ 专家列表操作 ============

  /**
   * 获取专家数量
   */
  async getExpertCount(): Promise<number> {
    return this.expertCards.count();
  }

  /**
   * 点击专家卡片
   */
  async clickExpert(index: number = 0): Promise<void> {
    await this.expertCards.nth(index).click();
    await this.waitForPageLoad();
  }

  /**
   * 通过名称点击专家
   */
  async clickExpertByName(name: string): Promise<void> {
    await this.expertCards.filter({ hasText: name }).first().click();
    await this.waitForPageLoad();
  }

  /**
   * 点击专家的预约按钮
   */
  async clickBookButton(index: number = 0): Promise<void> {
    const card = this.expertCards.nth(index);
    await card.getByRole("button", { name: /Book|预约/i }).click();
    await this.waitForPageLoad();
  }

  /**
   * 按专长筛选专家
   */
  async filterBySpecialty(specialty: string): Promise<void> {
    const filter = this.expertFilters.getByRole("button", { name: new RegExp(specialty, "i") });
    await filter.click();
    await this.page.waitForTimeout(500);
  }

  // ============ 日历操作 ============

  /**
   * 获取可用日期数量
   */
  async getAvailableDateCount(): Promise<number> {
    const enabledDates = this.dateButtons.filter({
      has: this.page.locator(':not([disabled])'),
    });
    return enabledDates.count();
  }

  /**
   * 选择日期（按索引）
   */
  async selectDate(index: number = 0): Promise<void> {
    const enabledDates = this.dateButtons.filter({
      has: this.page.locator(':not([disabled])'),
    });
    await enabledDates.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 选择指定日期
   */
  async selectDateByValue(date: string): Promise<void> {
    const dateButton = this.dateButtons.filter({
      has: this.page.locator(`[data-date="${date}"]`),
    });
    await dateButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 获取选中的日期
   */
  async getSelectedDate(): Promise<string | null> {
    const selected = this.selectedDate;
    if (await selected.isVisible({ timeout: 500 }).catch(() => false)) {
      return selected.getAttribute("data-date");
    }
    return null;
  }

  // ============ 时间槽操作 ============

  /**
   * 获取可用时间槽数量
   */
  async getAvailableSlotCount(): Promise<number> {
    return this.timeSlots.count();
  }

  /**
   * 选择时间槽（按索引）
   */
  async selectTimeSlot(index: number = 0): Promise<void> {
    await this.timeSlots.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 选择指定时间槽
   */
  async selectTimeSlotByTime(time: string): Promise<void> {
    const slot = this.timeSlots.filter({ hasText: time });
    await slot.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 获取选中的时间
   */
  async getSelectedTime(): Promise<string | null> {
    const selected = this.selectedTimeSlot;
    if (await selected.isVisible({ timeout: 500 }).catch(() => false)) {
      return selected.textContent();
    }
    return null;
  }

  /**
   * 点击确认按钮
   */
  async clickConfirm(): Promise<void> {
    await expect(this.confirmButton).toBeEnabled({ timeout: 5000 });
    await this.confirmButton.click();
    await this.waitForPageLoad();
  }

  // ============ Intake 表单操作 ============

  /**
   * 填写 Intake 表单
   */
  async fillIntakeForm(answers: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(answers)) {
      const input = this.intakeForm.locator(`[name="${key}"], [data-testid="${key}"]`);

      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

        if (tagName === "textarea") {
          await input.fill(value);
        } else if (tagName === "select") {
          await input.selectOption(value);
        } else {
          await input.fill(value);
        }
      }
    }
  }

  /**
   * 填写文本区域问题
   */
  async fillQuestion(index: number, answer: string): Promise<void> {
    const question = this.questions.nth(index);
    const textarea = question.locator("textarea");
    const input = question.locator("input");

    if (await textarea.isVisible({ timeout: 500 }).catch(() => false)) {
      await textarea.fill(answer);
    } else if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill(answer);
    }
  }

  /**
   * 提交 Intake 表单
   */
  async submitIntake(): Promise<void> {
    await this.submitIntakeButton.click();
    await this.waitForPageLoad();
  }

  // ============ Delivery 操作 ============

  /**
   * 选择配送选项
   */
  async selectDeliveryOption(index: number = 0): Promise<void> {
    await this.deliveryOptions.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 确认预约
   */
  async confirmBooking(): Promise<void> {
    await expect(this.confirmBookingButton).toBeEnabled({ timeout: 5000 });
    await this.confirmBookingButton.click();
    await this.waitForPageLoad();
  }

  // ============ 断言方法 ============

  /**
   * 验证专家数量
   */
  async expectExpertCount(count: number): Promise<void> {
    await expect(this.expertCards).toHaveCount(count);
  }

  /**
   * 验证专家数量至少为
   */
  async expectMinExpertCount(minCount: number): Promise<void> {
    const count = await this.getExpertCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * 验证日历显示
   */
  async expectCalendarVisible(): Promise<void> {
    await expect(this.calendar).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证有可用时间槽
   */
  async expectTimeSlotsAvailable(): Promise<void> {
    await expect(this.timeSlots.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证确认按钮启用
   */
  async expectConfirmEnabled(): Promise<void> {
    await expect(this.confirmButton).toBeEnabled();
  }

  /**
   * 验证确认按钮禁用
   */
  async expectConfirmDisabled(): Promise<void> {
    await expect(this.confirmButton).toBeDisabled();
  }

  /**
   * 验证 Intake 表单显示
   */
  async expectIntakeFormVisible(): Promise<void> {
    await expect(this.intakeForm).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证预约成功
   */
  async expectBookingSuccess(): Promise<void> {
    const successMessage = this.page.getByText(/Success|成功|Confirmed|已确认/i);
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  }
}
