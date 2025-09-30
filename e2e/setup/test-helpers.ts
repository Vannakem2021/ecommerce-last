import { Page, expect } from '@playwright/test';
import { TEST_USERS, TestUser } from '../fixtures/test-users';

/**
 * Test Helper Functions
 *
 * Reusable utilities for E2E tests.
 */

/**
 * Navigate to a specific page with locale
 */
export async function navigateTo(page: Page, path: string, locale = 'en-US') {
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  await page.goto(`/${locale}${fullPath}`);
}

/**
 * Login as a specific user
 */
export async function loginAs(page: Page, userKey: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userKey];

  // Navigate to sign-in page
  await navigateTo(page, '/sign-in');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  // Click sign in button
  await page.click('button[type="submit"]');

  // Wait for redirect after successful login (flexible URL matching)
  // Increased timeout to 30s to account for slower test environments
  await page.waitForURL((url) => !url.pathname.includes('sign-in'), { timeout: 30000 });

  // Verify we're not on sign-in page anymore
  if (page.url().includes('sign-in')) {
    throw new Error('Login failed - still on sign-in page');
  }
}

/**
 * Logout current user
 * Uses the sidebar menu instead of dropdown to avoid scrolling issues
 */
export async function logout(page: Page) {
  // Open the sidebar by clicking the menu button (contains MenuIcon and "All" text)
  await page.click('text=All');

  // Wait for sidebar to open and sign out button to be visible
  await page.waitForSelector('button:has-text("Sign out")', { state: 'visible', timeout: 5000 });

  // Click the "Sign out" button in the sidebar
  await page.click('button:has-text("Sign out")');

  // Wait for redirect to home page (logout redirects to /)
  await page.waitForURL((url) => !url.pathname.includes('account'), { timeout: 10000 });
}

/**
 * Check if user has access to admin panel
 */
export async function canAccessAdminPanel(page: Page): Promise<boolean> {
  try {
    await navigateTo(page, '/admin');
    await page.waitForLoadState('networkidle');

    // Check if we're still on admin page (not redirected)
    const url = page.url();
    return url.includes('/admin') && !url.includes('/unauthorized');
  } catch {
    return false;
  }
}

/**
 * Attempt to access a protected route
 */
export async function attemptAccess(page: Page, path: string): Promise<{
  allowed: boolean;
  statusCode?: number;
  redirected: boolean;
  finalUrl: string;
}> {
  const response = await page.goto(path);
  const statusCode = response?.status();
  const finalUrl = page.url();
  const redirected = !finalUrl.includes(path);

  return {
    allowed: statusCode === 200 && !redirected,
    statusCode,
    redirected,
    finalUrl,
  };
}

/**
 * Fill form with data
 */
export async function fillForm(page: Page, data: Record<string, string>) {
  for (const [field, value] of Object.entries(data)) {
    const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`;
    await page.fill(selector, value);
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) {
  return await page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) &&
      response.request().method() === method
  );
}

/**
 * Create a test order (helper for testing)
 */
export async function createTestOrder(page: Page) {
  // Implementation would depend on your app's flow
  // This is a placeholder
  await navigateTo(page, '/products');
  // Add product to cart
  // Proceed to checkout
  // Complete order
}

/**
 * Check for security error messages
 */
export async function expectSecurityError(page: Page, expectedMessage?: string) {
  // Look for common error indicators
  const errorSelectors = [
    'text=Unauthorized',
    'text=Forbidden',
    'text=Access Denied',
    '[role="alert"]',
    '.error-message',
  ];

  let found = false;
  for (const selector of errorSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible()) {
      found = true;
      if (expectedMessage) {
        await expect(element).toContainText(expectedMessage);
      }
      break;
    }
  }

  expect(found).toBe(true);
}

/**
 * Get session cookie
 */
export async function getSessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find(
    (cookie) =>
      cookie.name.includes('session') ||
      cookie.name.includes('authjs') ||
      cookie.name.includes('next-auth')
  );
}

/**
 * Inject malicious input and verify it's handled
 */
export async function testInputSanitization(
  page: Page,
  fieldSelector: string,
  maliciousInput: string
) {
  await page.fill(fieldSelector, maliciousInput);
  await page.click('button[type="submit"]');

  // Wait a moment for any potential XSS to execute
  await page.waitForTimeout(1000);

  // Check that malicious script didn't execute
  const alerts = await page.evaluate(() => {
    return (window as any).__alertTriggered || false;
  });

  expect(alerts).toBe(false);
}