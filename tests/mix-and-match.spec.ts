import { test, expect } from '@playwright/test';

test.describe('Mix & Match Page', () => {
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

    // Mock products to ensure we have tops and bottoms
    await page.route('**/rest/v1/products*', async route => {
      const products = [
        {
          id: '1',
          title: 'Silk Top',
          price: { amount: '120.00' },
          images: [{ url: 'https://example.com/top.jpg' }],
          category: 'Top',
          productType: 'Top'
        },
        {
          id: '2',
          title: 'Silk Pants',
          price: { amount: '150.00' },
          images: [{ url: 'https://example.com/bottom.jpg' }],
          category: 'Bottom',
          productType: 'Bottom'
        }
      ];
      await route.fulfill({ json: products });
    });

    await page.addInitScript(() => {
      localStorage.setItem('nina-armend-admin-v2', JSON.stringify({
        state: { settings: { isMaintenanceMode: false } },
        version: 0
      }));
    });
  });

  test('size buttons should be clickable', async ({ page }) => {
    await page.goto('/mix-and-match');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find the first size button for the top product (e.g., 'L')
    const sizeButton = page.locator('button').filter({ hasText: /^L$/ }).first();
    await expect(sizeButton).toBeVisible();

    // Scroll to the button to ensure it's in viewport
    await sizeButton.scrollIntoViewIfNeeded();

    // To verify interception, we can use evaluate to see what element is at the button's position
    const interceptionResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find(b => b.textContent?.trim() === 'L');
      if (!button) return { error: 'Button not found' };

      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(x, y);

      return {
        isIntercepted: elementAtPoint !== button && !button.contains(elementAtPoint),
        elementAtPointTag: elementAtPoint ? elementAtPoint.tagName : 'NULL',
        elementAtPointClass: elementAtPoint ? (elementAtPoint instanceof HTMLElement || elementAtPoint instanceof SVGElement ? elementAtPoint.className : String(elementAtPoint)) : 'NULL',
        buttonTag: button.tagName,
        buttonClass: button.className
      };
    });

    console.log('Interception result after fix:', interceptionResult);

    // Now we expect it NOT to be intercepted
    expect(interceptionResult.isIntercepted).toBe(false);
  });
});
