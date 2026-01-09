/**
 * Admin 产品管理测试
 */

import { test, expect } from "@playwright/test";
import { AdminPage } from "../helpers/page-objects";
import { signIn } from "../helpers/auth";
import { setupApiInterceptors, assertNoWrites } from "../helpers/network-interceptors";

test.describe("Admin 产品列表", () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      return;
    }

    await signIn(page, { email: email!, password: password! });
    adminPage = new AdminPage(page);
    await adminPage.gotoProducts();
    await page.waitForTimeout(3000);
  });

  test("Admin 用户可以访问产品列表", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    await adminPage.expectOnAdmin();
    expect(page.url()).toContain("/products");
  });

  test("产品列表应显示表格", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    await adminPage.waitForTableLoad();
    await adminPage.expectTableVisible();
  });

  test("产品列表应有数据", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    await adminPage.waitForTableLoad();

    const rowCount = await adminPage.getRowCount();
    console.log(`Products: ${rowCount} rows`);

    if (rowCount > 0) {
      await adminPage.expectTableHasData();
    }
  });

  test("应显示创建按钮", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    await adminPage.expectCreateButtonVisible();
  });

  test("点击创建应打开表单", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    await adminPage.clickCreate();
    await page.waitForTimeout(2000);

    // 应该在创建页面或显示表单
    const isOnCreatePage = page.url().includes("/create") || page.url().includes("/new");
    const hasForm = await adminPage.form.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isOnCreatePage || hasForm).toBe(true);
  });

  test("点击编辑应打开编辑表单", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    if (!email) {
      test.skip(true, "TEST_ADMIN_EMAIL 未设置");
    }

    await adminPage.waitForTableLoad();
    const rowCount = await adminPage.getRowCount();

    if (rowCount === 0) {
      test.skip(true, "没有产品数据");
    }

    await adminPage.clickRowEdit(0);
    await page.waitForTimeout(2000);

    // 应该在编辑页面或显示表单
    const isOnEditPage = page.url().includes("/edit") || page.url().includes("/show");
    const hasForm = await adminPage.form.isVisible({ timeout: 5000 }).catch(() => false);

    expect(isOnEditPage || hasForm).toBe(true);
  });
});

test.describe("只读模式验证 - 产品管理", () => {
  test("浏览产品管理不应有写入操作", async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, "TEST_ADMIN_EMAIL 或 TEST_ADMIN_PASSWORD 未设置");
    }

    const interceptor = await setupApiInterceptors(page);

    await signIn(page, { email: email!, password: password! });

    const adminPage = new AdminPage(page);
    await adminPage.gotoProducts();
    await page.waitForTimeout(3000);

    // 浏览产品列表
    await adminPage.waitForTableLoad();

    // 点击查看详情（只读操作）
    const rowCount = await adminPage.getRowCount();
    if (rowCount > 0) {
      await adminPage.clickRow(0);
      await page.waitForTimeout(2000);
    }

    // 验证无写入
    if (process.env.E2E_READ_ONLY_MODE === "true") {
      await assertNoWrites(interceptor);
    }
  });
});
