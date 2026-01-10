/**
 * Content Security Policy (CSP) Validation Tests
 *
 * Ensures that:
 * 1. CSP headers are present in responses
 * 2. Required domains are allowed for each directive
 * 3. No CSP violations occur on critical pages
 * 4. External resources (images, scripts) load correctly
 */

import { test, expect, type Page } from "@playwright/test";

// Required domains that must be allowed in CSP
const REQUIRED_CSP_DOMAINS = {
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "*.supabase.co",
    "*.stripe.com",
    "lh3.googleusercontent.com", // Google-hosted images for products/experts
  ],
  "script-src": [
    "'self'",
    "js.stripe.com",
    "cdn.vercel-insights.com",
  ],
  "connect-src": [
    "'self'",
    "*.supabase.co",
    "api.stripe.com",
    "generativelanguage.googleapis.com",
  ],
  "style-src": [
    "'self'",
    "fonts.googleapis.com",
  ],
  "font-src": [
    "'self'",
    "fonts.gstatic.com",
  ],
};

// Critical pages that should have no CSP violations
const CRITICAL_PAGES = [
  { path: "/", name: "Home" },
  { path: "/shop", name: "Shop" },
  { path: "/tarot/daily", name: "Tarot Daily" },
  { path: "/tarot/spread", name: "Tarot Spread" },
  { path: "/experts", name: "Experts" },
];

test.describe("CSP Header Validation", () => {
  test("should have CSP header in response", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const cspHeader = response!.headers()["content-security-policy"];
    expect(cspHeader, "CSP header should be present").toBeTruthy();
  });

  test("CSP should allow required img-src domains", async ({ page }) => {
    const response = await page.goto("/");
    const cspHeader = response!.headers()["content-security-policy"] || "";

    // Extract img-src directive
    const imgSrcMatch = cspHeader.match(/img-src ([^;]+)/);
    expect(imgSrcMatch, "img-src directive should exist").toBeTruthy();

    const imgSrcValue = imgSrcMatch![1];

    for (const domain of REQUIRED_CSP_DOMAINS["img-src"]) {
      const domainPattern = domain.replace("*.", "").replace("'", "");
      expect(
        imgSrcValue.toLowerCase(),
        `img-src should include ${domain}`
      ).toContain(domainPattern.toLowerCase());
    }
  });

  test("CSP should allow required script-src domains", async ({ page }) => {
    const response = await page.goto("/");
    const cspHeader = response!.headers()["content-security-policy"] || "";

    const scriptSrcMatch = cspHeader.match(/script-src ([^;]+)/);
    expect(scriptSrcMatch, "script-src directive should exist").toBeTruthy();

    const scriptSrcValue = scriptSrcMatch![1];

    for (const domain of REQUIRED_CSP_DOMAINS["script-src"]) {
      const domainPattern = domain.replace("'", "");
      expect(
        scriptSrcValue.toLowerCase(),
        `script-src should include ${domain}`
      ).toContain(domainPattern.toLowerCase());
    }
  });

  test("CSP should allow required connect-src domains", async ({ page }) => {
    const response = await page.goto("/");
    const cspHeader = response!.headers()["content-security-policy"] || "";

    const connectSrcMatch = cspHeader.match(/connect-src ([^;]+)/);
    expect(connectSrcMatch, "connect-src directive should exist").toBeTruthy();

    const connectSrcValue = connectSrcMatch![1];

    for (const domain of REQUIRED_CSP_DOMAINS["connect-src"]) {
      const domainPattern = domain.replace("*.", "").replace("'", "");
      expect(
        connectSrcValue.toLowerCase(),
        `connect-src should include ${domain}`
      ).toContain(domainPattern.toLowerCase());
    }
  });
});

test.describe("CSP Violation Detection", () => {
  for (const pageConfig of CRITICAL_PAGES) {
    test(`${pageConfig.name} page should have no CSP violations`, async ({ page }) => {
      const cspViolations: string[] = [];

      // Listen for CSP violation reports
      page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().includes("Content Security Policy")) {
          cspViolations.push(msg.text());
        }
      });

      // Also listen for securitypolicyviolation events
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (e) => {
          console.error(`CSP Violation: ${e.violatedDirective} - ${e.blockedURI}`);
        });
      });

      await page.goto(pageConfig.path);
      await page.waitForLoadState("networkidle");

      // Wait a bit for any lazy-loaded resources
      await page.waitForTimeout(2000);

      if (cspViolations.length > 0) {
        console.log(`CSP violations on ${pageConfig.path}:`, cspViolations);
      }

      expect(
        cspViolations.length,
        `${pageConfig.name} should have no CSP violations: ${cspViolations.join(", ")}`
      ).toBe(0);
    });
  }
});

test.describe("External Resource Loading", () => {
  test("Google-hosted images should load without CSP errors", async ({ page }) => {
    const blockedImages: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("lh3.googleusercontent.com") && text.includes("blocked")) {
        blockedImages.push(text);
      }
    });

    // Navigate to shop page which uses Google-hosted product images
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    expect(
      blockedImages.length,
      `Google images should not be blocked: ${blockedImages.join(", ")}`
    ).toBe(0);
  });

  test("Stripe scripts should load correctly", async ({ page }) => {
    const blockedScripts: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("stripe") && text.includes("blocked")) {
        blockedScripts.push(text);
      }
    });

    // Navigate to a page that might load Stripe
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(
      blockedScripts.length,
      `Stripe scripts should not be blocked: ${blockedScripts.join(", ")}`
    ).toBe(0);
  });

  test("Supabase connections should not be blocked", async ({ page }) => {
    const blockedConnections: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("supabase") && text.includes("blocked")) {
        blockedConnections.push(text);
      }
    });

    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    expect(
      blockedConnections.length,
      `Supabase connections should not be blocked: ${blockedConnections.join(", ")}`
    ).toBe(0);
  });
});

test.describe("Image Loading Verification", () => {
  test("Product images should load on shop page", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // Wait for products to load
    await page.waitForSelector("[class*='grid'] img, .product-image, [data-testid='product-card'] img", {
      timeout: 10000,
    }).catch(() => null);

    // Get all images
    const images = await page.locator("img").all();
    const brokenImages: string[] = [];

    for (const img of images.slice(0, 10)) { // Check first 10 images
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const src = await img.getAttribute("src");

      if (naturalWidth === 0 && src && !src.startsWith("data:")) {
        brokenImages.push(src || "unknown");
      }
    }

    if (brokenImages.length > 0) {
      console.log("Broken images found:", brokenImages);
    }

    // Allow some tolerance for lazy loading
    expect(
      brokenImages.length,
      `Found ${brokenImages.length} broken images`
    ).toBeLessThan(3);
  });
});
