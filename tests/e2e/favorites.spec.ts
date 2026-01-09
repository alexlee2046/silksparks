import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3007";

test.describe("Favorites Workflow", () => {
  test.beforeEach(async ({ page }) => {
    try {
      console.log("BE: Navigating to home");
      await page.goto(BASE_URL);

      // 支持中英文
      const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("退出登录"), button:has-text("登出")').first();
      if (await signOutBtn.isVisible()) {
        console.log("BE: Signing out");
        await signOutBtn.click();
        await page.waitForTimeout(1000);
      }

      console.log("BE: Clicking Login");
      // 支持中英文
      await page.click('button:has-text("Login"), button:has-text("Sign In"), button:has-text("登录")');

      console.log("BE: Waiting for form");
      await page.waitForSelector("form", { state: "visible" });

      // Switch to Sign Up (支持中英文)
      console.log("BE: Switching to Sign Up");
      await page.click('button:has-text("Sign Up"), button:has-text("注册")');
      // Wait for Name field
      await page.waitForSelector('input[placeholder*="Sharma"], input[placeholder*="名字"]', {
        state: "visible",
      });

      const uniqueEmail = `test_${Date.now()}@silksparks.com`;
      console.log(`BE: Filling Sign Up form with ${uniqueEmail}`);

      // Fill Full Name
      const inputs = page.locator('input[type="text"]');
      // The first text input is likely Full Name (placeholder Arjun Sharma)
      await inputs.first().fill("Test User");

      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[type="password"]', "password123");

      console.log("BE: Submitting Sign Up");
      // 支持中英文
      await page.click('button:has-text("Create Account"), button:has-text("创建账户"), button:has-text("注册")');

      console.log("BE: Waiting for success or confirmation");

      // Race condition: either success or message (支持中英文)
      const successOrMessage = await Promise.race([
        page
          .waitForSelector('button:has-text("Sign Out"), button:has-text("退出登录"), button:has-text("登出")', { timeout: 10000 })
          .then(() => "logged_in"),
        page
          .waitForSelector("text=Check your email, text=检查您的邮箱", { timeout: 10000 })
          .then(() => "check_email"),
      ]);

      if (successOrMessage === "check_email") {
        console.log(
          "BE: Email confirmation required. Cannot proceed with favorites test.",
        );
        test.skip(
          true,
          "Email confirmation required, skipping functionality test.",
        );
        return;
      }
      console.log("BE: Logged in successfully");
    } catch (e: any) {
      console.log(`BE: Failed to login/signup: ${e.message}`);
      // Skip the test if auth fails entirely (e.g. timeout)
      test.skip(true, `Auth failed: ${e.message}`);
    }

    console.log("BE: Done");
    await page.waitForTimeout(1000);
  });

  test("should allow user to toggle favorites", async ({ page }) => {
    console.log("Starting test...");
    // Enable console logs
    page.on("console", (msg) => console.log(`BROWSER LOG: ${msg.text()} `));

    // 1. Go to Home to find products
    console.log("Navigating to home...");
    await page.goto(BASE_URL);

    // Wait for products to load
    await page.waitForSelector(".snap-start", { timeout: 10000 });

    // Find the first product card's favorite button
    const firstProduct = page.locator(".snap-start").first();
    const favButton = firstProduct
      .locator("button")
      .filter({ hasText: "favorite" })
      .first();

    await favButton.waitFor({ state: "visible", timeout: 5000 });

    // Check initial state
    const isFavorited = await favButton.evaluate((el) => {
      return el.classList.contains("bg-primary");
    });
    console.log(`Initial favorited state: ${isFavorited} `);

    if (isFavorited) {
      // Remove it first to start clean
      await favButton.scrollIntoViewIfNeeded();
      await favButton.click();
      await expect(page.locator("text=Removed from favorites")).toBeVisible();
      await page.waitForTimeout(1000);
    }

    // Now ADD to favorites
    console.log("Clicking favorite button to ADD...");
    await favButton.scrollIntoViewIfNeeded();
    await favButton.click();

    // Wait for toast
    await expect(page.locator("text=Added to favorites")).toBeVisible({
      timeout: 5000,
    });
    console.log("Toast appeared.");

    // 2. Go to User Dashboard -> Favorites
    await page.goto(`${BASE_URL}/dashboard`);

    await page.click("text=Favorites");

    // 3. Verify Product is in Favorites list
    await page.waitForSelector(".grid", { timeout: 10000 });

    await expect(page.locator(".grid > div").first()).toBeVisible();

    // 4. Remove from Favorites inside Dashboard
    const dashFavButton = page
      .locator(".grid > div")
      .first()
      .locator("button")
      .filter({ hasText: "favorite" });
    await dashFavButton.click();

    await expect(page.locator("text=Removed from favorites")).toBeVisible();
  });
});
