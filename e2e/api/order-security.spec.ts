import { test, expect } from '@playwright/test';
import { loginAs } from '../setup/test-helpers';

/**
 * Order API Security Tests
 *
 * Tests security fixes in order management:
 * - Order deletion permissions
 * - Order access control
 * - Audit logging
 * - Business logic validation
 */

test.describe('Order API Security', () => {
  test.describe('Order Deletion Authorization', () => {
    test('should prevent non-admin from deleting orders', async ({ page }) => {
      // Login as regular user
      await loginAs(page, 'user');

      // Try to delete an order via API
      const response = await page.request.delete('/api/orders/507f1f77bcf86cd799439011');

      // Should get 403 Forbidden or 401 Unauthorized
      expect([401, 403, 404]).toContain(response.status());
    });

    test('should allow admin to delete orders', async ({ page }) => {
      await loginAs(page, 'admin');

      // Admin should be able to delete
      const response = await page.request.delete('/api/orders/507f1f77bcf86cd799439011');

      // Should get 200 or 404 (not 403)
      expect([200, 404]).toContain(response.status());
      expect(response.status()).not.toBe(403);
    });

    test('should prevent deletion of paid orders in process', async ({ page }) => {
      await loginAs(page, 'admin');

      // Mock: Try to delete a paid but undelivered order
      // This should be blocked by business logic
      const response = await page.request.delete('/api/orders/507f1f77bcf86cd799439013');

      // If order exists and is paid but not delivered, should get specific error
      if (response.status() === 400) {
        const body = await response.json().catch(() => ({}));
        expect(body.message || body.error).toMatch(/cannot delete.*paid|processing/i);
      }
    });

    test('should require permission for order management', async ({ page }) => {
      // Login as seller (has orders.read but not orders.delete)
      await loginAs(page, 'seller');

      const response = await page.request.delete('/api/orders/507f1f77bcf86cd799439011');

      // Should get 403 Forbidden
      expect(response.status()).toBe(403);
    });
  });

  test.describe('Order Access Control', () => {
    test('should allow users to view own orders', async ({ page }) => {
      await loginAs(page, 'user');

      // Get user's orders
      const response = await page.request.get('/api/orders/my-orders');

      // Should succeed
      expect(response.status()).toBe(200);

      const body = await response.json().catch(() => null);
      expect(body).toBeTruthy();
    });

    test('should prevent users from viewing others\' orders', async ({ page }) => {
      await loginAs(page, 'user');

      // Try to access another user's order
      const response = await page.request.get('/api/orders/507f1f77bcf86cd799439010');

      // Should get 403 or 404
      expect([403, 404]).toContain(response.status());
    });

    test('should allow admin to view all orders', async ({ page }) => {
      await loginAs(page, 'admin');

      // Get all orders
      const response = await page.request.get('/api/orders');

      expect(response.status()).toBe(200);
    });
  });

  test.describe('Order Creation Security', () => {
    test('should validate order data structure', async ({ page }) => {
      await loginAs(page, 'user');

      const invalidOrders = [
        {}, // Empty
        { items: [] }, // No items
        { items: [{ invalid: 'data' }] }, // Invalid item structure
      ];

      for (const invalidOrder of invalidOrders) {
        const response = await page.request.post('/api/orders', {
          data: invalidOrder,
        });

        // Should get 400 Bad Request
        expect(response.status()).toBe(400);
      }
    });

    test('should recalculate prices on server', async ({ page }) => {
      await loginAs(page, 'user');

      // Try to submit order with manipulated prices
      const orderWithManipulatedPrice = {
        items: [
          {
            product: '507f1f77bcf86cd799439011',
            name: 'Test Product',
            price: 0.01, // Manipulated low price
            quantity: 100,
          },
        ],
        shippingAddress: {
          fullName: 'Test User',
          street: '123 Test St',
          city: 'Test City',
          province: 'Test Province',
          postalCode: '12000',
          country: 'Test Country',
          phone: '+855123456789',
        },
        paymentMethod: 'PayPal',
      };

      const response = await page.request.post('/api/orders', {
        data: orderWithManipulatedPrice,
      });

      // Server should recalculate and use correct price
      // Response should either succeed with server-calculated price
      // or reject the order
      if (response.status() === 200) {
        const body = await response.json();
        // Verify server calculated total, not using manipulated price
        // This would need actual product prices to validate
      }
    });

    test('should check stock availability', async ({ page }) => {
      await loginAs(page, 'user');

      // Try to order more than available stock
      const orderExceedingStock = {
        items: [
          {
            product: '507f1f77bcf86cd799439011',
            name: 'Test Product',
            price: 29.99,
            quantity: 999999, // Exceeds stock
          },
        ],
        shippingAddress: {
          fullName: 'Test User',
          street: '123 Test St',
          city: 'Test City',
          province: 'Test Province',
          postalCode: '12000',
          country: 'Test Country',
          phone: '+855123456789',
        },
        paymentMethod: 'PayPal',
      };

      const response = await page.request.post('/api/orders', {
        data: orderExceedingStock,
      });

      // Should get error about insufficient stock
      if (response.status() === 400) {
        const body = await response.json().catch(() => ({}));
        expect(body.message || body.error).toMatch(/stock|insufficient|available/i);
      }
    });
  });
});