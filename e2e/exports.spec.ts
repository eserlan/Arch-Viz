import { test, expect, Page } from '@playwright/test';

/**
 * Helper to intercept cy.png and verify that it's called with the correct options.
 * Ensures the original method is restored even if the assertion or click fails.
 */
const checkViewportExport = (page: Page, buttonId: string) => {
    return page.evaluate((id) => {
        const cy = (window as Record<string, any>).cy;
        const originalPng = cy.png;
        let capturedFull = true;

        try {
            cy.png = (options: { full: boolean }) => {
                capturedFull = options.full;
                // Return something valid to avoid downstream errors, though we don't need the result
                return originalPng.call(cy, options);
            };

            const btn = document.getElementById(id);
            if (!btn) throw new Error(`Button with id ${id} not found`);
            btn.click();

            return capturedFull === false;
        } finally {
            // Restore original method
            cy.png = originalPng;
        }
    }, buttonId);
};

test.describe('Image Export', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should capture only viewport when saving PNG', async ({ page }) => {
        const isViewportOnly = await checkViewportExport(page, 'saveImageBtn');
        expect(isViewportOnly).toBe(true);
    });

    test('should capture only viewport when copying to clipboard', async ({ page }) => {
        const isViewportOnly = await checkViewportExport(page, 'copyImageBtn');
        expect(isViewportOnly).toBe(true);
    });
});
