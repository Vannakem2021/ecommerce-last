/**
 * Promotion System Tests
 * 
 * Tests all critical promotion functionalities:
 * 1. Discount calculation (percentage, fixed, free shipping)
 * 2. Max discount amount enforcement (CRITICAL FIX)
 * 3. Usage limits (global and per-user)
 * 4. Date validation
 * 5. Eligible items filtering
 * 6. Minimum order value
 * 7. Promotion code validation
 */

import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { Cart, OrderItem } from '@/types'

// Mock NextAuth and its dependencies FIRST
jest.mock('@auth/mongodb-adapter', () => ({
  MongoDBAdapter: jest.fn(),
}))

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id', name: 'Test User' },
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  handlers: {},
}))

// Mock auth config
jest.mock('@/auth.config', () => ({
  __esModule: true,
  default: {
    providers: [],
    pages: {},
    callbacks: {},
  },
}))

// Mock the database connection and models
jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/db/models/promotion.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

jest.mock('@/lib/db/models/promotion-usage.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}))

jest.mock('@/lib/db/models/product.model', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}))

jest.mock('@/lib/db/models/category.model', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn(),
  },
}))

jest.mock('@/lib/rbac', () => ({
  requirePermission: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Import after mocks
import Promotion from '@/lib/db/models/promotion.model'
import PromotionUsage from '@/lib/db/models/promotion-usage.model'
import { validatePromotionCode } from '@/lib/actions/promotion.actions'

describe('Promotion System - Discount Calculation', () => {
  let mockCart: Cart
  let mockOrderItems: OrderItem[]

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock cart items
    mockOrderItems = [
      {
        product: 'product1',
        name: 'Test Product 1',
        slug: 'test-product-1',
        quantity: 2,
        price: 50,
        category: 'category1',
        image: '/test.jpg',
      },
      {
        product: 'product2',
        name: 'Test Product 2',
        slug: 'test-product-2',
        quantity: 1,
        price: 100,
        category: 'category2',
        image: '/test2.jpg',
      },
    ]

    mockCart = {
      items: mockOrderItems,
      itemsPrice: 200, // 2*50 + 1*100
      shippingPrice: 10,
      taxPrice: 20,
      totalPrice: 230,
    }
  })

  describe('Percentage Discount', () => {
    it('should calculate 20% discount correctly', async () => {
      const mockPromotion = {
        _id: 'promo1',
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0, // No cap
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('SAVE20', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(40) // 20% of 200 = 40
    })

    it('should calculate 50% discount correctly', async () => {
      const mockPromotion = {
        _id: 'promo2',
        code: 'HALF',
        type: 'percentage',
        value: 50,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('HALF', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(100) // 50% of 200 = 100
    })
  })

  describe('Fixed Amount Discount', () => {
    it('should apply fixed $30 discount', async () => {
      const mockPromotion = {
        _id: 'promo3',
        code: 'SAVE30',
        type: 'fixed',
        value: 30,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('SAVE30', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(30)
    })

    it('should cap fixed discount to cart total', async () => {
      const mockPromotion = {
        _id: 'promo4',
        code: 'BIG500',
        type: 'fixed',
        value: 500, // More than cart total
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('BIG500', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(200) // Capped to cart items price
    })
  })

  describe('Max Discount Amount Cap (CRITICAL FIX)', () => {
    it('should cap percentage discount to maxDiscountAmount', async () => {
      const mockPromotion = {
        _id: 'promo5',
        code: 'HALF50CAP',
        type: 'percentage',
        value: 50, // 50% of $200 = $100
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 50, // ⭐ CAP at $50
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('HALF50CAP', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(50) // Should be capped at $50, not $100
    })

    it('should not cap if maxDiscountAmount is 0 (unlimited)', async () => {
      const mockPromotion = {
        _id: 'promo6',
        code: 'UNLIMITED',
        type: 'percentage',
        value: 50,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0, // No cap
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('UNLIMITED', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(100) // Full 50% discount
    })

    it('should cap fixed discount to maxDiscountAmount', async () => {
      const mockPromotion = {
        _id: 'promo7',
        code: 'FIX75CAP50',
        type: 'fixed',
        value: 75, // $75 discount
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 50, // ⭐ CAP at $50
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('FIX75CAP50', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(50) // Should be capped at $50, not $75
    })

    it('should handle high percentage with low cap (real-world scenario)', async () => {
      // Scenario: Black Friday 80% off BUT max $100 discount
      const highValueCart = {
        ...mockCart,
        items: [
          {
            product: 'expensive',
            name: 'Expensive Item',
            slug: 'expensive',
            quantity: 1,
            price: 1000,
            category: 'cat1',
            image: '/test.jpg',
          },
        ],
        itemsPrice: 1000,
        totalPrice: 1030,
      }

      const mockPromotion = {
        _id: 'promo8',
        code: 'BLACKFRI80',
        type: 'percentage',
        value: 80, // 80% of $1000 = $800
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 100, // ⭐ CAP at $100
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('BLACKFRI80', highValueCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(100) // Should be capped at $100, not $800
      // This prevents $700 revenue loss!
    })
  })

  describe('Free Shipping Promotion', () => {
    it('should apply free shipping', async () => {
      const mockPromotion = {
        _id: 'promo9',
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('FREESHIP', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(0) // No item discount
      expect(result.freeShipping).toBe(true) // But shipping is free
    })
  })

  describe('Minimum Order Value', () => {
    it('should reject if cart total is below minimum', async () => {
      const mockPromotion = {
        _id: 'promo10',
        code: 'MIN100',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 300, // Requires $300 minimum
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('MIN100', mockCart, 'user1') // Cart is $200

      expect(result.success).toBe(false)
      expect(result.error).toContain('Minimum order value')
    })

    it('should accept if cart total meets minimum', async () => {
      const mockPromotion = {
        _id: 'promo11',
        code: 'MIN100OK',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 100, // Requires $100 minimum
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('MIN100OK', mockCart, 'user1') // Cart is $200

      expect(result.success).toBe(true)
      expect(result.discount).toBe(40) // 20% of $200
    })
  })

  describe('Usage Limits', () => {
    it('should reject if global usage limit reached', async () => {
      const mockPromotion = {
        _id: 'promo12',
        code: 'LIMITED',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 100, // Max 100 uses
        usedCount: 100, // Already used 100 times
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('LIMITED', mockCart, 'user1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('usage limit reached')
    })

    it('should reject if user usage limit reached', async () => {
      const mockPromotion = {
        _id: 'promo13',
        code: 'ONCE',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 1, // Each user can use only once
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(1) // User already used it

      const result = await validatePromotionCode('ONCE', mockCart, 'user1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('reached the usage limit')
    })

    it('should allow if usage limit is 0 (unlimited)', async () => {
      const mockPromotion = {
        _id: 'promo14',
        code: 'FOREVER',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0, // Unlimited
        usedCount: 9999, // Already used many times
        userUsageLimit: 0, // Unlimited per user
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('FOREVER', mockCart, 'user1')

      expect(result.success).toBe(true)
      expect(result.discount).toBe(40)
    })
  })

  describe('Date Validation', () => {
    it('should reject if promotion has not started yet', async () => {
      const mockPromotion = {
        _id: 'promo15',
        code: 'FUTURE',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() + 10000), // Starts in future
        endDate: new Date(Date.now() + 20000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('FUTURE', mockCart, 'user1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should reject if promotion has expired', async () => {
      const mockPromotion = {
        _id: 'promo16',
        code: 'EXPIRED',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 20000),
        endDate: new Date(Date.now() - 10000), // Already expired
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('EXPIRED', mockCart, 'user1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should accept if promotion is active within date range', async () => {
      const mockPromotion = {
        _id: 'promo17',
        code: 'ACTIVE',
        type: 'percentage',
        value: 20,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('ACTIVE', mockCart, 'user1')

      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Codes', () => {
    it('should reject invalid promotion code', async () => {
      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(null)

      const result = await validatePromotionCode('INVALID', mockCart, 'user1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid or inactive')
    })

    it('should reject inactive promotion', async () => {
      const mockPromotion = {
        _id: 'promo18',
        code: 'INACTIVE',
        type: 'percentage',
        value: 20,
        active: false, // Inactive
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'all',
        applicableProducts: [],
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)

      const result = await validatePromotionCode('INACTIVE', mockCart, 'user1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid or inactive')
    })
  })

  describe('Product-Specific Promotions', () => {
    it('should apply discount only to eligible products', async () => {
      const mockPromotion = {
        _id: 'promo19',
        code: 'PROD1ONLY',
        type: 'percentage',
        value: 50,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'products',
        applicableProducts: [{ toString: () => 'product1' }], // Only product1
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('PROD1ONLY', mockCart, 'user1')

      expect(result.success).toBe(true)
      // Should discount only product1: 50% of (2 * $50) = $50
      expect(result.discount).toBe(50)
    })

    it('should reject if no cart items match product promotion', async () => {
      const mockPromotion = {
        _id: 'promo20',
        code: 'PROD3ONLY',
        type: 'percentage',
        value: 50,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'products',
        applicableProducts: [{ toString: () => 'product3' }], // Product not in cart
        applicableCategories: [],
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('PROD3ONLY', mockCart, 'user1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not applicable')
    })
  })

  describe('Category-Specific Promotions', () => {
    it('should apply discount only to eligible categories', async () => {
      const mockPromotion = {
        _id: 'promo21',
        code: 'CAT1ONLY',
        type: 'percentage',
        value: 50,
        active: true,
        startDate: new Date(Date.now() - 1000),
        endDate: new Date(Date.now() + 10000),
        minOrderValue: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        userUsageLimit: 0,
        appliesTo: 'categories',
        applicableProducts: [],
        applicableCategories: [{ toString: () => 'category1' }], // Only category1
      }

      ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
      ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

      const result = await validatePromotionCode('CAT1ONLY', mockCart, 'user1')

      expect(result.success).toBe(true)
      // Should discount only category1 items: 50% of (2 * $50) = $50
      expect(result.discount).toBe(50)
    })
  })
})

describe('Promotion System - Edge Cases', () => {
  it('should handle empty cart gracefully', async () => {
    const emptyCart: Cart = {
      items: [],
      itemsPrice: 0,
      totalPrice: 0,
    }

    const mockPromotion = {
      _id: 'promo22',
      code: 'EMPTY',
      type: 'percentage',
      value: 50,
      active: true,
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 10000),
      minOrderValue: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      usedCount: 0,
      userUsageLimit: 0,
      appliesTo: 'all',
      applicableProducts: [],
      applicableCategories: [],
    }

    ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
    ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

    const result = await validatePromotionCode('EMPTY', emptyCart, 'user1')

    // Should either reject or give 0 discount
    if (result.success) {
      expect(result.discount).toBe(0)
    } else {
      expect(result.error).toBeTruthy()
    }
  })

  it('should round discount amounts correctly', async () => {
    const mockCart: Cart = {
      items: [
        {
          product: 'prod1',
          name: 'Test',
          slug: 'test',
          quantity: 1,
          price: 33.33,
          category: 'cat1',
          image: '/test.jpg',
        },
      ],
      itemsPrice: 33.33,
      totalPrice: 33.33,
    }

    const mockPromotion = {
      _id: 'promo23',
      code: 'ROUND',
      type: 'percentage',
      value: 15, // 15% of 33.33 = 4.9995
      active: true,
      startDate: new Date(Date.now() - 1000),
      endDate: new Date(Date.now() + 10000),
      minOrderValue: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      usedCount: 0,
      userUsageLimit: 0,
      appliesTo: 'all',
      applicableProducts: [],
      applicableCategories: [],
    }

    ;(Promotion.findOne as jest.MockedFunction<any>).mockResolvedValue(mockPromotion)
    ;(PromotionUsage.countDocuments as jest.MockedFunction<any>).mockResolvedValue(0)

    const result = await validatePromotionCode('ROUND', mockCart, 'user1')

    expect(result.success).toBe(true)
    // Should be rounded to 2 decimal places
    expect(result.discount).toBe(5) // 15% of 33.33 = 4.9995 ≈ 5.00
  })
})
