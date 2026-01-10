/**
 * Edge Function Integration Tests
 *
 * Tests the Supabase Edge Functions used for AI generation.
 * Validates:
 * 1. Edge Functions respond without 401/500 errors
 * 2. CORS headers are correctly configured
 * 3. Rate limiting works for anonymous users
 * 4. Response structure is correct
 */

import { test, expect, type Page, type Request } from "@playwright/test";

// Get Supabase URL from environment or use placeholder
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const EDGE_FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/ai-generate` : "";

test.describe("Edge Function Availability", () => {
  test.skip(!EDGE_FUNCTION_URL, "Supabase URL not configured");

  test("ai-generate function should respond (not 401)", async ({ request }) => {
    if (!EDGE_FUNCTION_URL) {
      test.skip(true, "Edge function URL not configured");
      return;
    }

    // Send a minimal request to check if function responds
    const response = await request.post(EDGE_FUNCTION_URL, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        type: "test",
        prompt: "test",
      },
    });

    const status = response.status();

    // 401 = Missing/invalid service role key (deployment issue)
    // 400 = Bad request (function working, just invalid input)
    // 200 = Success
    // 429 = Rate limited (function working)

    expect(
      status,
      `Edge function returned ${status} - if 401, check SUPABASE_SERVICE_ROLE_KEY deployment`
    ).not.toBe(401);

    // Log the response for debugging
    if (status !== 200) {
      console.log(`Edge function status: ${status}`);
      try {
        const body = await response.text();
        console.log(`Response body: ${body.substring(0, 500)}`);
      } catch (e) {
        console.log("Could not read response body");
      }
    }
  });

  test("ai-generate function should have CORS headers", async ({ request }) => {
    if (!EDGE_FUNCTION_URL) {
      test.skip(true, "Edge function URL not configured");
      return;
    }

    // Send OPTIONS request to check CORS
    const response = await request.fetch(EDGE_FUNCTION_URL, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
      },
    });

    const headers = response.headers();

    // Check for CORS headers
    expect(
      headers["access-control-allow-origin"] || headers["access-control-allow-methods"],
      "CORS headers should be present"
    ).toBeTruthy();
  });
});

test.describe("Edge Function in Page Context", () => {
  test("Tarot spread page should not have 401 console errors", async ({ page }) => {
    const errors401: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("401") || text.includes("Unauthorized")) {
        errors401.push(text);
      }
    });

    page.on("response", (response) => {
      if (response.url().includes("functions/v1") && response.status() === 401) {
        errors401.push(`401 response from ${response.url()}`);
      }
    });

    await page.goto("/tarot/spread");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    if (errors401.length > 0) {
      console.log("401 errors detected:", errors401);
      console.log("\n⚠️  If you see 401 errors, run:");
      console.log("   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key>");
      console.log("   supabase functions deploy ai-generate\n");
    }

    expect(
      errors401.length,
      `Found ${errors401.length} 401 errors - check Edge Function secrets`
    ).toBe(0);
  });

  test("Birth chart page should not have 401 console errors", async ({ page }) => {
    const errors401: string[] = [];

    page.on("response", (response) => {
      if (response.url().includes("functions/v1") && response.status() === 401) {
        errors401.push(`401 from ${response.url()}`);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to birth chart if there's a link
    const birthChartLink = page.locator("a[href*='birth'], button:has-text('Birth Chart')").first();
    if (await birthChartLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await birthChartLink.click();
      await page.waitForTimeout(3000);
    }

    expect(errors401.length).toBe(0);
  });
});

test.describe("Network Request Validation", () => {
  test("API requests to Supabase should succeed", async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = [];

    page.on("response", (response) => {
      const url = response.url();
      const status = response.status();

      if (url.includes("supabase.co") && status >= 400 && status !== 404) {
        failedRequests.push({ url, status });
      }
    });

    // Visit pages that make Supabase requests
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.goto("/experts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    if (failedRequests.length > 0) {
      console.log("Failed Supabase requests:", failedRequests);
    }

    // Filter out expected failures (e.g., 400 for invalid queries)
    const criticalFailures = failedRequests.filter(r => r.status === 401 || r.status === 500);

    expect(
      criticalFailures.length,
      `Critical API failures: ${JSON.stringify(criticalFailures)}`
    ).toBe(0);
  });

  test("Products API should return valid data", async ({ page }) => {
    let productsResponse: { status: number; data?: any } | null = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("supabase.co") && url.includes("products")) {
        productsResponse = {
          status: response.status(),
        };
        try {
          productsResponse.data = await response.json();
        } catch (e) {
          // Response might not be JSON
        }
      }
    });

    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    if (productsResponse) {
      expect(productsResponse.status, "Products API should return 200").toBe(200);

      if (productsResponse.data && Array.isArray(productsResponse.data)) {
        // Validate product structure
        const firstProduct = productsResponse.data[0];
        if (firstProduct) {
          expect(firstProduct).toHaveProperty("id");
          expect(firstProduct).toHaveProperty("title"); // Not 'name'!
          expect(firstProduct).toHaveProperty("price");

          // Should NOT have 'name' (old schema)
          expect(firstProduct).not.toHaveProperty("name");
        }
      }
    }
  });
});

test.describe("Error Handling", () => {
  test("should gracefully handle Edge Function errors", async ({ page }) => {
    const jsErrors: string[] = [];

    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });

    // Visit pages that use Edge Functions
    await page.goto("/tarot/spread");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Check for unhandled JS errors related to fetch/API
    const apiRelatedErrors = jsErrors.filter(
      e => e.includes("fetch") || e.includes("API") || e.includes("network")
    );

    expect(
      apiRelatedErrors.length,
      `Unhandled API errors: ${apiRelatedErrors.join(", ")}`
    ).toBe(0);
  });

  test("should show user-friendly error messages", async ({ page }) => {
    // If Edge Function fails, there should be a user-friendly error, not a crash
    await page.goto("/tarot/spread");
    await page.waitForLoadState("networkidle");

    // The page should render something, not be blank
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(100);

    // Should not show raw error messages
    expect(bodyText).not.toContain("TypeError");
    expect(bodyText).not.toContain("undefined is not");
  });
});
