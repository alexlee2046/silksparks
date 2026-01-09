/**
 * 通用页面对象基类
 * 提供所有页面共用的方法
 */

import { Page, Locator, expect } from "@playwright/test";

/**
 * 基础页面对象
 */
export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ============ 通用定位器 ============

  /** Header 区域 */
  get header(): Locator {
    return this.page.getByRole("banner");
  }

  /** Footer 区域 */
  get footer(): Locator {
    return this.page.getByRole("contentinfo");
  }

  /** 主内容区域 */
  get main(): Locator {
    return this.page.getByRole("main");
  }

  /** 加载指示器 */
  get loadingIndicator(): Locator {
    return this.page.locator('[data-testid="loading"], .animate-spin, .loading');
  }

  /** Toast 通知 */
  get toast(): Locator {
    return this.page.locator('[data-sonner-toast], [role="status"]');
  }

  /** 模态框 */
  get modal(): Locator {
    return this.page.locator('.fixed.inset-0.z-\\[100\\], [role="dialog"]');
  }

  // ============ 导航方法 ============

  /**
   * 导航到指定路径
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    // 等待加载指示器消失
    const loading = this.loadingIndicator;
    if (await loading.isVisible({ timeout: 500 }).catch(() => false)) {
      await loading.waitFor({ state: "hidden", timeout: 30000 });
    }
  }

  /**
   * 关闭任何打开的模态框
   */
  async dismissModals(): Promise<void> {
    // 尝试关闭登录/注册模态框
    const closeButton = this.page.locator('button:has-text("close"), [aria-label="Close"], .modal-close');
    if (await closeButton.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.first().click();
      await this.page.waitForTimeout(300);
    }

    // 点击遮罩层关闭
    const backdrop = this.page.locator('.fixed.inset-0.bg-black\\/60, .modal-backdrop');
    if (await backdrop.isVisible({ timeout: 500 }).catch(() => false)) {
      // 点击遮罩层外部区域
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * 等待网络空闲
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  // ============ Header 导航 ============

  /** 导航到首页 */
  async navigateHome(): Promise<void> {
    await this.header.getByRole("link", { name: /Silk.*Spark|Logo/i }).click();
    await this.waitForPageLoad();
  }

  /** 导航到商店 */
  async navigateToShop(): Promise<void> {
    await this.header.getByRole("link", { name: /Shop|商店/i }).click();
    await this.waitForPageLoad();
  }

  /** 导航到专家 */
  async navigateToExperts(): Promise<void> {
    await this.header.getByRole("link", { name: /Expert|专家/i }).click();
    await this.waitForPageLoad();
  }

  /** 导航到星盘 */
  async navigateToHoroscope(): Promise<void> {
    await this.header.getByRole("link", { name: /Horoscope|星盘|运势/i }).click();
    await this.waitForPageLoad();
  }

  /** 导航到塔罗 */
  async navigateToTarot(): Promise<void> {
    await this.header.getByRole("link", { name: /Tarot|塔罗/i }).click();
    await this.waitForPageLoad();
  }

  /** 打开登录模态框 */
  async openSignInModal(): Promise<void> {
    await this.header.getByRole("button", { name: /Sign In|登录/i }).click();
    await expect(this.modal).toBeVisible({ timeout: 5000 });
  }

  /** 点击登出 */
  async signOut(): Promise<void> {
    const signOutBtn = this.header.getByRole("button", { name: /Sign Out|退出登录|登出/i });
    if (await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signOutBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /** 检查是否已登录 */
  async isSignedIn(): Promise<boolean> {
    const signOutBtn = this.header.getByRole("button", { name: /Sign Out|退出登录|登出/i });
    return signOutBtn.isVisible({ timeout: 2000 }).catch(() => false);
  }

  // ============ 购物车 ============

  /** 打开购物车 */
  async openCart(): Promise<void> {
    await this.header.getByRole("button", { name: /Cart|购物车/i }).click();
    // 等待购物车抽屉打开
    await this.page.waitForTimeout(500);
  }

  /** 获取购物车数量 */
  async getCartCount(): Promise<number> {
    const badge = this.header.locator('[data-testid="cart-count"], .cart-badge');
    if (await badge.isVisible({ timeout: 1000 }).catch(() => false)) {
      const text = await badge.textContent();
      return parseInt(text || "0", 10);
    }
    return 0;
  }

  // ============ 通用断言 ============

  /**
   * 验证页面标题包含指定文本
   */
  async expectTitleContains(text: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(text, "i"));
  }

  /**
   * 验证 URL 包含指定路径
   */
  async expectUrlContains(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * 验证页面包含指定文本
   */
  async expectPageContains(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * 验证 Toast 消息
   */
  async expectToast(message: string | RegExp): Promise<void> {
    const toast = this.toast.filter({
      hasText: typeof message === "string" ? message : undefined,
    });
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  }

  // ============ 等待方法 ============

  /**
   * 等待元素可见
   */
  async waitForVisible(
    selector: string | Locator,
    timeout: number = 10000
  ): Promise<void> {
    const locator =
      typeof selector === "string" ? this.page.locator(selector) : selector;
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * 等待元素隐藏
   */
  async waitForHidden(
    selector: string | Locator,
    timeout: number = 10000
  ): Promise<void> {
    const locator =
      typeof selector === "string" ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: "hidden", timeout });
  }

  /**
   * 等待指定时间
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // ============ 截图方法 ============

  /**
   * 截取页面截图
   */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}

/**
 * 滚动辅助类
 */
export class ScrollHelper {
  constructor(private page: Page) {}

  /**
   * 滚动到页面顶部
   */
  async toTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * 滚动到页面底部
   */
  async toBottom(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
  }

  /**
   * 滚动到元素
   */
  async toElement(selector: string | Locator): Promise<void> {
    const locator =
      typeof selector === "string" ? this.page.locator(selector) : selector;
    await locator.scrollIntoViewIfNeeded();
  }
}
