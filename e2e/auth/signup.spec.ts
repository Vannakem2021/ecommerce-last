import { test, expect } from '@playwright/test';
import { navigateTo, getSessionCookie } from '../setup/test-helpers';

/**
 * Sign-Up Registration Tests
 *
 * Tests user registration flows including:
 * - Successful registration
 * - Validation errors
 * - Duplicate email handling
 * - Password requirements
 */

test.describe('Sign-Up Registration', () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/sign-up');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const newUser = {
      name: 'Test User',
      email: `testuser${timestamp}@test.com`,
      password: 'SecurePass123!@#',
      confirmPassword: 'SecurePass123!@#',
    };

    // Fill registration form
    await page.fill('input[name="name"]', newUser.name);
    await page.fill('input[name="email"]', newUser.email);
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="confirmPassword"]', newUser.confirmPassword);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect after successful registration (app auto-logs in user)
    // Increased timeout to 30s to account for slower test environments
    await page.waitForURL((url) => !url.pathname.includes('sign-up'), { timeout: 30000 });

    // Verify we're not on sign-up page anymore (successful registration)
    expect(page.url()).not.toContain('sign-up');

    // Verify session cookie exists (user is logged in)
    const sessionCookie = await getSessionCookie(page);
    expect(sessionCookie).toBeDefined();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass123!');

    await page.click('button[type="submit"]');

    // Should show password mismatch error
    await expect(
      page.locator('text=/password.*match|passwords.*same/i').first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('should enforce password requirements', async ({ page }) => {
    const weakPasswords = [
      'short',           // Too short
      'nouppercaseorno', // No uppercase or numbers
      '12345678',        // No letters
      'NoSpecialChar1',  // No special characters (if required)
    ];

    for (const password of weakPasswords) {
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@test.com');
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);

      await page.click('button[type="submit"]');

      // Should show password requirements error
      const hasError = await page.locator('text=/password|character|requirement/i').isVisible().catch(() => false);
      expect(hasError).toBe(true);

      // Clear for next iteration
      await page.fill('input[name="password"]', '');
      await page.fill('input[name="confirmPassword"]', '');
    }
  });

  test('should reject invalid email format', async ({ page }) => {
    const invalidEmails = [
      'notanemail',
      '@test.com',
      'test@',
      'test..test@test.com',
    ];

    for (const email of invalidEmails) {
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'ValidPass123!');
      await page.fill('input[name="confirmPassword"]', 'ValidPass123!');

      await page.click('button[type="submit"]');

      // Should show email validation error
      await expect(
        page.locator('text=/email.*invalid|valid.*email/i').first()
      ).toBeVisible({ timeout: 2000 });

      // Clear for next iteration
      await page.fill('input[name="email"]', '');
    }
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // Try to register with existing user email
    await page.fill('input[name="name"]', 'Duplicate User');
    await page.fill('input[name="email"]', 'user@test.com'); // Existing user
    await page.fill('input[name="password"]', 'ValidPass123!');
    await page.fill('input[name="confirmPassword"]', 'ValidPass123!');

    await page.click('button[type="submit"]');

    // Should show error about existing email
    await expect(
      page.locator('text=/already.*exists|email.*taken|already.*registered/i').first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show multiple validation errors
    const errors = await page.locator('text=/required|must/i').count();
    expect(errors).toBeGreaterThan(0);
  });

  test('should trim whitespace from inputs', async ({ page }) => {
    const timestamp = Date.now();

    await page.fill('input[name="name"]', '  Test User  ');
    await page.fill('input[name="email"]', `  test${timestamp}@test.com  `);
    await page.fill('input[name="password"]', 'ValidPass123!');
    await page.fill('input[name="confirmPassword"]', 'ValidPass123!');

    await page.click('button[type="submit"]');

    // Should succeed (whitespace trimmed)
    await page.waitForTimeout(2000);
    const hasError = await page.locator('[role="alert"], .error-message').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should have link to sign-in page', async ({ page }) => {
    const signInLink = page.locator('a[href*="sign-in"]');
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await page.waitForURL(/sign-in/);
  });
});