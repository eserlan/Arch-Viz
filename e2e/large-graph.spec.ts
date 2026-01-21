import { test, expect } from '@playwright/test';

test.describe('Large Graph Support', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph container and ensures it's not loading
        await expect(page.locator('#cy')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });

        // Ensure window.cy is initialized
        await page.waitForFunction(() => (window as any).cy !== undefined, { timeout: 10000 });
    });

    test('should have a fit viewport button that fits the graph', async ({ page }) => {
        const fitBtn = page.locator('#fitViewportBtn');
        await expect(fitBtn).toBeVisible();

        // 1. Zoom in manually first to ensure "fit" does something
        await page.evaluate(() => {
            const cy = (window as any).cy;
            cy.zoom(2.0);
            cy.center(); // Center to be safe
        });

        const zoomedZoom = await page.evaluate(() => (window as any).cy.zoom());
        expect(zoomedZoom).toBe(2.0);

        // 2. Click fit button
        await fitBtn.click();

        // 3. Wait for the animation (approx 800ms) and verify zoom decreased
        await page.waitForTimeout(1200);

        const finalZoom = await page.evaluate(() => (window as any).cy.zoom());
        // Since it was 2.0 and we "fit" the whole graph, it should have zoomed out significantly
        expect(finalZoom).toBeLessThan(1.5);
    });

    test('should allow zooming out to 0.02', async ({ page }) => {
        // Zoom out manually via evaluation beyond the limit
        await page.evaluate(() => {
            (window as any).cy.zoom(0.001);
        });

        const zoom = await page.evaluate(() => (window as any).cy.zoom());
        // Should be clamped to minZoom which is now 0.02
        // We use a small range for floating point comparison
        expect(zoom).toBeGreaterThanOrEqual(0.019);
        expect(zoom).toBeLessThanOrEqual(0.022);
    });
});
