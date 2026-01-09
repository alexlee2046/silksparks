/**
 * 管理后台页面对象
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./common";

export class AdminPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============ 定位器 ============

  /** 侧边栏 */
  get sidebar(): Locator {
    return this.page.locator('[data-testid="admin-sidebar"], .sider, aside');
  }

  /** 侧边栏菜单项 */
  get menuItems(): Locator {
    return this.sidebar.locator('.ant-menu-item, a, [role="menuitem"]');
  }

  /** 面包屑 */
  get breadcrumb(): Locator {
    return this.page.locator('.ant-breadcrumb, [aria-label="breadcrumb"]');
  }

  /** 主内容区域 */
  get content(): Locator {
    return this.page.locator('.ant-layout-content, main, [role="main"]');
  }

  /** 数据表格 */
  get dataTable(): Locator {
    return this.page.locator('.ant-table, table');
  }

  /** 表格行 */
  get tableRows(): Locator {
    return this.dataTable.locator('tbody tr, .ant-table-row');
  }

  /** 创建按钮 */
  get createButton(): Locator {
    return this.page.getByRole("button", { name: /Create|新建|Add|添加/i });
  }

  /** 编辑按钮 */
  get editButtons(): Locator {
    return this.page.getByRole("button", { name: /Edit|编辑/i });
  }

  /** 删除按钮 */
  get deleteButtons(): Locator {
    return this.page.getByRole("button", { name: /Delete|删除/i });
  }

  /** 搜索输入框 */
  get searchInput(): Locator {
    return this.page.locator('.ant-input-search input, input[type="search"]');
  }

  /** 刷新按钮 */
  get refreshButton(): Locator {
    return this.page.getByRole("button", { name: /Refresh|刷新/i });
  }

  /** 加载状态 */
  get loading(): Locator {
    return this.page.locator('.ant-spin, .loading');
  }

  // ============ 表单定位器 ============

  /** 表单 */
  get form(): Locator {
    return this.page.locator('form, .ant-form');
  }

  /** 保存按钮 */
  get saveButton(): Locator {
    return this.form.getByRole("button", { name: /Save|保存|Submit|提交/i });
  }

  /** 取消按钮 */
  get cancelButton(): Locator {
    return this.form.getByRole("button", { name: /Cancel|取消/i });
  }

  // ============ 导航方法 ============

  /**
   * 导航到 Admin 首页
   */
  async goto(): Promise<void> {
    await super.goto("/admin");
  }

  /**
   * 导航到产品管理
   */
  async gotoProducts(): Promise<void> {
    await super.goto("/admin/products");
  }

  /**
   * 导航到专家管理
   */
  async gotoExperts(): Promise<void> {
    await super.goto("/admin/experts");
  }

  /**
   * 导航到订单管理
   */
  async gotoOrders(): Promise<void> {
    await super.goto("/admin/orders");
  }

  /**
   * 导航到系统设置
   */
  async gotoSettings(): Promise<void> {
    await super.goto("/admin/settings");
  }

  /**
   * 导航到审计日志
   */
  async gotoAuditLogs(): Promise<void> {
    await super.goto("/admin/audit");
  }

  /**
   * 导航到 AI 使用统计
   */
  async gotoAIUsage(): Promise<void> {
    await super.goto("/admin/ai-usage");
  }

  // ============ 侧边栏操作 ============

  /**
   * 点击菜单项
   */
  async clickMenuItem(text: string): Promise<void> {
    const item = this.menuItems.filter({ hasText: new RegExp(text, "i") }).first();
    await item.click();
    await this.waitForPageLoad();
  }

  /**
   * 获取菜单项列表
   */
  async getMenuItemTexts(): Promise<string[]> {
    const items = await this.menuItems.all();
    const texts: string[] = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  // ============ 表格操作 ============

  /**
   * 等待表格加载
   */
  async waitForTableLoad(): Promise<void> {
    await this.dataTable.waitFor({ state: "visible", timeout: 15000 });
    // 等待加载状态消失
    if (await this.loading.isVisible({ timeout: 500 }).catch(() => false)) {
      await this.loading.waitFor({ state: "hidden", timeout: 30000 });
    }
  }

  /**
   * 获取表格行数
   */
  async getRowCount(): Promise<number> {
    await this.waitForTableLoad();
    return this.tableRows.count();
  }

  /**
   * 获取表格数据
   */
  async getTableData(): Promise<string[][]> {
    await this.waitForTableLoad();
    const rows = await this.tableRows.all();
    const data: string[][] = [];

    for (const row of rows) {
      const cells = await row.locator("td").all();
      const rowData: string[] = [];
      for (const cell of cells) {
        const text = await cell.textContent();
        rowData.push((text || "").trim());
      }
      data.push(rowData);
    }

    return data;
  }

  /**
   * 点击表格行
   */
  async clickRow(index: number = 0): Promise<void> {
    await this.tableRows.nth(index).click();
    await this.waitForPageLoad();
  }

  /**
   * 点击行的编辑按钮
   */
  async clickRowEdit(index: number = 0): Promise<void> {
    const row = this.tableRows.nth(index);
    const editBtn = row.getByRole("button", { name: /Edit|编辑/i });
    await editBtn.click();
    await this.waitForPageLoad();
  }

  /**
   * 搜索
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
    await this.page.waitForTimeout(500);
  }

  // ============ CRUD 操作 ============

  /**
   * 点击创建按钮
   */
  async clickCreate(): Promise<void> {
    await this.createButton.click();
    await this.waitForPageLoad();
  }

  /**
   * 填写表单字段
   */
  async fillFormField(name: string, value: string): Promise<void> {
    const input = this.form.locator(`[name="${name}"], #${name}, [data-testid="${name}"]`);
    const tagName = await input.first().evaluate((el) => el.tagName.toLowerCase());

    if (tagName === "select") {
      await input.selectOption(value);
    } else if (tagName === "textarea") {
      await input.fill(value);
    } else {
      await input.fill(value);
    }
  }

  /**
   * 保存表单
   */
  async saveForm(): Promise<void> {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 取消表单
   */
  async cancelForm(): Promise<void> {
    await this.cancelButton.click();
    await this.waitForPageLoad();
  }

  // ============ 设置页面操作 ============

  /**
   * 获取设置值
   */
  async getSettingValue(name: string): Promise<string> {
    const input = this.form.locator(`[name="${name}"], #${name}`);
    return input.inputValue();
  }

  /**
   * 验证 API 密钥已掩码
   */
  async isApiKeyMasked(): Promise<boolean> {
    const apiKeyInput = this.form.locator('[name*="api_key"], [name*="apiKey"]');
    if (await apiKeyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const type = await apiKeyInput.getAttribute("type");
      return type === "password";
    }
    return true;
  }

  // ============ 断言方法 ============

  /**
   * 验证在 Admin 页面
   */
  async expectOnAdmin(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin/);
  }

  /**
   * 验证侧边栏可见
   */
  async expectSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证表格可见
   */
  async expectTableVisible(): Promise<void> {
    await expect(this.dataTable).toBeVisible({ timeout: 15000 });
  }

  /**
   * 验证表格有数据
   */
  async expectTableHasData(): Promise<void> {
    await expect(this.tableRows.first()).toBeVisible({ timeout: 15000 });
  }

  /**
   * 验证表格行数
   */
  async expectRowCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count);
  }

  /**
   * 验证最少行数
   */
  async expectMinRowCount(minCount: number): Promise<void> {
    const count = await this.getRowCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * 验证创建按钮可见
   */
  async expectCreateButtonVisible(): Promise<void> {
    await expect(this.createButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证表单可见
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.form).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证访问被拒绝
   */
  async expectAccessDenied(): Promise<void> {
    const denied = this.page.getByText(/Access Denied|访问被拒绝|Unauthorized|未授权/i);
    await expect(denied).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证保存成功
   */
  async expectSaveSuccess(): Promise<void> {
    await this.expectToast(/saved|success|保存成功/i);
  }
}
