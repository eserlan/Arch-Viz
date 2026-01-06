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

test.describe('Search Input Focus Keyboard Shortcut', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/Arch-Viz/');
        // Wait for the graph to load
        await page.waitForTimeout(2000);
    });

    test('should focus search input when F key is pressed', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Verify search input is not focused initially
        await expect(searchInput).not.toBeFocused();

        // Press 'f' key
        await page.keyboard.press('f');

        // Wait for focus
        await page.waitForTimeout(100);

        // Verify search input is now focused
        await expect(searchInput).toBeFocused();
    });

    test('should clear text and blur when F is pressed twice quickly while focused', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Type some text in search
        await searchInput.fill('test search');
        await searchInput.focus();
        
        // Verify it's focused and has text
        await expect(searchInput).toBeFocused();
        await expect(searchInput).toHaveValue('test search');

        // Press 'f' key twice quickly
        await page.keyboard.press('f');
        await page.keyboard.press('f');

        // Wait for blur
        await page.waitForTimeout(100);

        // Verify search input is cleared and blurred
        await expect(searchInput).toHaveValue('');
        await expect(searchInput).not.toBeFocused();
    });

    test('should not clear text if F is pressed only once while focused', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Type some text in search
        await searchInput.fill('test search');
        await searchInput.focus();
        
        // Press 'f' key once
        await page.keyboard.press('f');
        
        // Wait a bit
        await page.waitForTimeout(100);

        // Should still be focused with text
        await expect(searchInput).toBeFocused();
        await expect(searchInput).toHaveValue('test search');
    });

    test('should handle uppercase F key', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Verify not focused initially
        await expect(searchInput).not.toBeFocused();

        // Press 'F' key (uppercase)
        await page.keyboard.press('F');

        // Wait for focus
        await page.waitForTimeout(100);

        // Verify search input is now focused
        await expect(searchInput).toBeFocused();
    });

    test('should not trigger when F is typed in another input', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Select a node to open the panel
        await page.evaluate(() => {
            const cyInstance = (window as any).cy;
            if (cyInstance && cyInstance.nodes().length > 0) {
                const firstNode = cyInstance.nodes()[0];
                firstNode.emit('tap');
            }
        });

        // Wait for panel to appear and click edit
        await page.waitForTimeout(500);
        await page.locator('#editBtn').click();
        await page.waitForTimeout(300);

        // Find an input field in the edit panel
        const panelInput = page.locator('#panelContent input').first();
        
        // Focus on the panel input
        await panelInput.focus();
        
        // Type 'f' in the panel input
        await page.keyboard.press('f');
        
        // Wait a bit
        await page.waitForTimeout(100);

        // Search input should not be focused
        await expect(searchInput).not.toBeFocused();
    });

    test('should not clear text if second F press is too slow', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Type some text in search
        await searchInput.fill('test search');
        await searchInput.focus();

        // Press 'f' key
        await page.keyboard.press('f');
        
        // Wait longer than the double-tap threshold (>300ms)
        await page.waitForTimeout(400);
        
        // Press 'f' key again
        await page.keyboard.press('f');
        
        // Wait a bit
        await page.waitForTimeout(100);

        // Should still be focused with text intact
        await expect(searchInput).toBeFocused();
        await expect(searchInput).toHaveValue('test search');
    });

    test('should not trigger when Ctrl+F is pressed', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Verify not focused initially
        await expect(searchInput).not.toBeFocused();

        // Press Ctrl+F (or Cmd+F on Mac)
        await page.keyboard.press('Control+f');

        // Wait a bit
        await page.waitForTimeout(100);

        // Search input should not be focused (browser's native find should be triggered instead)
        await expect(searchInput).not.toBeFocused();
    });

    test('should update filters when clearing text on double-tap', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search by name...');
        
        // Get total node count first (unfiltered)
        const totalCount = await page.evaluate(() => {
            const cyInstance = (window as any).cy;
            return cyInstance ? cyInstance.nodes().not('.filtered').length : 0;
        });
        
        // Type a search term that filters some nodes  
        await searchInput.fill('xyz123nonexistent');
        
        // Wait for filter to apply
        await page.waitForTimeout(300);
        
        // Get filtered count (should be 0 or very few)
        const filteredCount = await page.evaluate(() => {
            const cyInstance = (window as any).cy;
            return cyInstance ? cyInstance.nodes().not('.filtered').length : 0;
        });

        // Focus and double-tap F to clear
        await searchInput.focus();
        await page.keyboard.press('f');
        await page.keyboard.press('f');
        
        // Wait for filter to update
        await page.waitForTimeout(300);
        
        // Get node count after clearing (should show all nodes)
        const allCount = await page.evaluate(() => {
            const cyInstance = (window as any).cy;
            return cyInstance ? cyInstance.nodes().not('.filtered').length : 0;
        });

        // All nodes should be visible after clearing the filter
        expect(allCount).toBe(totalCount);
        expect(allCount).toBeGreaterThan(filteredCount);
    });
});

