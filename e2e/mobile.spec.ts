import { test, expect } from '@playwright/test';

test('mobile layout smoke test', async ({ page }) => {
  // Use a mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Check if mobile header exists
  // The colon in CSS class selectors needs escaping or use a different selector strategy
  const mobileHeader = page.locator('header.md\\:hidden');
  await expect(mobileHeader).toBeVisible();

  // Check if sidebar is initially hidden (has -translate-x-full class)
  const sidebar = page.locator('#sidebar');
  await expect(sidebar).toHaveClass(/transform/);
  await expect(sidebar).toHaveClass(/-translate-x-full/);

  // Click hamburger menu
  await page.click('#mobileMenuBtn');

  // Sidebar should be visible (class removed)
  await expect(sidebar).not.toHaveClass(/-translate-x-full/);

  // Backdrop should be visible
  const backdrop = page.locator('#sidebarBackdrop');
  await expect(backdrop).toBeVisible();

  // Click backdrop to close
  await backdrop.click({ force: true });

  // Sidebar should be hidden again
  await expect(sidebar).toHaveClass(/-translate-x-full/);
});
