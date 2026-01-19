import { test, expect } from '@playwright/test';

test.describe('Service Panel Minimize/Restore', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear localStorage to ensure a clean state
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should minimize and restore the service panel', async ({ page }) => {
        // 1. Select a node to open the panel
        // Using evaluation to trigger Cytoscape logic reliably
        await page.evaluate(() => {
            if ((window as any).cy) {
                const node = (window as any).cy.nodes()[0];
                node.select();
                node.trigger('tap');
            }
        });

        const panel = page.locator('#servicePanel');
        const content = page.locator('#panelContent');
        const minimizeBtn = page.locator('#minimizeBtn');

        await expect(panel).toBeVisible();
        await expect(panel).toHaveClass(/active/);
        await expect(panel).not.toHaveClass(/minimized/);
        await expect(content).toBeVisible();

        // 2. Click minimize
        await minimizeBtn.click();
        await expect(panel).toHaveClass(/minimized/);
        await expect(content).toBeHidden();

        // 3. Click restore
        await minimizeBtn.click();
        await expect(panel).not.toHaveClass(/minimized/);
        await expect(content).toBeVisible();
    });

    test('should persist minimized state across refreshes', async ({ page }) => {
        // 1. Open and minimize panel
        await page.evaluate(() => {
            if ((window as any).cy) {
                const node = (window as any).cy.nodes()[0];
                node.select();
                node.trigger('tap');
            }
        });

        const panel = page.locator('#servicePanel');
        const minimizeBtn = page.locator('#minimizeBtn');

        await minimizeBtn.click();
        await expect(panel).toHaveClass(/minimized/);

        // 2. Reload page
        await page.reload();
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });

        // 3. Select the same node again
        await page.evaluate(() => {
            if ((window as any).cy) {
                const node = (window as any).cy.nodes()[0];
                node.select();
                node.trigger('tap');
            }
        });

        // 4. Verify it's still minimized
        await expect(panel).toHaveClass(/minimized/);
    });

    test('should integrate correctly with Focus Mode', async ({ page }) => {
        // 1. Open and minimize panel
        await page.evaluate(() => {
            if ((window as any).cy) {
                const node = (window as any).cy.nodes()[0];
                node.select();
                node.trigger('tap');
            }
        });

        const panel = page.locator('#servicePanel');
        const minimizeBtn = page.locator('#minimizeBtn');
        const focusToggle = page.locator('#focusModeToggle');

        await minimizeBtn.click();
        await expect(panel).toHaveClass(/minimized/);

        // 2. Toggle Focus Mode ON
        await focusToggle.click();
        await expect(panel).toHaveClass(/focus-mode-hidden/);

        // 3. Toggle Focus Mode OFF
        await focusToggle.click();
        await expect(panel).not.toHaveClass(/focus-mode-hidden/);
        await expect(panel).toHaveClass(/minimized/);
    });
});
