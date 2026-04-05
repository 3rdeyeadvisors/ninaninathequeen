import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  // Check for the main hero text or a common element
  // Use first() to avoid strict mode violation if there are multiple h1s
  const mainHeading = page.locator('h1').first();
  await expect(mainHeading).toBeVisible();

  // Verify the page title
  // Based on the error log, the text "NINA ARMEND" is present with a space.
  await expect(page).toHaveTitle(/NINA ARMEND/i);
});
