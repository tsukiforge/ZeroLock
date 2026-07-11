/**
 * ZeroLock E2E Tests
 *
 * Basic placeholder for Playwright E2E tests.
 * Full E2E tests require a Chrome browser with the extension loaded.
 */

import { test, expect } from '@playwright/test';

test.describe('ZeroLock Extension', () => {
  test('should load the popup HTML', async ({ page }) => {
    // Navigate to the popup page directly (for testing in dev mode)
    await page.goto('http://localhost:5173/popup/index.html');

    // Verify the page title
    await expect(page).toHaveTitle(/ZeroLock/);
  });

  test('should have the dashboard header', async ({ page }) => {
    await page.goto('http://localhost:5173/popup/index.html');

    // Check that the ZeroLock title exists
    const header = page.locator('.dashboard-title');
    await expect(header).toHaveText('ZeroLock');
  });
});
