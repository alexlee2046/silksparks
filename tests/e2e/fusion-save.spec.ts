/**
 * Fusion Reading - Save to Archives E2E Tests
 */

import { test, expect, Page } from "@playwright/test";

const TEST_BIRTH_DATA = {
  date: "1990-05-15",
  time: "14:30",
};

// Helper: Fill birth data form (GuestBirthDataForm)
async function fillBirthDataForm(page: Page) {
  // Step 1: Click enter birth data button to open modal
  await page.getByRole("button", { name: /输入出生信息|Enter Birth Details/i }).click();
  await page.waitForSelector('input[type="date"]', { timeout: 5000 });

  // Fill date and time
  await page.locator('input[type="date"]').fill(TEST_BIRTH_DATA.date);
  await page.locator('input[type="time"]').fill(TEST_BIRTH_DATA.time);

  // Click Next to go to step 2 (location)
  await page.getByRole("button", { name: /下一步|Next/i }).click();

  // Wait for step 2 to appear
  await page.waitForSelector('text=Birth Location', { timeout: 5000 });

  // Step 2: Click "Skip this step" button (it's a <button>, not link!)
  await page.getByRole("button", { name: "Skip this step" }).click();
  await page.waitForTimeout(300);

  // Now "Enter Birth Details" button should be enabled - click it
  // Use nth(1) because there are 2 buttons with this name (one in modal, one behind)
  await page.getByRole("button", { name: /Enter Birth Details/i }).nth(1).click();

  // Wait for modal to close and reading to load
  await page.waitForTimeout(2000);
}

test.describe("Fusion Reading - Save to Archives", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Entry screen shows without birth data", async ({ page }) => {
    await page.goto("/fusion");
    await expect(page.getByRole("button", { name: /输入出生信息|Enter Birth Details/i })).toBeVisible({ timeout: 5000 });
    console.log("✅ Entry screen displays correctly");
  });

  test("Guest save stores to localStorage", async ({ page }) => {
    await page.goto("/fusion");
    await fillBirthDataForm(page);

    // Wait for fusion reading to load - check for Element Harmony which is always present
    await expect(page.locator("text=Element Harmony")).toBeVisible({ timeout: 20000 });

    // Click save button
    const saveButton = page.getByRole("button", { name: /Save to Archives/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify localStorage
    const pendingData = await page.evaluate(() => localStorage.getItem("fusion_pending_save"));
    expect(pendingData).not.toBeNull();

    const parsed = JSON.parse(pendingData!);
    expect(parsed.version).toBe("1.0");
    expect(parsed.sunSign).toBeTruthy();
    expect(parsed.dayMaster).toBeTruthy();
    console.log("✅ Guest save: localStorage populated");
    console.log("   Sun Sign:", parsed.sunSign);
    console.log("   Day Master:", parsed.dayMaster.elementName);
  });

  test("Save button shows correct states", async ({ page }) => {
    await page.goto("/fusion");
    await fillBirthDataForm(page);

    // Wait for reading
    await expect(page.locator("text=Element Harmony")).toBeVisible({ timeout: 20000 });

    // Check save button is enabled and has correct text
    const saveButton = page.getByRole("button", { name: /Save to Archives/i });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
    console.log("✅ Save button: correct initial state");
  });

  test("Fusion reading shows all elements", async ({ page }) => {
    await page.goto("/fusion");
    await fillBirthDataForm(page);

    // Check main sections
    await expect(page.locator("text=Element Harmony")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("text=Core Fusion Insights")).toBeVisible();

    // Check expandable sections
    await expect(page.getByRole("button", { name: /Western/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Chinese|BaZi/i })).toBeVisible();

    // Check action buttons
    await expect(page.getByRole("button", { name: /Save/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Share/i })).toBeVisible();
    console.log("✅ Fusion reading: all UI elements present");
  });

  test("Expandable sections work", async ({ page }) => {
    await page.goto("/fusion");
    await fillBirthDataForm(page);

    await expect(page.locator("text=Element Harmony")).toBeVisible({ timeout: 20000 });

    // Expand Western details
    await page.getByRole("button", { name: /Western/i }).click();
    // Look for "Sun" label in planet list (use exact match)
    await expect(page.getByText("Sun", { exact: true })).toBeVisible({ timeout: 3000 });

    // Expand Chinese details
    await page.getByRole("button", { name: /Chinese|BaZi/i }).click();
    await page.waitForTimeout(500);
    console.log("✅ Expandable sections work");
  });
});
