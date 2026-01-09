/**
 * 购物车页面对象
 * 处理购物车抽屉/页面的交互
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./common";

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ============ 定位器 ============

  /** 购物车抽屉 - 基于 "Cosmic Cart" 标题定位 */
  get cartDrawer(): Locator {
    return this.page.locator('.fixed.top-0.right-0.h-full').filter({
      has: this.page.getByText("Cosmic Cart"),
    });
  }

  /** 购物车商品列表 - 基于商品卡片结构 */
  get cartItems(): Locator {
    return this.cartDrawer.locator('.flex.gap-4.p-4').filter({
      has: this.page.locator('h4'),
    });
  }

  /** 购物车为空提示 */
  get emptyCartMessage(): Locator {
    return this.page.getByText("Your vessel is empty.");
  }

  /** 购物车总价 - Total行 */
  get cartTotal(): Locator {
    return this.cartDrawer.locator('.font-mono.text-primary').last();
  }

  /** 结账按钮 */
  get checkoutButton(): Locator {
    return this.page.getByRole("button", { name: /Checkout with Stripe|Processing/i });
  }

  /** 关闭按钮 */
  get closeButton(): Locator {
    return this.page.locator('button[aria-label="Close cart"]');
  }

  /** 清空购物车按钮 */
  get clearCartButton(): Locator {
    return this.cartDrawer.getByRole("button", { name: /Clear|清空/i });
  }

  // ============ 操作方法 ============

  /**
   * 打开购物车
   */
  async open(): Promise<void> {
    await this.openCart();
    // 等待购物车标题可见
    await expect(this.page.getByText("Cosmic Cart")).toBeVisible({ timeout: 5000 });
  }

  /**
   * 关闭购物车
   */
  async close(): Promise<void> {
    // 尝试通过 JavaScript 直接触发关闭按钮点击
    const clicked = await this.page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Close cart"]') as HTMLButtonElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      // 备用: 点击背景关闭
      const backdrop = this.page.locator('.fixed.inset-0.bg-black\\/60');
      if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
        await backdrop.click({ position: { x: 50, y: 50 } });
      }
    }

    await this.page.getByText("Cosmic Cart").waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * 获取购物车商品数量
   */
  async getItemCount(): Promise<number> {
    // 检查是否显示空状态
    if (await this.page.getByText("Your vessel is empty.").isVisible({ timeout: 500 }).catch(() => false)) {
      return 0;
    }
    return this.cartItems.count();
  }

  /**
   * 获取购物车总价
   */
  async getTotal(): Promise<number> {
    const totalText = await this.cartTotal.textContent();
    if (!totalText) return 0;
    const match = totalText.match(/[\d,.]+/);
    return match ? parseFloat(match[0].replace(",", "")) : 0;
  }

  /**
   * 获取商品信息
   */
  async getItemInfo(index: number = 0): Promise<{
    name: string;
    price: number;
    quantity: number;
  }> {
    const item = this.cartItems.nth(index);

    // 商品名在 h4 标签
    const name = await item.locator('h4').first().textContent() || "";
    // 价格在 p.font-mono
    const priceText = await item.locator('p.font-mono').first().textContent() || "0";
    // 数量在增减按钮之间的 span
    const quantityText = await item.locator('.flex.items-center.gap-2 span.text-center').first().textContent() || "1";

    return {
      name: name.trim(),
      price: parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0,
      quantity: parseInt(quantityText.toString(), 10) || 1,
    };
  }

  /**
   * 更新商品数量
   */
  async updateQuantity(index: number, quantity: number): Promise<void> {
    const item = this.cartItems.nth(index);

    // 尝试直接输入
    const quantityInput = item.locator('input[type="number"]');
    if (await quantityInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await quantityInput.fill(quantity.toString());
      await this.page.waitForTimeout(300);
      return;
    }

    // 使用加减按钮
    const currentInfo = await this.getItemInfo(index);
    const diff = quantity - currentInfo.quantity;

    if (diff > 0) {
      const plusButton = item.getByRole("button", { name: /\+|increase/i });
      for (let i = 0; i < diff; i++) {
        await plusButton.click();
        await this.page.waitForTimeout(200);
      }
    } else if (diff < 0) {
      const minusButton = item.getByRole("button", { name: /-|decrease/i });
      for (let i = 0; i < Math.abs(diff); i++) {
        await minusButton.click();
        await this.page.waitForTimeout(200);
      }
    }
  }

  /**
   * 增加商品数量
   */
  async increaseQuantity(index: number = 0): Promise<void> {
    const item = this.cartItems.nth(index);
    const plusButton = item.locator('button[aria-label="Increase quantity"]');
    await plusButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 减少商品数量
   */
  async decreaseQuantity(index: number = 0): Promise<void> {
    const item = this.cartItems.nth(index);
    const minusButton = item.locator('button[aria-label="Decrease quantity"]');
    await minusButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 删除商品
   */
  async removeItem(index: number = 0): Promise<void> {
    const item = this.cartItems.nth(index);
    // 删除按钮的 aria-label 是 "Remove {item.name} from cart"
    const removeButton = item.locator('button[aria-label*="Remove"]');
    await removeButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 清空购物车
   */
  async clearCart(): Promise<void> {
    if (await this.clearCartButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.clearCartButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * 点击结账
   */
  async checkout(): Promise<void> {
    await expect(this.checkoutButton).toBeEnabled({ timeout: 5000 });
    await this.checkoutButton.click();
    await this.waitForPageLoad();
  }

  // ============ 断言方法 ============

  /**
   * 验证购物车打开
   */
  async expectOpen(): Promise<void> {
    await expect(this.page.getByText("Cosmic Cart")).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证购物车关闭
   */
  async expectClosed(): Promise<void> {
    await this.page.getByText("Cosmic Cart").waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * 验证购物车为空
   */
  async expectEmpty(): Promise<void> {
    await expect(this.emptyCartMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证购物车不为空
   */
  async expectNotEmpty(): Promise<void> {
    await expect(this.cartItems.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证商品数量
   */
  async expectItemCount(count: number): Promise<void> {
    if (count === 0) {
      await this.expectEmpty();
    } else {
      await expect(this.cartItems).toHaveCount(count);
    }
  }

  /**
   * 验证总价
   */
  async expectTotal(expectedTotal: number, tolerance: number = 0.01): Promise<void> {
    const total = await this.getTotal();
    expect(total).toBeCloseTo(expectedTotal, Math.log10(1 / tolerance));
  }

  /**
   * 验证结账按钮可用
   */
  async expectCheckoutEnabled(): Promise<void> {
    await expect(this.checkoutButton).toBeEnabled();
  }

  /**
   * 验证结账按钮禁用
   */
  async expectCheckoutDisabled(): Promise<void> {
    await expect(this.checkoutButton).toBeDisabled();
  }

  /**
   * 验证包含指定商品
   */
  async expectContainsItem(name: string): Promise<void> {
    const item = this.cartItems.filter({ hasText: name });
    await expect(item.first()).toBeVisible({ timeout: 5000 });
  }
}
