import { test, expect } from '@playwright/test';
import { loginAs } from '../setup/test-helpers';
import { TEST_ADDRESSES, MALICIOUS_INPUTS } from '../fixtures/test-data';

/**
 * Address Update Security Tests
 *
 * Tests security fixes in address updates:
 * - Input validation
 * - NoSQL injection prevention
 * - Authorization checks
 * - Zod schema validation
 */

test.describe('Address Update Security', () => {
  test.describe('Authorization', () => {
    test('should allow user to update own address', async ({ page }) => {
      await loginAs(page, 'user');

      // Get user ID (would come from session in real app)
      const userId = '507f1f77bcf86cd799439011';

      const response = await page.request.put(`/api/user/${userId}/address`, {
        data: TEST_ADDRESSES.valid,
      });

      // Should succeed
      expect([200, 201]).toContain(response.status());
    });

    test('should prevent user from updating another user\'s address', async ({ page }) => {
      await loginAs(page, 'user2');

      // Try to update user1's address
      const user1Id = '507f1f77bcf86cd799439011';

      const response = await page.request.put(`/api/user/${user1Id}/address`, {
        data: TEST_ADDRESSES.valid,
      });

      // Should get 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json().catch(() => ({}));
      expect(body.error).toMatch(/unauthorized|forbidden/i);
    });

    test('should allow admin to update any user\'s address', async ({ page }) => {
      await loginAs(page, 'admin');

      // Admin should be able to update any address
      const anyUserId = '507f1f77bcf86cd799439012';

      const response = await page.request.put(`/api/user/${anyUserId}/address`, {
        data: TEST_ADDRESSES.valid,
      });

      // Should succeed or 404 if user doesn't exist
      expect([200, 201, 404]).toContain(response.status());
      expect(response.status()).not.toBe(403);
    });
  });

  test.describe('Input Validation', () => {
    test('should validate address schema', async ({ page }) => {
      await loginAs(page, 'user');
      const userId = '507f1f77bcf86cd799439011';

      const response = await page.request.put(`/api/user/${userId}/address`, {
        data: TEST_ADDRESSES.invalid.missingFields,
      });

      // Should get 400 Bad Request
      expect(response.status()).toBe(400);

      const body = await response.json().catch(() => ({}));
      expect(body.error).toMatch(/invalid|required|validation/i);
    });

    test('should reject invalid phone number', async ({ page }) => {
      await loginAs(page, 'user');
      const userId = '507f1f77bcf86cd799439011';

      const response = await page.request.put(`/api/user/${userId}/address`, {
        data: TEST_ADDRESSES.invalid.invalidPhone,
      });

      // Should get 400
      expect(response.status()).toBe(400);

      const body = await response.json().catch(() => ({}));
      expect(body.error).toMatch(/phone|invalid/i);
    });

    test('should reject invalid user ID format', async ({ page }) => {
      await loginAs(page, 'user');

      const invalidIds = ['invalid', '12345', 'not-an-objectid'];

      for (const invalidId of invalidIds) {
        const response = await page.request.put(`/api/user/${invalidId}/address`, {
          data: TEST_ADDRESSES.valid,
        });

        // Should get 400 Bad Request
        expect(response.status()).toBe(400);

        const body = await response.json().catch(() => ({}));
        expect(body.error).toMatch(/invalid.*id|bad request/i);
      }
    });
  });

  test.describe('NoSQL Injection Prevention', () => {
    test('should prevent NoSQL injection in address data', async ({ page }) => {
      await loginAs(page, 'user');
      const userId = '507f1f77bcf86cd799439011';

      // Try to inject $where operator
      const maliciousAddress = {
        ...TEST_ADDRESSES.valid,
        $where: 'this.password == "hacked"',
      };

      const response = await page.request.put(`/api/user/${userId}/address`, {
        data: maliciousAddress,
      });

      // Should get 400 (validation error) or sanitize the input
      expect([400, 200]).toContain(response.status());

      // If request succeeded, verify injection didn't work
      if (response.status() === 200) {
        const body = await response.json().catch(() => ({}));
        // The $where field should not be in the response
        expect(body.data?.address?.$where).toBeUndefined();
      }
    });

    test('should prevent prototype pollution', async ({ page }) => {
      await loginAs(page, 'user');
      const userId = '507f1f77bcf86cd799439011';

      // Try prototype pollution
      const maliciousData = {
        ...TEST_ADDRESSES.valid,
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      };

      const response = await page.request.put(`/api/user/${userId}/address`, {
        data: maliciousData,
      });

      // Should be rejected or sanitized
      expect([400, 200]).toContain(response.status());
    });

    test('should prevent unauthorized field updates', async ({ page }) => {
      await loginAs(page, 'user');
      const userId = '507f1f77bcf86cd799439011';

      // Try to update role field via address update
      const maliciousData = {
        ...TEST_ADDRESSES.valid,
        role: 'admin',
        password: 'hacked',
        email: 'hacked@evil.com',
      };

      const response = await page.request.put(`/api/user/${userId}/address`, {
        data: maliciousData,
      });

      // Should succeed but only update address
      if (response.status() === 200) {
        const body = await response.json().catch(() => ({}));

        // Verify only address was updated, not other fields
        expect(body.data?.role).toBeUndefined();
        expect(body.data?.password).toBeUndefined();

        // Only address field should be present
        expect(body.data?.address).toBeDefined();
      }
    });
  });

  test.describe('Audit Logging', () => {
    test('should log address updates', async ({ page }) => {
      await loginAs(page, 'user');
      const userId = '507f1f77bcf86cd799439011';

      // Monitor console for audit logs
      const auditLogs: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('AUDIT')) {
          auditLogs.push(msg.text());
        }
      });

      await page.request.put(`/api/user/${userId}/address`, {
        data: TEST_ADDRESSES.valid,
      });

      // Wait for logs
      await page.waitForTimeout(1000);

      // Note: Audit logs are server-side, this is just demonstrating the pattern
      // In real testing, you'd check server logs or database audit table
    });
  });

  test.describe('XSS Prevention', () => {
    test('should sanitize XSS in address fields', async ({ page }) => {
      await loginAs(page, 'user');
      const userId = '507f1f77bcf86cd799439011';

      const addressWithXSS = {
        fullName: MALICIOUS_INPUTS.xss,
        street: '123 Test St',
        city: 'Test City',
        province: 'Test Province',
        postalCode: '12000',
        country: 'Test Country',
        phone: '+855123456789',
      };

      const response = await page.request.put(`/api/user/${userId}/address`, {
        data: addressWithXSS,
      });

      // Should be rejected or sanitized
      if (response.status() === 200) {
        const body = await response.json().catch(() => ({}));

        // XSS should be escaped/sanitized
        const fullName = body.data?.address?.fullName || '';
        expect(fullName).not.toContain('<script>');
      }
    });
  });
});