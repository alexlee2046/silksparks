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

  /** 购物车抽屉 */
  get cartDrawer(): Locator {
    return this.page.locator('[data-testid="cart-drawer"], .cart-drawer, [role="dialog"]');
  }

  /** 购物车商品列表 */
  get cartItems(): Locator {
    return this.cartDrawer.locator('[data-testid="cart-item"], .cart-item');
  }

  /** 购物车为空提示 */
  get emptyCartMessage(): Locator {
    return this.cartDrawer.locator('[data-testid="empty-cart"], .empty-cart');
  }

  /** 购物车总价 */
  get cartTotal(): Locator {
    return this.cartDrawer.locator('[data-testid="cart-total"], .cart-total');
  }

  /** 结账按钮 */
  get checkoutButton(): Locator {
    return this.cartDrawer.getByRole("button", { name: /Checkout|结账|去支付/i });
  }

  /** 关闭按钮 */
  get closeButton(): Locator {
    return this.cartDrawer.locator('button[aria-label="Close"], button:has-text("×")');
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
    await expect(this.cartDrawer).toBeVisible({ timeout: 5000 });
  }

  /**
   * 关闭购物车
   */
  async close(): Promise<void> {
    // 点击关闭按钮或背景
    if (await this.closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.closeButton.click();
    } else {
      // 点击背景关闭
      await this.page.locator('.fixed.inset-0.bg-black\\/50').click();
    }
    await this.cartDrawer.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * 获取购物车商品数量
   */
  async getItemCount(): Promise<number> {
    if (await this.emptyCartMessage.isVisible({ timeout: 500 }).catch(() => false)) {
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

    const name = await item.locator('.item-name, h3, h4').first().textContent() || "";
    const priceText = await item.locator('.item-price, .price').first().textContent() || "0";
    const quantityText = await item.locator('input[type="number"], .quantity').first().inputValue().catch(
      () => item.locator('.quantity').first().textContent()
    ) || "1";

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
    const plusButton = item.getByRole("button", { name: /\+|increase/i });
    await plusButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 减少商品数量
   */
  async decreaseQuantity(index: number = 0): Promise<void> {
    const item = this.cartItems.nth(index);
    const minusButton = item.getByRole("button", { name: /-|decrease/i });
    await minusButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 删除商品
   */
  async removeItem(index: number = 0): Promise<void> {
    const item = this.cartItems.nth(index);
    const removeButton = item.getByRole("button", { name: /Remove|删除|×/i });
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
    await expect(this.cartDrawer).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证购物车关闭
   */
  async expectClosed(): Promise<void> {
    await this.cartDrawer.waitFor({ state: "hidden", timeout: 5000 });
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
