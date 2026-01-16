import { test, expect } from '@playwright/test';

test.describe('Image Export', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should capture only viewport when saving PNG', async ({ page }) => {
        // Intercept cy.png and verify options
        const isViewportOnly = await page.evaluate(async () => {
            const cy = (window as any).cy;
            let capturedFull = true;

            const originalPng = cy.png.bind(cy);
            cy.png = (options: any) => {
                capturedFull = options.full;
                return originalPng(options);
            };

            const saveBtn = document.getElementById('saveImageBtn');
            saveBtn?.click();

            return capturedFull === false;
        });

        expect(isViewportOnly).toBe(true);
    });

    test('should capture only viewport when copying to clipboard', async ({ page }) => {
        // Intercept cy.png and verify options
        const isViewportOnly = await page.evaluate(async () => {
            const cy = (window as any).cy;
            let capturedFull = true;

            const originalPng = cy.png.bind(cy);
            cy.png = (options: any) => {
                capturedFull = options.full;
                return originalPng(options);
            };

            const copyBtn = document.getElementById('copyImageBtn');
            copyBtn?.click();

            return capturedFull === false;
        });

        expect(isViewportOnly).toBe(true);
    });
});
