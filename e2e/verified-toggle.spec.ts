import { test, expect } from '@playwright/test';

test.describe('Verified Indicator Toggle', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for graph to load
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should toggle verified indicators on nodes', async ({ page }) => {
        const toggle = page.locator('#showVerifiedToggle');
        await expect(toggle).toBeVisible();

        // Initially checked
        await expect(toggle).toBeChecked();

        // Check if verified nodes have the class 'is-verified'
        const hasVerifiedClassInitially = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .every((n: any) => n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassInitially).toBe(true);

        // Toggle it OFF
        await toggle.click({ force: true });
        await expect(toggle).not.toBeChecked();

        // Check if verified nodes no longer have the class 'is-verified'
        const hasVerifiedClassAfterToggleOff = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .every((n: any) => !n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassAfterToggleOff).toBe(true);

        // Toggle it back ON
        await toggle.click({ force: true });
        await expect(toggle).toBeChecked();

        const hasVerifiedClassAfterToggleOn = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .every((n: any) => n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassAfterToggleOn).toBe(true);
    });

    test('should persist toggle state across refreshes', async ({ page }) => {
        const toggle = page.locator('#showVerifiedToggle');

        // Toggle it OFF
        await toggle.click({ force: true });
        await expect(toggle).not.toBeChecked();

        // Reload the page
        await page.reload();
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });

        // Should still be OFF
        await expect(page.locator('#showVerifiedToggle')).not.toBeChecked();

        // Check Cytoscape state too
        const hasVerifiedClassAfterReload = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy
                .nodes()
                .filter((n: any) => n.data('verified'))
                .some((n: any) => n.hasClass('is-verified'));
        });
        expect(hasVerifiedClassAfterReload).toBe(false);
    });

    test('should still toggle verified indicators after a CSV import', async ({ page }) => {
        const toggle = page.locator('#showVerifiedToggle');

        // 1. Simulate a CSV import
        const csvContent = `id,name,labels,tier,depends_on,owner,repo_url,verified
import1,Imported 1,label1,1,,team1,url1,true
import2,Imported 2,label2,2,import1,team2,url2,false`;

        await page.evaluate((content) => {
            const dataTransfer = new DataTransfer();
            const file = new File([content], 'test.csv', { type: 'text/csv' });
            dataTransfer.items.add(file);

            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer,
            });

            document.querySelector('main')?.dispatchEvent(dropEvent);
        }, csvContent);

        // 2. Wait for the new graph to be rendered
        // We can check if 'Imported 1' node exists in Cytoscape
        await page.waitForFunction(() => {
            const cy = (window as any).cy;
            return cy && cy.nodes().filter((n: any) => n.data('name') === 'Imported 1').length > 0;
        });

        // 3. Verify toggle still works
        await expect(toggle).toBeChecked();

        // Check if verified node has class
        const hasClass = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy.nodes('node[id="import1"]').hasClass('is-verified');
        });
        expect(hasClass).toBe(true);

        // Toggle OFF
        await toggle.click({ force: true });
        await expect(toggle).not.toBeChecked();

        const hasClassOff = await page.evaluate(() => {
            const cy = (window as any).cy;
            return cy.nodes('node[id="import1"]').hasClass('is-verified');
        });
        expect(hasClassOff).toBe(false);
    });
});
