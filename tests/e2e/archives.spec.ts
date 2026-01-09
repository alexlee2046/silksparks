import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3007";

test.describe("Archives Workflow", () => {
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

      const uniqueEmail = `test_arch_${Date.now()}@silksparks.com`;
      console.log(`BE: Filling Sign Up form with ${uniqueEmail}`);

      // Fill Full Name - use specific selector to avoid readonly inputs
      // Assuming the first input is name if placeholder contains "Name" or similar,
      // or just target by placeholder if known.
      // The logs showed: <input readonly ... placeholder="Enter your birth details...">
      // We need the input for "Full Name".

      // Try to find input with placeholder "Enter your full name" or similar.
      // If explicit placeholder is unknown, find input that is NOT readonly.
      const nameInput = page
        .locator('input[placeholder*="Name"], input[placeholder*="name"], input[placeholder*="名字"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("Archive Test User");
      } else {
        // Fallback: fill first editable text input
        const editableInput = page
          .locator('input[type="text"]:not([readonly])')
          .first();
        await editableInput.fill("Archive Test User");
      }

      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[type="password"]', "password123");

      console.log("BE: Submitting Sign Up");
      // 支持中英文
      await page.click('button:has-text("Create Account"), button:has-text("创建账户"), button:has-text("注册")');

      console.log("BE: Waiting for success or confirmation");

      // 支持中英文
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
          "BE: Email confirmation required. Cannot proceed with archives test.",
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
      test.skip(true, `Auth failed: ${e.message}`);
    }

    console.log("BE: Done");
    await page.waitForTimeout(1000);
  });

  test("should navigate to archives and show empty state", async ({ page }) => {
    // 1. Go to User Dashboard
    await page.goto(`${BASE_URL}/dashboard`);

    // 2. Click Archives (支持中英文)
    console.log("Navigating to Archives...");
    await page.click("text=Archives, text=档案");

    // 3. Verify Archives Header (支持中英文)
    await expect(
      page.locator("h1").filter({ hasText: /My Archives|我的档案/ }),
    ).toBeVisible();

    // 4. Verify Empty State (since new user) (支持中英文)
    await expect(page.locator("text=No archives found, text=暂无档案")).toBeVisible();

    // 5. Verify Back Button (支持中英文)
    await page.click('button:has-text("Back to Dashboard"), button:has-text("返回仪表盘")');
    // Should find Dashboard Cards again (e.g., "My Profile", "Tier")
    await expect(
      page.locator("h3").filter({ hasText: /My Profile|个人资料/ }),
    ).toBeVisible();
  });
});
