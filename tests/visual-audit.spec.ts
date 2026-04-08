import { test, expect } from '@playwright/test';

const pages = [
  { name: 'Index', path: '/' },
  { name: 'Shop', path: '/shop' },
  { name: 'ProductPage', path: '/product/nina-luxury-bikini' },
  { name: 'Checkout', path: '/checkout' },
];

const viewports = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Mobile', width: 375, height: 667 },
];

test.describe('Visual Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase settings call to disable maintenance mode
    await page.route('**/rest/v1/store_settings*', async route => {
      const response = await route.fetch();
      const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        json[0].is_maintenance_mode = false;
      } else if (json && typeof json === 'object') {
        json.is_maintenance_mode = false;
      }
      await route.fulfill({ json });
    });

    // Also intercept public_store_settings
    await page.route('**/rest/v1/public_store_settings*', async route => {
      const response = await route.fetch();
        const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        json[0].is_maintenance_mode = false;
      } else if (json && typeof json === 'object') {
        json.is_maintenance_mode = false;
      }
      await route.fulfill({ json });
    });
  });

  for (const pageInfo of pages) {
    for (const viewport of viewports) {
      test(`${pageInfo.name} on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        await page.addInitScript(() => {
          localStorage.setItem('nina-armend-admin-v2', JSON.stringify({
            state: { settings: { isMaintenanceMode: false } },
            version: 0
          }));
        });

        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: `tests/screenshots/${pageInfo.name}-${viewport.name}.png`,
          fullPage: true,
        });
      });
    }
  }
});
