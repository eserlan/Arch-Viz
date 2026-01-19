import { test, expect } from '@playwright/test';

test.describe('Focus Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should toggle visibility of UI panels', async ({ page }) => {
        const toggleBtn = page.locator('#focusModeToggle');
        const sidebar = page.locator('#appSidebar');
        const minimap = page.locator('#minimap');

        // Check initial state
        await expect(sidebar).toBeVisible();
        await expect(minimap).toBeVisible();
        await expect(page.locator('#focusModeCopyBtn')).toBeHidden();

        // Enable Focus Mode
        await toggleBtn.click();

        // Check hidden state
        await expect(sidebar).toBeHidden();
        await expect(minimap).toBeHidden();
        await expect(page.locator('#focusModeCopyBtn')).toBeVisible();

        // Disable Focus Mode
        await toggleBtn.click();

        // Check restored state
        await expect(sidebar).toBeVisible();
        await expect(minimap).toBeVisible();
        await expect(page.locator('#focusModeCopyBtn')).toBeHidden();
    });

    test('should trigger viewport export when clicked in focus mode', async ({ page }) => {
        const toggleBtn = page.locator('#focusModeToggle');

        // 1. Enable Focus Mode
        await toggleBtn.click();
        await expect(page.locator('#focusModeCopyBtn')).toBeVisible();

        // 2. Intercept cy.png to verify it's called with viewport-only setting (full: false)
        const isViewportOnly = await page.evaluate(() => {
            const cy = (window as Record<string, any>).cy;
            if (!cy) return false;

            const originalPng = cy.png;
            let capturedFull = true;

            try {
                cy.png = (options: { full: boolean }) => {
                    capturedFull = options.full;
                    return originalPng.call(cy, options);
                };

                const btn = document.getElementById('focusModeCopyBtn');
                if (!btn) return false;
                btn.click();

                return capturedFull === false;
            } finally {
                cy.png = originalPng;
            }
        });

        expect(isViewportOnly).toBe(true);
    });

    test('should not re-apply "hidden" class if it was removed by user before toggling', async ({
        page,
    }) => {
        const toggleBtn = page.locator('#focusModeToggle');
        // Labels panel typically has 'hidden' class (it's md:block but hidden on small screens)
        // In our test environment it might be visible, but we ensure it's "manual-on"
        const labelsPanel = page.locator('#floatingFilterPanel');

        // 1. Ensure it's visible and doesn't have 'hidden' (manual or default)
        await page.evaluate(() => {
            const el = document.getElementById('floatingFilterPanel');
            if (el) el.classList.remove('hidden');
        });
        await expect(labelsPanel).not.toHaveClass(/\bhidden\b/);

        // 2. Enable Focus Mode (should hide everything via focus-mode-hidden override)
        await toggleBtn.click();
        await expect(labelsPanel).toBeHidden();
        await expect(labelsPanel).toHaveClass(/focus-mode-hidden/);

        // 3. Disable Focus Mode
        await toggleBtn.click();

        // 4. Verify 'hidden' did NOT come back (bug fix check)
        await expect(labelsPanel).toBeVisible();
        await expect(labelsPanel).not.toHaveClass(/\bhidden\b/);
        await expect(labelsPanel).not.toHaveClass(/focus-mode-hidden/);
    });

    test('should persist focus mode state across refreshes', async ({ page }) => {
        const toggleBtn = page.locator('#focusModeToggle');
        const sidebar = page.locator('#appSidebar');

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
