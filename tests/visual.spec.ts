import { test, expect } from '@playwright/test';

test.describe('Silk & Spark UI Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('/');
        // Wait for the cosmic background or some key element
        await expect(page.locator('header')).toBeVisible();
    });

    const screens = [
        { id: 'HOME', title: 'Silk & Spark' },
        { id: 'BIRTH_CHART', title: 'Identify' },
        { id: 'SHOP_LIST', title: 'Shop' },
        { id: 'EXPERTS', title: 'Experts' },
        { id: 'USER_DASHBOARD', title: 'My Cosmic Space' },
        { id: 'ADMIN_PAYMENTS', title: 'Admin System' },
    ];

    for (const screen of screens) {
        test(`Navigate to ${screen.id} and verify rendering`, async ({ page }) => {
            // Use the navigation helper select added in App.tsx
            const selector = page.locator('select');
            await selector.selectOption(screen.id);

            // Verify page specific content (wait for animations)
            await page.waitForTimeout(500); // Give motion animations some time

            const bodyText = await page.innerText('body');
            expect(bodyText).toContain(screen.title);

            // Check for GlassCard presence (usually has backdrop-blur class)
            const glassCardCount = await page.locator('.backdrop-blur-xl, .backdrop-blur-md').count();
            expect(glassCardCount).toBeGreaterThan(0);
        });
    }

    test('Tarot Draw Flow', async ({ page }) => {
        await page.locator('select').selectOption('TAROT_DAILY');
        await expect(page.getByText('Your Energy Revealed')).toBeVisible();

        // Check if the card draw action is present
        const drawTrigger = page.getByText('Draw Card', { exact: false });
        await expect(drawTrigger).toBeVisible();

        // Optional: simulate click if possible, but might require long waits for AI simulation
    });
});
