import { test, expect } from '@playwright/test';

test.describe('Focus Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should toggle visibility of UI panels', async ({ page }) => {
        const toggleBtn = page.locator('#focusModeToggle');
        const sidebar = page.locator('aside');
        const minimap = page.locator('#minimap');

        // Check initial state
        await expect(sidebar).toBeVisible();
        await expect(minimap).toBeVisible();

        // Enable Focus Mode
        await toggleBtn.click();

        // Check hidden state
        await expect(sidebar).toBeHidden();
        await expect(minimap).toBeHidden();

        // Disable Focus Mode
        await toggleBtn.click();

        // Check restored state
        await expect(sidebar).toBeVisible();
        await expect(minimap).toBeVisible();
    });

    test('should persist focus mode state across refreshes', async ({ page }) => {
        const toggleBtn = page.locator('#focusModeToggle');
        const sidebar = page.locator('aside');

        // Enable Focus Mode
        await toggleBtn.click();
        await expect(sidebar).toBeHidden();

        // Refresh
        await page.reload();
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });

        // Should still be hidden
        await expect(sidebar).toBeHidden();

        // Disable Focus Mode
        await toggleBtn.click();
        await expect(sidebar).toBeVisible();
    });
});
