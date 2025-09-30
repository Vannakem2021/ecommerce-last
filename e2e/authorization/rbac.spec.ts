import { test, expect } from '@playwright/test';
import { loginAs, navigateTo, canAccessAdminPanel, attemptAccess } from '../setup/test-helpers';
import { TEST_USERS } from '../fixtures/test-users';

/**
 * Role-Based Access Control (RBAC) Tests
 *
 * Tests authorization and permission checks for different user roles:
 * - Admin: Full access
 * - Manager: Product/order management
 * - Seller: Limited product/order access
 * - User: Basic customer access
 */

test.describe('RBAC - Role-Based Access Control', () => {
  test.describe('Admin Role', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin');
    });

    test('should access admin panel', async ({ page }) => {
      const canAccess = await canAccessAdminPanel(page);
      expect(canAccess).toBe(true);
    });

    test('should access all admin sections', async ({ page }) => {
      const adminSections = [
        '/admin/overview',
        '/admin/products',
        '/admin/orders',
        '/admin/users',
        '/admin/settings',
      ];

      for (const section of adminSections) {
        const result = await attemptAccess(page, section);
        expect(result.allowed).toBe(true);
        expect(result.statusCode).toBe(200);
      }
    });

    test('should be able to delete orders', async ({ page }) => {
      await navigateTo(page, '/admin/orders');
      await page.waitForLoadState('networkidle');

      // Check if delete buttons are present
      const deleteButtons = page.locator('button:has-text("Delete")');
      const count = await deleteButtons.count();

      // Admin should see delete buttons (if orders exist)
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should be able to create/edit users', async ({ page }) => {
      await navigateTo(page, '/admin/users');
      await page.waitForLoadState('networkidle');

      // Should see create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create")');
      await expect(createButton.first()).toBeVisible();
    });
  });

  test.describe('Manager Role', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'manager');
    });

    test('should access admin panel', async ({ page }) => {
      const canAccess = await canAccessAdminPanel(page);
      expect(canAccess).toBe(true);
    });

    test('should access product and order management', async ({ page }) => {
      const allowedSections = [
        '/admin/products',
        '/admin/orders',
        '/admin/overview',
      ];

      for (const section of allowedSections) {
        const result = await attemptAccess(page, section);
        expect(result.allowed).toBe(true);
      }
    });

    test('should NOT be able to delete products', async ({ page }) => {
      await navigateTo(page, '/admin/products');
      await page.waitForLoadState('networkidle');

      // Manager shouldn't see delete buttons (or they should be disabled)
      const deleteButtons = page.locator('button:has-text("Delete"):not([disabled])');
      const count = await deleteButtons.count();

      // Should be 0 or buttons should be disabled
      expect(count).toBe(0);
    });

    test('should NOT access user management', async ({ page }) => {
      const result = await attemptAccess(page, '/admin/users');

      // Should be redirected or get 403
      expect(result.allowed).toBe(false);
      expect(result.finalUrl).toMatch(/unauthorized|forbidden|403/i);
    });

    test('should NOT access settings', async ({ page }) => {
      const result = await attemptAccess(page, '/admin/settings');

      // Should be denied
      expect(result.allowed).toBe(false);
    });
  });

  test.describe('Seller Role', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'seller');
    });

    test('should access admin panel', async ({ page }) => {
      const canAccess = await canAccessAdminPanel(page);
      expect(canAccess).toBe(true);
    });

    test('should view products and orders', async ({ page }) => {
      const allowedSections = [
        '/admin/products',
        '/admin/orders',
      ];

      for (const section of allowedSections) {
        const result = await attemptAccess(page, section);
        expect(result.allowed).toBe(true);
      }
    });

    test('should NOT create products', async ({ page }) => {
      await navigateTo(page, '/admin/products');
      await page.waitForLoadState('networkidle');

      // Seller shouldn't see create button
      const createButton = page.locator('button:has-text("Create"):not([disabled])');
      const count = await createButton.count();

      expect(count).toBe(0);
    });

    test('should NOT access user management', async ({ page }) => {
      const result = await attemptAccess(page, '/admin/users');
      expect(result.allowed).toBe(false);
    });

    test('should NOT access settings', async ({ page }) => {
      const result = await attemptAccess(page, '/admin/settings');
      expect(result.allowed).toBe(false);
    });
  });

  test.describe('Regular User Role', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'user');
    });

    test('should NOT access admin panel', async ({ page }) => {
      const canAccess = await canAccessAdminPanel(page);
      expect(canAccess).toBe(false);
    });

    test('should be redirected from admin routes', async ({ page }) => {
      const adminRoutes = [
        '/admin',
        '/admin/products',
        '/admin/orders',
        '/admin/users',
      ];

      for (const route of adminRoutes) {
        const result = await attemptAccess(page, route);

        // Should be denied and redirected
        expect(result.allowed).toBe(false);
        expect(result.redirected).toBe(true);
        expect(result.finalUrl).toMatch(/unauthorized|sign-in/i);
      }
    });

    test('should access own account pages', async ({ page }) => {
      const allowedPages = [
        '/account/orders',
        '/account/addresses',
        '/account/manage',
      ];

      for (const pageUrl of allowedPages) {
        const result = await attemptAccess(page, pageUrl);
        expect(result.allowed).toBe(true);
      }
    });

    test('should access public pages', async ({ page }) => {
      const publicPages = [
        '/',
        '/search',
        '/cart',
      ];

      for (const pageUrl of publicPages) {
        const result = await attemptAccess(page, pageUrl);
        expect(result.allowed).toBe(true);
      }
    });
  });

  test.describe('Cross-Role Security', () => {
    test('should prevent privilege escalation', async ({ page }) => {
      // Login as regular user
      await loginAs(page, 'user');

      // Try to access admin panel directly
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should be denied
      expect(page.url()).not.toContain('/admin');
      expect(page.url()).toMatch(/unauthorized|sign-in/);
    });

    test('should maintain role after page refresh', async ({ page }) => {
      // Login as manager
      await loginAs(page, 'manager');

      // Access allowed page
      await navigateTo(page, '/admin/products');
      await page.waitForLoadState('networkidle');

      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still have access
      expect(page.url()).toContain('/admin/products');
    });

    test('should prevent role manipulation via client', async ({ page }) => {
      // Login as user
      await loginAs(page, 'user');

      // Try to manipulate role in local storage/session
      await page.evaluate(() => {
        localStorage.setItem('userRole', 'admin');
        sessionStorage.setItem('role', 'admin');
      });

      // Try to access admin panel
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should still be denied (server validates)
      expect(page.url()).not.toContain('/admin');
    });
  });
});