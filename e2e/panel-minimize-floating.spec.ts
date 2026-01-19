import { test, expect } from '@playwright/test';

test.describe('Floating Panels Minimize/Restore', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear localStorage to ensure a clean state
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should minimize and restore the Labels panel', async ({ page }) => {
        const panel = page.locator('#floatingFilterPanel');
        const container = page.locator('#labelFilterContainer');

        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveClass(/opacity-0/);
        await expect(panel).not.toHaveClass(/minimized/);
        await expect(container).toBeVisible();

        // 1. Click minimize (using JS click to bypass potential Playwright stability issues)
        await page.evaluate(() => document.getElementById('minimizeLabelsBtn')?.click());
        await expect(panel).toHaveClass(/minimized/);
        await expect(container).toBeHidden();

        // 2. Click restore
        await page.evaluate(() => document.getElementById('minimizeLabelsBtn')?.click());
        await expect(panel).not.toHaveClass(/minimized/);
        await expect(container).toBeVisible();
    });

    test('should minimize and restore the Teams panel', async ({ page }) => {
        const panel = page.locator('#floatingTeamPanel');
        const container = page.locator('#teamFilterContainer');
        const minimizeBtn = page.locator('#minimizeTeamsBtn');

        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveClass(/opacity-0/);
        await expect(panel).not.toHaveClass(/minimized/);
        await expect(container).toBeVisible();

        // 1. Click minimize
        await minimizeBtn.click({ force: true });
        await expect(panel).toHaveClass(/minimized/);
        await expect(container).toBeHidden();

        // 2. Click restore
        await minimizeBtn.click({ force: true });
        await expect(panel).not.toHaveClass(/minimized/);
        await expect(container).toBeVisible();
    });

    test('should persist minimized state across refreshes for both panels', async ({ page }) => {
        const labelsPanel = page.locator('#floatingFilterPanel');
        const teamsPanel = page.locator('#floatingTeamPanel');

        await expect(labelsPanel).not.toHaveClass(/opacity-0/);
        await expect(teamsPanel).not.toHaveClass(/opacity-0/);

        // 1. Minimize both
        await page.evaluate(() => document.getElementById('minimizeLabelsBtn')?.click());
        await page.evaluate(() => document.getElementById('minimizeTeamsBtn')?.click());
        await expect(labelsPanel).toHaveClass(/minimized/);
        await expect(teamsPanel).toHaveClass(/minimized/);

        // 2. Reload page
        await page.reload();
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });

        // 3. Verify they are still minimized
        await expect(labelsPanel).toHaveClass(/minimized/);
        await expect(teamsPanel).toHaveClass(/minimized/);
    });
});
