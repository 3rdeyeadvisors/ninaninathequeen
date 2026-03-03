import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to Fitting Room...');
    await page.goto('http://localhost:8080/fitting-room');
    await page.waitForTimeout(3000); // Wait for products to load

    await page.screenshot({ path: 'fitting-room-initial.png' });
    console.log('Initial screenshot saved.');

    const products = await page.$$('button.group\\/item');
    console.log('Found ' + products.length + ' products.');

    if (products.length > 0) {
        await products[0].click();
        console.log('Clicked first product.');
    }

    // Check if "No Photo Uploaded" is visible
    const noPhoto = await page.getByText('No Photo Uploaded').isVisible();
    console.log('No Photo Uploaded visible:', noPhoto);

    // Upload a photo
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('src/assets/nina-vision.jpeg');
    console.log('Uploaded nina-vision.jpeg');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'fitting-room-after-upload.png' });
    console.log('After upload screenshot saved.');

    // Check if product overlay is visible
    const overlay = await page.locator('.absolute.cursor-move.z-20').isVisible();
    console.log('Product overlay visible:', overlay);

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
})();
