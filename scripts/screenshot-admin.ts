import { chromium } from '@playwright/test';
import path from 'path';

async function screenshotAdmin() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:3000/admin...');
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Waiting for page to load completely...');
    await page.waitForTimeout(5000);

    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(process.cwd(), '.playwright-mcp', `admin-page-${timestamp}.png`);

    console.log('Taking screenshot...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Get page title and URL
    const title = await page.title();
    const url = page.url();

    console.log(`Page title: ${title}`);
    console.log(`Current URL: ${url}`);

    // Check if there's a login form or authentication required
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
    const hasSignInButton = await page.locator('button:has-text("Sign In"), button:has-text("Login")').count() > 0;

    if (hasLoginForm || hasSignInButton) {
      console.log('Authentication appears to be required (login form detected)');
    }

    // Check for sidebar elements
    const hasSidebar = await page.locator('aside, nav[role="navigation"], [class*="sidebar"]').count() > 0;
    console.log(`Sidebar detected: ${hasSidebar}`);

    return {
      screenshotPath,
      title,
      url,
      requiresAuth: hasLoginForm || hasSignInButton,
      hasSidebar
    };

  } catch (error) {
    console.error('Error during screenshot capture:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

screenshotAdmin()
  .then((result) => {
    console.log('\n=== Results ===');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });