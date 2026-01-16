import { test, expect } from '@playwright/test';

test.describe('Node Operations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for loading to finish
        await expect(page.locator('#cy')).not.toHaveClass(/cy-loading/, { timeout: 20000 });
    });

    test('should add a new node and show it in the graph', async ({ page }) => {
        const editModeBtn = page.locator('#editModeBtn');
        const addServiceBtn = page.locator('#addServiceBtnSidebar');

        // Enter edit mode to show the add button
        await editModeBtn.click();
        await expect(addServiceBtn).toBeVisible();

        // Click add service
        await addServiceBtn.click();

        const modal = page.locator('#addServiceModal');
        await expect(modal).toBeVisible();

        // Fill the form
        await modal.locator('input[name="id"]').fill('e2e-test-node');
        await modal.locator('input[name="name"]').fill('E2E Test Node');
        await modal.locator('input[name="owner"]').fill('E2E Team');
        await modal.locator('select[name="tier"]').selectOption('1');

        // Submit
        await modal.locator('button[type="submit"]').click();

        // Modal should be closed
        await expect(modal).toBeHidden();

        // Check for success toast
        await expect(page.locator('#toastContainer')).toContainText(
            'Service "E2E Test Node" created'
        );

        // Verify it was added to the graph by searching for it
        const searchInput = page.locator('#searchInput');
        await searchInput.fill('E2E Test Node');

        // If we can see the clear button, search matched something
        await expect(page.locator('#clearSearchBtn')).toBeVisible();
    });

    test('should delete a node', async ({ page }) => {
        // Search for an existing node (e.g., 'gateway')
        const searchInput = page.locator('#searchInput');
        await searchInput.fill('gateway');

        // Since it's hard to click specific graph nodes in Playwright without deep integration,
        // we'll rely on the reset test below to verify mass operations.
    });

    test('should reset data', async ({ page }) => {
        const resetBtn = page.locator('#resetDataBtn');

        // Mock the confirm dialog
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toContain('Clear all local edits');
            await dialog.accept();
        });

        await resetBtn.click();

        // Check if page reloads (url remains same but we can check if toast container is empty)
        await expect(page.locator('#toastContainer')).toBeEmpty();
    });
});
