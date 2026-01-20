import { test, expect } from '@playwright/test';

test.describe('Node Selection Behavior', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) => console.log('BROWSER:', msg.text()));
        await page.goto('/');
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
        await page.waitForTimeout(2000);
    });

    test('programmatic toggle logic should work', async ({ page }) => {
        const nodeId = await page.evaluate(() => window.cy.nodes()[0].id());

        // Select via programmatic tap with Ctrl
        await page.evaluate((id) => {
            const n = window.cy.getElementById(id);
            // Simulate tapstart to capture initial state
            n.emit('tapstart');
            // Simulate tap with ctrl
            n.emit('tap', { originalEvent: { ctrlKey: true } });
        }, nodeId);

        expect(await page.evaluate((id) => window.cy.getElementById(id).selected(), nodeId)).toBe(
            true
        );

        // Toggle off via programmatic tap with Ctrl
        await page.evaluate((id) => {
            const n = window.cy.getElementById(id);
            n.emit('tapstart');
            n.emit('tap', { originalEvent: { ctrlKey: true } });
        }, nodeId);

        expect(await page.evaluate((id) => window.cy.getElementById(id).selected(), nodeId)).toBe(
            false
        );
    });

    test('should select a single node on click', async ({ page }) => {
        const node = await page.evaluate(() => {
            const n = window.cy.nodes()[0];
            return { id: n.id(), pos: n.renderedPosition() };
        });

        const cyBoundingBox = await page.locator('#cy').boundingBox();
        if (!cyBoundingBox) throw new Error('Cy container not found');

        const clickX = cyBoundingBox.x + node.pos.x;
        const clickY = cyBoundingBox.y + node.pos.y;

        const elAtPoint = await page.evaluate(
            (pos) => {
                const el = document.elementFromPoint(pos.x, pos.y);
                const result = el
                    ? { id: el.id, className: el.className, tagName: el.tagName }
                    : null;
                console.log(`Element at (${pos.x}, ${pos.y}):`, JSON.stringify(result));
                return result;
            },
            { x: clickX, y: clickY }
        );

        console.log(`Clicking node ${node.id} at ${clickX}, ${clickY}`);
        await page.mouse.click(clickX, clickY);

        // Wait and check selection
        await expect
            .poll(
                async () => {
                    const isSelected = await page.evaluate(
                        (id) => window.cy.getElementById(id).selected(),
                        node.id
                    );
                    const selectedCount = await page.evaluate(
                        () => window.cy.nodes(':selected').length
                    );
                    console.log(
                        `Selection state for ${node.id}: ${isSelected}, count: ${selectedCount}`
                    );
                    return isSelected;
                },
                { timeout: 5000 }
            )
            .toBe(true);
    });

    test('should multi-select with Ctrl + click', async ({ page }) => {
        const nodes = await page.evaluate(() => {
            return window.cy
                .nodes()
                .slice(0, 2)
                .map((n) => ({ id: n.id(), pos: n.renderedPosition() }));
        });

        const cyBoundingBox = await page.locator('#cy').boundingBox();
        if (!cyBoundingBox) throw new Error('Cy container not found');

        // Click first node
        await page.mouse.click(cyBoundingBox.x + nodes[0].pos.x, cyBoundingBox.y + nodes[0].pos.y);
        await expect(
            page.evaluate((id) => window.cy.getElementById(id).selected(), nodes[0].id)
        ).resolves.toBe(true);

        // Ctrl + Click second node
        await page.keyboard.down('Control');
        await page.mouse.click(cyBoundingBox.x + nodes[1].pos.x, cyBoundingBox.y + nodes[1].pos.y);
        await page.keyboard.up('Control');

        await expect(page.evaluate(() => window.cy.nodes(':selected').length)).resolves.toBe(2);
    });
});
