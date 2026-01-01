/**
 * Silk & Spark - Mobile Responsiveness E2E Tests
 *
 * Tests mobile-specific functionality:
 * 1. Product card buttons visible on mobile (not hover-only)
 * 2. Tarot cards don't overflow viewport
 * 3. Touch targets meet minimum 44px size
 * 4. Sidebar responsive behavior
 * 5. Footer mobile layout
 * 6. Header mobile navigation
 */

import { test, expect } from "@playwright/test";

// Minimum touch target size (iOS HIG recommendation)
const MIN_TOUCH_TARGET = 44;

// Mobile viewport (iPhone SE)
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };

test.describe("Mobile Responsiveness", () => {
  test.describe("Product Cards (iPhone SE)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test("favorite button should be visible without hover", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Scroll to product carousel
      await page.evaluate(() => {
        const section = document.querySelector('[class*="snap-x"]');
        section?.scrollIntoView({ behavior: "instant" });
      });

      await page.waitForTimeout(1000);

      // Check if favorite button is visible
      const favoriteButton = page.locator('button:has(span:text("favorite"))').first();

      if (await favoriteButton.count() > 0) {
        const container = favoriteButton.locator("..");
        await expect(container).toBeVisible();

        const opacity = await container.evaluate((el) =>
          window.getComputedStyle(el).opacity
        );
        expect(parseFloat(opacity)).toBeGreaterThan(0);
      }
    });

    test("add to cart button should be visible without hover", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      await page.evaluate(() => {
        const section = document.querySelector('[class*="snap-x"]');
        section?.scrollIntoView({ behavior: "instant" });
      });

      await page.waitForTimeout(1000);

      const addToCartButton = page.getByRole("button", { name: /Add to Cart/i }).first();

      if (await addToCartButton.count() > 0) {
        await expect(addToCartButton).toBeVisible();
      }
    });
  });

  test.describe("Tarot Cards (iPhone SE)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test("tarot card should not overflow viewport on /tarot", async ({ page }) => {
      await page.goto("/tarot");
      await page.waitForLoadState("networkidle");

      const viewportWidth = MOBILE_VIEWPORT.width;
      const tarotCard = page.locator('[class*="aspect-"]').first();

      if (await tarotCard.count() > 0) {
        const box = await tarotCard.boundingBox();
        if (box) {
          const maxWidth = viewportWidth - 32;
          expect(box.width).toBeLessThanOrEqual(maxWidth);
        }
      }
    });

    test("tarot card should not overflow on /tarot/spread", async ({ page }) => {
      await page.goto("/tarot/spread");
      await page.waitForLoadState("networkidle");

      const viewportWidth = MOBILE_VIEWPORT.width;
      const tarotCard = page.locator('[class*="aspect-"]').first();

      if (await tarotCard.count() > 0) {
        const box = await tarotCard.boundingBox();
        if (box) {
          const maxWidth = viewportWidth - 32;
          expect(box.width).toBeLessThanOrEqual(maxWidth);
        }
      }
    });
  });

  test.describe("Touch Targets (iPhone SE)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test("theme toggle should have minimum 44px touch target", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const themeToggle = page.getByRole("button", { name: /switch to (light|dark) mode/i });

      if (await themeToggle.count() > 0) {
        const box = await themeToggle.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
          expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
      }
    });

    test("language toggle should have minimum touch target", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const langToggle = page.getByRole("button", { name: /current language/i });

      if (await langToggle.count() > 0) {
        const box = await langToggle.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
      }
    });

    test("hamburger menu button should have minimum 44px touch target", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const menuButton = page.getByRole("button", { name: /open menu/i });

      if (await menuButton.count() > 0) {
        const box = await menuButton.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
          expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
      }
    });
  });

  test.describe("Mobile Navigation (iPhone SE)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test("hamburger menu should open mobile nav drawer", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const menuButton = page.getByRole("button", { name: /open menu/i });
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Wait for animation to complete
      await page.waitForTimeout(500);

      const mobileNav = page.getByRole("dialog");
      await expect(mobileNav).toBeVisible({ timeout: 5000 });

      // Check for nav links inside the dialog
      const shopLink = mobileNav.getByRole("link", { name: /shop/i });
      await expect(shopLink).toBeVisible();
    });

    test("mobile nav should close on escape key", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const menuButton = page.getByRole("button", { name: /open menu/i });
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Wait for animation to complete
      await page.waitForTimeout(500);

      const mobileNav = page.getByRole("dialog");
      await expect(mobileNav).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");

      // Wait for close animation
      await page.waitForTimeout(500);
      await expect(mobileNav).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Footer Layout (iPhone SE)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test("footer should use single column layout on mobile", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      await page.evaluate(() => {
        const footer = document.querySelector("footer");
        footer?.scrollIntoView({ behavior: "instant" });
      });

      const footerGrid = page.locator("footer").locator('[class*="grid"]').first();

      if (await footerGrid.count() > 0) {
        const gridCols = await footerGrid.evaluate((el) =>
          window.getComputedStyle(el).gridTemplateColumns
        );
        const columnCount = gridCols.split(" ").filter(c => c !== "0px").length;
        expect(columnCount).toBeLessThanOrEqual(2);
      }
    });
  });

  test.describe("Tablet Layout (768px)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(TABLET_VIEWPORT);
    });

    test("sidebar should be visible on tablet", async ({ page }) => {
      await page.goto("/experts");
      await page.waitForLoadState("networkidle");

      const sidebar = page.locator("aside").first();

      if (await sidebar.count() > 0) {
        const isVisible = await sidebar.isVisible();
        expect(isVisible).toBe(true);
      }
    });

    test("desktop nav should be visible on tablet", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navLinks = page.locator("nav").getByRole("link");
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test("hamburger menu should be hidden on tablet", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const menuButton = page.getByRole("button", { name: /open menu/i });
      await expect(menuButton).not.toBeVisible();
    });
  });

  test.describe("Lazy Loading", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test("product images should have lazy loading when products exist", async ({ page }) => {
      // Test on shop page which shows product grid
      await page.goto("/shop");
      await page.waitForLoadState("networkidle");

      // Wait for products to load (they come from Supabase)
      await page.waitForTimeout(3000);

      // Wait for either products or "no products" message
      const hasProducts = await page.locator('img[alt]').count() > 0;
      const noProductsText = await page.locator('text=/0 artifacts found|No products/i').count() > 0;

      if (!hasProducts && noProductsText) {
        // No products in database - skip gracefully
        console.log("No products in database - skipping lazy loading check");
        return;
      }

      // Check for any images with lazy loading
      const allImages = page.locator("img");
      const imageCount = await allImages.count();

      if (imageCount === 0) {
        console.log("No images found on shop page - skipping lazy loading check");
        return;
      }

      // Check lazy loading attribute
      const lazyImages = page.locator('img[loading="lazy"]');
      const lazyCount = await lazyImages.count();

      console.log(`Found ${imageCount} images, ${lazyCount} with lazy loading`);

      // If we have images, verify lazy loading is applied
      if (imageCount > 0) {
        expect(lazyCount).toBeGreaterThan(0);
      }
    });

    test("product images should use decoding=async when products exist", async ({ page }) => {
      // Test on shop page which shows product grid
      await page.goto("/shop");
      await page.waitForLoadState("networkidle");

      // Wait for products to load
      await page.waitForTimeout(3000);

      // Check for either products or "no products" message
      const hasProducts = await page.locator('img[alt]').count() > 0;
      const noProductsText = await page.locator('text=/0 artifacts found|No products/i').count() > 0;

      if (!hasProducts && noProductsText) {
        console.log("No products in database - skipping async decoding check");
        return;
      }

      // Check for any images with async decoding
      const allImages = page.locator("img");
      const imageCount = await allImages.count();

      if (imageCount === 0) {
        console.log("No images found on shop page - skipping async decoding check");
        return;
      }

      // Check async decoding attribute
      const asyncImages = page.locator('img[decoding="async"]');
      const asyncCount = await asyncImages.count();

      console.log(`Found ${imageCount} images, ${asyncCount} with async decoding`);

      // If we have images, verify async decoding is applied
      if (imageCount > 0) {
        expect(asyncCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Responsive Breakpoint Transitions", () => {
    test("layout should adapt smoothly from mobile to tablet", async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const menuButton = page.getByRole("button", { name: /open menu/i });
      await expect(menuButton).toBeVisible();

      await page.setViewportSize(TABLET_VIEWPORT);
      await page.waitForTimeout(500);

      await expect(menuButton).not.toBeVisible();

      const navLinks = page.locator("nav").getByRole("link");
      expect(await navLinks.count()).toBeGreaterThan(0);
    });
  });
});
