/**
 * Test Data Fixtures
 *
 * Provides test data for various testing scenarios.
 */

export const TEST_ADDRESSES = {
  valid: {
    fullName: 'John Doe',
    street: '123 Test Street',
    city: 'Phnom Penh',
    province: 'Phnom Penh',
    postalCode: '12000',
    country: 'Cambodia',
    phone: '+855123456789',
  },

  invalid: {
    missingFields: {
      fullName: 'Jane Doe',
      // Missing required fields
    },
    invalidPhone: {
      fullName: 'Jane Doe',
      street: '456 Test Ave',
      city: 'Phnom Penh',
      province: 'Phnom Penh',
      postalCode: '12000',
      country: 'Cambodia',
      phone: 'invalid-phone',
    },
  },
}

export const TEST_ORDERS = {
  basic: {
    items: [
      {
        product: '507f1f77bcf86cd799439011', // Mock ObjectId
        name: 'Test Product',
        price: 29.99,
        quantity: 2,
      },
    ],
    shippingAddress: TEST_ADDRESSES.valid,
    paymentMethod: 'PayPal',
  },
}

export const TEST_PRODUCTS = {
  valid: {
    name: 'Test Product',
    slug: 'test-product',
    sku: 'TEST-001',
    description: 'This is a test product',
    price: 29.99,
    listPrice: 39.99,
    countInStock: 100,
    isPublished: true,
  },
}