import { test, expect } from '@playwright/test';

test.describe('Verified Indicator Toggle', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should toggle verified indicators on nodes', async ({ page }) => {
        const toggle = page.locator('#showVerifiedToggle');
        await expect(toggle).toBeVisible();

        // Initially checked
        await expect(toggle).toBeChecked();

        // Check if verified nodes have the class 'is-verified'
        const hasVerifiedClassInitially = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .every((n: any) => n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassInitially).toBe(true);

        // Toggle it OFF
        await toggle.click({ force: true });
        await expect(toggle).not.toBeChecked();

        // Check if verified nodes no longer have the class 'is-verified'
        const hasVerifiedClassAfterToggleOff = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .every((n: any) => !n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassAfterToggleOff).toBe(true);

        // Toggle it back ON
        await toggle.click({ force: true });
        await expect(toggle).toBeChecked();

        const hasVerifiedClassAfterToggleOn = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .every((n: any) => n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassAfterToggleOn).toBe(true);
    });

    test('should persist toggle state across refreshes', async ({ page }) => {
        const toggle = page.locator('#showVerifiedToggle');

        // Toggle it OFF
        await toggle.click({ force: true });
        await expect(toggle).not.toBeChecked();

        // Reload the page
        await page.reload();
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });

        // Should still be OFF
        await expect(page.locator('#showVerifiedToggle')).not.toBeChecked();

        // Check Cytoscape state too
        const hasVerifiedClassAfterReload = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .some((n: any) => n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassAfterReload).toBe(false);
    });
});
