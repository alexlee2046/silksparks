/**
 * 商店页面对象
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./common";

export class ShopPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============ 定位器 ============

  /** 产品网格 */
  get productGrid(): Locator {
    return this.page.locator('[data-testid="product-grid"], .product-grid, .grid');
  }

  /** 产品卡片 - 匹配 ShopItem 组件 (animate-fade-in-up) */
  get productCards(): Locator {
    return this.page.locator('.animate-fade-in-up').filter({ has: this.page.locator('h3') });
  }

  /** 筛选区域 */
  get filterSection(): Locator {
    return this.page.locator('[data-testid="filters"], .filter-section');
  }

  /** Intent 筛选器 */
  get intentFilters(): Locator {
    return this.page.locator('[data-testid="intent-filter"] button, .intent-filter button');
  }

  /** Element 筛选器 */
  get elementFilters(): Locator {
    return this.page.locator('[data-testid="element-filter"] button, .element-filter button');
  }

  /** 搜索输入框 */
  get searchInput(): Locator {
    return this.page.getByPlaceholder(/Search|搜索/i);
  }

  /** 排序下拉框 */
  get sortSelect(): Locator {
    return this.page.locator('[data-testid="sort-select"], select[name="sort"]');
  }

  /** 加载更多按钮 */
  get loadMoreButton(): Locator {
    return this.page.getByRole("button", { name: /Load More|加载更多/i });
  }

  /** 空状态提示 */
  get emptyState(): Locator {
    return this.page.locator('[data-testid="empty-state"], .empty-state');
  }

  // ============ 导航方法 ============

  /**
   * 导航到商店页面
   */
  async goto(): Promise<void> {
    await super.goto("/shop");
  }

  // ============ 产品操作 ============

  /**
   * 获取产品数量
   */
  async getProductCount(): Promise<number> {
    await this.waitForProducts();
    return this.productCards.count();
  }

  /**
   * 等待产品加载
   */
  async waitForProducts(): Promise<void> {
    await this.productCards.first().waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * 点击第 N 个产品
   */
  async clickProduct(index: number = 0): Promise<void> {
    const card = this.productCards.nth(index);
    await card.click();
    await this.waitForPageLoad();
  }

  /**
   * 通过名称点击产品
   */
  async clickProductByName(name: string): Promise<void> {
    const card = this.productCards.filter({ hasText: name }).first();
    await card.click();
    await this.waitForPageLoad();
  }

  /**
   * 获取产品名称列表
   */
  async getProductNames(): Promise<string[]> {
    // 等待第一个产品卡片的 h3 有内容
    const firstH3 = this.productCards.first().locator("h3").first();
    await expect(firstH3).toHaveText(/.+/, { timeout: 10000 });

    const cards = await this.productCards.all();
    const names: string[] = [];

    for (const card of cards) {
      const name = await card.locator("h3, .product-name").first().textContent();
      if (name && name.trim()) {
        names.push(name.trim());
      }
    }

    return names;
  }

  /**
   * 获取产品价格列表
   */
  async getProductPrices(): Promise<number[]> {
    const cards = await this.productCards.all();
    const prices: number[] = [];

    for (const card of cards) {
      // 匹配 ShopItem 中的价格: span.text-primary.font-bold
      const priceText = await card.locator(".text-primary.font-bold, .price, [data-testid='price']").first().textContent();
      if (priceText) {
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
        if (!isNaN(price)) {
          prices.push(price);
        }
      }
    }

    return prices;
  }

  // ============ 筛选操作 ============

  /**
   * 按 Intent 筛选
   */
  async filterByIntent(intent: string): Promise<void> {
    const button = this.intentFilters.filter({ hasText: new RegExp(intent, "i") });
    await button.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 按 Element 筛选
   */
  async filterByElement(element: string): Promise<void> {
    const button = this.elementFilters.filter({ hasText: new RegExp(element, "i") });
    await button.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 搜索产品
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
    await this.page.waitForTimeout(500);
  }

  /**
   * 清除筛选
   */
  async clearFilters(): Promise<void> {
    const clearButton = this.page.getByRole("button", { name: /Clear|清除|All/i });
    if (await clearButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 选择排序方式
   */
  async sortBy(option: "price-asc" | "price-desc" | "popular" | "newest"): Promise<void> {
    await this.sortSelect.selectOption(option);
    await this.page.waitForTimeout(500);
  }

  // ============ 加购操作 ============

  /**
   * 将第 N 个产品加入购物车
   */
  async addToCart(index: number = 0): Promise<void> {
    const card = this.productCards.nth(index);
    // 匹配 ShopItem 中的 "Quick Add" 按钮
    const addButton = card.getByRole("button", { name: /Quick Add|Add|加入|Cart|购物车/i });

    // 可能需要悬停才能显示按钮
    await card.hover();
    await this.page.waitForTimeout(300);

    await addButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 悬停在产品卡片上
   */
  async hoverProduct(index: number = 0): Promise<void> {
    const card = this.productCards.nth(index);
    await card.hover();
    await this.page.waitForTimeout(300);
  }

  // ============ 断言方法 ============

  /**
   * 验证产品数量
   */
  async expectProductCount(count: number): Promise<void> {
    await expect(this.productCards).toHaveCount(count);
  }

  /**
   * 验证产品数量至少为
   */
  async expectMinProductCount(minCount: number): Promise<void> {
    const count = await this.getProductCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * 验证筛选生效
   */
  async expectFilterApplied(filterText: string): Promise<void> {
    const activeFilter = this.page.locator('[data-active="true"], .active, [aria-pressed="true"]');
    await expect(activeFilter.filter({ hasText: filterText })).toBeVisible();
  }

  /**
   * 验证空状态
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证产品价格排序
   */
  async expectPricesSorted(direction: "asc" | "desc"): Promise<void> {
    const prices = await this.getProductPrices();

    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i]!;
      const prevPrice = prices[i - 1]!;
      if (direction === "asc") {
        expect(currentPrice).toBeGreaterThanOrEqual(prevPrice);
      } else {
        expect(currentPrice).toBeLessThanOrEqual(prevPrice);
      }
    }
  }
}
