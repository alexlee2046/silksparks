/**
 * 用户仪表盘页面对象
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./common";

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============ 定位器 ============

  /** 侧边栏 */
  get sidebar(): Locator {
    return this.page.locator('[data-testid="dashboard-sidebar"], .dashboard-sidebar, aside');
  }

  /** 侧边栏菜单项 */
  get sidebarItems(): Locator {
    return this.sidebar.locator('a, button');
  }

  /** 用户信息区域 */
  get userInfo(): Locator {
    return this.page.locator('[data-testid="user-info"], .user-info');
  }

  /** 用户名 */
  get userName(): Locator {
    return this.userInfo.locator('.user-name, h2, h3');
  }

  /** 用户等级 */
  get userTier(): Locator {
    return this.page.locator('[data-testid="user-tier"], .user-tier, .tier-badge');
  }

  /** 用户积分 */
  get userPoints(): Locator {
    return this.page.locator('[data-testid="user-points"], .user-points');
  }

  /** 统计卡片 */
  get statsCards(): Locator {
    return this.page.locator('[data-testid="stats-card"], .stats-card, .dashboard-card');
  }

  /** 主内容区域 */
  get content(): Locator {
    return this.page.locator('[data-testid="dashboard-content"], .dashboard-content, main');
  }

  // ============ 订单相关定位器 ============

  /** 订单列表 */
  get orderList(): Locator {
    return this.page.locator('[data-testid="order-list"], .order-list');
  }

  /** 订单项 */
  get orderItems(): Locator {
    return this.orderList.locator('[data-testid="order-item"], .order-item, tr');
  }

  /** 订单空状态 */
  get ordersEmptyState(): Locator {
    return this.page.locator('[data-testid="orders-empty"], .orders-empty');
  }

  // ============ 存档相关定位器 ============

  /** 存档列表 */
  get archiveList(): Locator {
    return this.page.locator('[data-testid="archive-list"], .archive-list');
  }

  /** 存档项 */
  get archiveItems(): Locator {
    return this.archiveList.locator('[data-testid="archive-item"], .archive-item');
  }

  /** 存档空状态 */
  get archivesEmptyState(): Locator {
    return this.page.locator('[data-testid="archives-empty"], .archives-empty');
  }

  // ============ 收藏相关定位器 ============

  /** 收藏列表 */
  get favoritesList(): Locator {
    return this.page.locator('[data-testid="favorites-list"], .favorites-list');
  }

  /** 收藏项 */
  get favoriteItems(): Locator {
    return this.favoritesList.locator('[data-testid="favorite-item"], .favorite-item');
  }

  // ============ 设置相关定位器 ============

  /** 设置表单 */
  get settingsForm(): Locator {
    return this.page.locator('[data-testid="settings-form"], form');
  }

  /** 姓名输入框 */
  get nameInput(): Locator {
    return this.settingsForm.locator('input[name="name"], input[name="full_name"]');
  }

  /** 邮箱输入框 */
  get emailInput(): Locator {
    return this.settingsForm.locator('input[name="email"]');
  }

  /** 出生日期输入框 */
  get birthDateInput(): Locator {
    return this.settingsForm.locator('input[name="birth_date"], input[type="date"]');
  }

  /** 出生时间输入框 */
  get birthTimeInput(): Locator {
    return this.settingsForm.locator('input[name="birth_time"], input[type="time"]');
  }

  /** 出生地点输入框 */
  get birthLocationInput(): Locator {
    return this.settingsForm.locator('input[name="birth_place"], input[name="birth_location"]');
  }

  /** 保存按钮 */
  get saveButton(): Locator {
    return this.settingsForm.getByRole("button", { name: /Save|保存/i });
  }

  // ============ 导航方法 ============

  /**
   * 导航到仪表盘首页
   */
  async goto(): Promise<void> {
    await super.goto("/dashboard");
  }

  /**
   * 导航到订单页面
   */
  async gotoOrders(): Promise<void> {
    await super.goto("/dashboard/orders");
  }

  /**
   * 导航到存档页面
   */
  async gotoArchives(): Promise<void> {
    await super.goto("/dashboard/archives");
  }

  /**
   * 导航到收藏页面
   */
  async gotoFavorites(): Promise<void> {
    await super.goto("/dashboard/favorites");
  }

  /**
   * 导航到设置页面
   */
  async gotoSettings(): Promise<void> {
    await super.goto("/dashboard/settings");
  }

  /**
   * 导航到咨询页面
   */
  async gotoConsultations(): Promise<void> {
    await super.goto("/dashboard/consultations");
  }

  // ============ 侧边栏操作 ============

  /**
   * 点击侧边栏菜单项
   */
  async clickSidebarItem(text: string): Promise<void> {
    const item = this.sidebarItems.filter({ hasText: new RegExp(text, "i") }).first();
    await item.click();
    await this.waitForPageLoad();
  }

  /**
   * 获取侧边栏菜单项文本
   */
  async getSidebarItemTexts(): Promise<string[]> {
    const items = await this.sidebarItems.all();
    const texts: string[] = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  // ============ 用户信息操作 ============

  /**
   * 获取用户名
   */
  async getUserName(): Promise<string> {
    return (await this.userName.textContent()) || "";
  }

  /**
   * 获取用户等级
   */
  async getUserTier(): Promise<string> {
    return (await this.userTier.textContent()) || "";
  }

  /**
   * 获取用户积分
   */
  async getUserPoints(): Promise<number> {
    const text = await this.userPoints.textContent();
    if (!text) return 0;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // ============ 订单操作 ============

  /**
   * 获取订单数量
   */
  async getOrderCount(): Promise<number> {
    if (await this.ordersEmptyState.isVisible({ timeout: 500 }).catch(() => false)) {
      return 0;
    }
    return this.orderItems.count();
  }

  /**
   * 点击订单详情
   */
  async clickOrderDetail(index: number = 0): Promise<void> {
    const item = this.orderItems.nth(index);
    await item.click();
    await this.waitForPageLoad();
  }

  // ============ 存档操作 ============

  /**
   * 获取存档数量
   */
  async getArchiveCount(): Promise<number> {
    if (await this.archivesEmptyState.isVisible({ timeout: 500 }).catch(() => false)) {
      return 0;
    }
    return this.archiveItems.count();
  }

  /**
   * 点击存档详情
   */
  async clickArchiveDetail(index: number = 0): Promise<void> {
    const item = this.archiveItems.nth(index);
    await item.click();
    await this.waitForPageLoad();
  }

  // ============ 收藏操作 ============

  /**
   * 获取收藏数量
   */
  async getFavoriteCount(): Promise<number> {
    return this.favoriteItems.count();
  }

  /**
   * 移除收藏
   */
  async removeFavorite(index: number = 0): Promise<void> {
    const item = this.favoriteItems.nth(index);
    const removeButton = item.getByRole("button", { name: /Remove|删除|取消收藏/i });
    await removeButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============ 设置操作 ============

  /**
   * 填写设置表单
   */
  async fillSettings(data: {
    name?: string;
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
  }): Promise<void> {
    if (data.name) {
      await this.nameInput.fill(data.name);
    }
    if (data.birthDate) {
      await this.birthDateInput.fill(data.birthDate);
    }
    if (data.birthTime) {
      await this.birthTimeInput.fill(data.birthTime);
    }
    if (data.birthLocation) {
      await this.birthLocationInput.fill(data.birthLocation);
    }
  }

  /**
   * 保存设置
   */
  async saveSettings(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============ 断言方法 ============

  /**
   * 验证在仪表盘页面
   */
  async expectOnDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  /**
   * 验证侧边栏可见
   */
  async expectSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证用户信息显示
   */
  async expectUserInfoVisible(): Promise<void> {
    await expect(this.userInfo).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证订单为空
   */
  async expectOrdersEmpty(): Promise<void> {
    await expect(this.ordersEmptyState).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证存档为空
   */
  async expectArchivesEmpty(): Promise<void> {
    await expect(this.archivesEmptyState).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证设置保存成功
   */
  async expectSettingsSaved(): Promise<void> {
    await this.expectToast(/saved|保存成功/i);
  }
}
