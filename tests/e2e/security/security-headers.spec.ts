/**
 * Security Headers Validation Tests
 *
 * Validates that all required security headers are present and correctly configured
 * according to OWASP recommendations and the vercel.json configuration.
 */

import { test, expect, type Response } from "@playwright/test";

// Required security headers from vercel.json
const REQUIRED_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-xss-protection": "1; mode=block",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
};

// Headers that should exist (value checked separately)
const REQUIRED_HEADER_KEYS = [
  "content-security-policy",
  "permissions-policy",
];

// Test paths to verify headers on different routes
const TEST_PATHS = [
  "/",
  "/shop",
  "/tarot/daily",
  "/admin",
];

test.describe("Security Headers", () => {
  test.describe("Required Headers Presence", () => {
    for (const [header, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
      test(`should have ${header} header`, async ({ page }) => {
        const response = await page.goto("/");
        expect(response).not.toBeNull();

        const headerValue = response!.headers()[header];
        expect(headerValue, `${header} header should be present`).toBeTruthy();
        expect(
          headerValue?.toLowerCase(),
          `${header} should be "${expectedValue}"`
        ).toBe(expectedValue.toLowerCase());
      });
    }

    for (const header of REQUIRED_HEADER_KEYS) {
      test(`should have ${header} header`, async ({ page }) => {
        const response = await page.goto("/");
        expect(response).not.toBeNull();

        const headerValue = response!.headers()[header];
        expect(headerValue, `${header} header should be present`).toBeTruthy();
      });
    }
  });

  test.describe("Headers on All Routes", () => {
    for (const path of TEST_PATHS) {
      test(`${path} should have security headers`, async ({ page }) => {
        const response = await page.goto(path);

        // Skip if page doesn't exist (404)
        if (response?.status() === 404) {
          test.skip(true, `${path} returned 404`);
          return;
        }

        expect(response).not.toBeNull();

        // Check critical headers
        expect(response!.headers()["x-content-type-options"]).toBe("nosniff");
        expect(response!.headers()["x-frame-options"]).toBeTruthy();
        expect(response!.headers()["content-security-policy"]).toBeTruthy();
      });
    }
  });

  test.describe("X-Frame-Options", () => {
    test("should prevent clickjacking with DENY", async ({ page }) => {
      const response = await page.goto("/");
      const xFrameOptions = response!.headers()["x-frame-options"];

      expect(xFrameOptions).toBe("DENY");
    });
  });

  test.describe("X-Content-Type-Options", () => {
    test("should prevent MIME type sniffing", async ({ page }) => {
      const response = await page.goto("/");
      const xContentTypeOptions = response!.headers()["x-content-type-options"];

      expect(xContentTypeOptions).toBe("nosniff");
    });
  });

  test.describe("Strict-Transport-Security", () => {
    test("should enforce HTTPS with HSTS", async ({ page }) => {
      const response = await page.goto("/");
      const hsts = response!.headers()["strict-transport-security"];

      expect(hsts).toBeTruthy();
      expect(hsts).toContain("max-age=31536000");
      expect(hsts).toContain("includeSubDomains");
    });
  });

  test.describe("Referrer-Policy", () => {
    test("should have strict referrer policy", async ({ page }) => {
      const response = await page.goto("/");
      const referrerPolicy = response!.headers()["referrer-policy"];

      expect(referrerPolicy).toBe("strict-origin-when-cross-origin");
    });
  });

  test.describe("Permissions-Policy", () => {
    test("should restrict dangerous permissions", async ({ page }) => {
      const response = await page.goto("/");
      const permissionsPolicy = response!.headers()["permissions-policy"];

      expect(permissionsPolicy).toBeTruthy();
      // Camera and microphone should be restricted
      expect(permissionsPolicy).toContain("camera=()");
      expect(permissionsPolicy).toContain("microphone=()");
    });
  });

  test.describe("Static Asset Headers", () => {
    test("JS files should have correct cache headers", async ({ page, request }) => {
      // First load the page to get JS file URLs
      await page.goto("/");

      // Try to get a JS file
      const jsFiles = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script[src]"));
        return scripts.map(s => (s as HTMLScriptElement).src).filter(src => src.includes(".js"));
      });

      if (jsFiles.length > 0) {
        const jsUrl = jsFiles[0];
        const response = await request.get(jsUrl);
        const cacheControl = response.headers()["cache-control"];

        // Verify immutable caching for static assets
        if (jsUrl.includes("/assets/")) {
          expect(cacheControl).toContain("max-age=31536000");
        }
      }
    });

    test("CSS files should have correct cache headers", async ({ page, request }) => {
      await page.goto("/");

      const cssFiles = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("link[rel='stylesheet']"));
        return links.map(l => (l as HTMLLinkElement).href).filter(href => href.includes(".css"));
      });

      if (cssFiles.length > 0) {
        const cssUrl = cssFiles[0];
        const response = await request.get(cssUrl);
        const cacheControl = response.headers()["cache-control"];

        if (cssUrl.includes("/assets/")) {
          expect(cacheControl).toContain("max-age=31536000");
        }
      }
    });
  });
});

test.describe("Security Header Completeness", () => {
  test("should have all OWASP recommended headers", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response!.headers();

    const requiredByOWASP = [
      "x-content-type-options",
      "x-frame-options",
      "strict-transport-security",
      "content-security-policy",
    ];

    const missingHeaders: string[] = [];

    for (const header of requiredByOWASP) {
      if (!headers[header]) {
        missingHeaders.push(header);
      }
    }

    expect(
      missingHeaders.length,
      `Missing OWASP headers: ${missingHeaders.join(", ")}`
    ).toBe(0);
  });
});
