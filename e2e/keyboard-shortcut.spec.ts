import { test, expect } from '@playwright/test';

test.describe('Edit Mode Keyboard Shortcut', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/Arch-Viz/');
        // Wait for the graph to load
        await page.waitForTimeout(2000);
    });

    test('should toggle edit mode with E key when a node is selected', async ({ page }) => {
        // Select a node by clicking on it via JavaScript
        await page.evaluate(() => {
            const cyInstance = (window as any).cy;
            if (cyInstance && cyInstance.nodes().length > 0) {
                const firstNode = cyInstance.nodes()[0];
                firstNode.emit('tap');
            }
        });

        // Wait for panel to appear
        await page.waitForTimeout(500);

        // Verify panel is visible
        const panel = page.locator('#servicePanel');
        await expect(panel).toHaveClass(/active/);

        // Verify edit button is visible
        const editBtn = page.locator('#editBtn');
        await expect(editBtn).toBeVisible();

        // Verify edit actions are hidden
        const editActions = page.locator('#editActions');
        await expect(editActions).toHaveClass(/hidden/);

        // Press 'e' key
        await page.keyboard.press('e');

        // Wait for UI to update
        await page.waitForTimeout(300);

        // Verify edit mode is now active
        await expect(editBtn).toBeHidden();
        await expect(editActions).not.toHaveClass(/hidden/);
        await expect(editActions).toBeVisible();

        // Press 'e' key again to exit edit mode
        await page.keyboard.press('e');

        // Wait for UI to update
        await page.waitForTimeout(300);

        // Verify edit mode is now inactive
        await expect(editBtn).toBeVisible();
        await expect(editActions).toHaveClass(/hidden/);
    });

    test('should not toggle edit mode when no node is selected', async ({ page }) => {
        // Ensure no node is selected
        const panel = page.locator('#servicePanel');
        await expect(panel).not.toHaveClass(/active/);

        // Press 'e' key
        await page.keyboard.press('e');

        // Wait a bit
        await page.waitForTimeout(300);

        // Verify nothing changed - panel should still be hidden
        await expect(panel).not.toHaveClass(/active/);
    });

    test('should not trigger when typing in search input', async ({ page }) => {
        // Select a node first
        await page.evaluate(() => {
            const cyInstance = (window as any).cy;
            if (cyInstance && cyInstance.nodes().length > 0) {
                const firstNode = cyInstance.nodes()[0];
                firstNode.emit('tap');
            }
        });

        // Wait for panel to appear
        await page.waitForTimeout(500);

        // Click on search input
        const searchInput = page.getByPlaceholder('Search by name...');
        await searchInput.click();

        // Type 'e' in the search field
        await searchInput.fill('e');

        // Wait a bit
        await page.waitForTimeout(300);

        // Verify edit mode was NOT activated
        const editBtn = page.locator('#editBtn');
        const editActions = page.locator('#editActions');
        await expect(editBtn).toBeVisible();
        await expect(editActions).toHaveClass(/hidden/);
    });
});
