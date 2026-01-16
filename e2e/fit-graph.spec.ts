import { test, expect } from '@playwright/test';

test.describe('Fit Graph Button', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should fit graph when button is clicked', async ({ page }) => {
        // Zoom in significantly to move things out of view
        await page.evaluate(() => {
            const cy = (window as any).cy;
            cy.zoom(5);
            cy.center();
        });

        // Get current zoom level
        const zoomBefore = await page.evaluate(() => (window as any).cy.zoom());

        // Click the Fit Graph button
        const fitBtn = page.locator('#fitGraphBtn');
        await fitBtn.click();

        // Wait a bit for the fit animation (though it's usually instant in tests if not animated)
        // In appUi.ts we called cy.fit() which is synchronous unless animations are enabled.

        // Get zoom after fit
        const zoomAfter = await page.evaluate(() => (window as any).cy.zoom());

        // Zoom should have decreased to fit everything
        expect(zoomAfter).toBeLessThan(zoomBefore);

        // Verify that the graph is centered
        const isCentered = await page.evaluate(() => {
            const cy = (window as any).cy;
            const extent = cy.extent();
            const boundingBox = cy.elements().boundingBox();

            // Check if bounding box is roughly within the extent
            return boundingBox.x1 >= extent.x1 &&
                boundingBox.x2 <= extent.x2 &&
                boundingBox.y1 >= extent.y1 &&
                boundingBox.y2 <= extent.y2;
        });

        // Note: cy.fit might result in some nodes being slightly off if there's padding,
        // but it should generally be within or close to the extent.
        // Actually, cy.fit(undefined, 50) specifically fits into the viewport with padding.
        expect(isCentered).toBe(true);
    });
});
