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

    test('should minimize the Labels panel when minimize button is clicked', async ({ page }) => {
        const panel = page.locator('#floatingFilterPanel');

        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveClass(/minimized/);

        // Click minimize - panel becomes hidden
        await page.evaluate(() => document.getElementById('minimizeLabelsBtn')?.click());
        await expect(panel).toHaveClass(/minimized/);
        await expect(panel).toBeHidden(); // Panel is fully hidden when minimized
    });

    test('should minimize the Teams panel when minimize button is clicked', async ({ page }) => {
        const panel = page.locator('#floatingTeamPanel');

        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveClass(/minimized/);

        // Click minimize - panel becomes hidden
        await page.evaluate(() => document.getElementById('minimizeTeamsBtn')?.click());
        await expect(panel).toHaveClass(/minimized/);
        await expect(panel).toBeHidden(); // Panel is fully hidden when minimized
    });

    test('should restore panels via sidebar buttons', async ({ page }) => {
        const labelsPanel = page.locator('#floatingFilterPanel');
        const teamsPanel = page.locator('#floatingTeamPanel');

        // 1. Minimize both panels
        await page.evaluate(() => document.getElementById('minimizeLabelsBtn')?.click());
        await page.evaluate(() => document.getElementById('minimizeTeamsBtn')?.click());
        await expect(labelsPanel).toHaveClass(/minimized/);
        await expect(teamsPanel).toHaveClass(/minimized/);

        // 2. Click sidebar buttons to restore
        await page.locator('#highlightLabelsPanel').click();
        await expect(labelsPanel).not.toHaveClass(/minimized/);
        await expect(labelsPanel).toBeVisible();

        await page.locator('#highlightTeamsPanel').click();
        await expect(teamsPanel).not.toHaveClass(/minimized/);
        await expect(teamsPanel).toBeVisible();
    });

    test('should persist minimized state across refreshes', async ({ page }) => {
        const labelsPanel = page.locator('#floatingFilterPanel');
        const teamsPanel = page.locator('#floatingTeamPanel');

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
