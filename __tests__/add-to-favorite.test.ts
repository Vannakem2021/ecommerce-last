/**
 * Add to Favorite Functionality Tests
 *
 * These tests cover the favorite/wishlist functionality including:
 * - Adding products to favorites
 * - Removing products from favorites
 * - Toggle favorite functionality
 * - Retrieving user favorites
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { addFavorite, removeFavorite, toggleFavorite, getMyFavoriteIds, getMyFavorites } from '@/lib/actions/favorite.actions'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import Product from '@/lib/db/models/product.model'
import Favorite from '@/lib/db/models/favorite.model'
import Brand from '@/lib/db/models/brand.model'
import Category from '@/lib/db/models/category.model'
import bcrypt from 'bcryptjs'
import { Types } from 'mongoose'

// Mock auth for testing
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { auth } from '@/auth'

// Test user and product data
const testUser = {
  name: 'Test User Favorite',
  email: 'favorite-test@example.com',
  password: 'TestPassword123!@#',
  role: 'user' as const,
}

const testBrand = {
  name: 'Test Brand',
  slug: 'test-brand-fav',
}

const testCategory = {
  name: 'Test Category',
  slug: 'test-category-fav',
}

describe('Add to Favorite Functionality', () => {
  let userId: string
  let productId: string
  let brandId: string
  let categoryId: string
  const mockAuth = auth as jest.MockedFunction<typeof auth>

  beforeAll(async () => {
    // Connect to database
    await connectToDatabase()

    // Clean up any existing test data
    await User.deleteOne({ email: testUser.email })
    await Brand.deleteOne({ slug: testBrand.slug })
    await Category.deleteOne({ slug: testCategory.slug })
    await Product.deleteMany({ slug: { $regex: /^test-product/ } })
    await Favorite.deleteMany({})

    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 12)
    const user = await User.create({
      ...testUser,
      password: hashedPassword,
    })
    userId = user._id.toString()

    // Create test brand and category
    const brand = await Brand.create(testBrand)
    brandId = brand._id.toString()

    const category = await Category.create(testCategory)
    categoryId = category._id.toString()

    // Create test product
    const testProduct = {
      name: 'Test Product for Favorites',
      slug: 'test-product-favorites',
      price: 99.99,
      listPrice: 129.99,
      countInStock: 10,
      category: categoryId,
      brand: brandId,
      isPublished: true,
      sku: 'TEST-FAV-001',
      images: ['/images/test.jpg'],
      avgRating: 0,
      numReviews: 0,
    }
    const product = await Product.create(testProduct)
    productId = product._id.toString()

    // Mock auth to return test user
    mockAuth.mockResolvedValue({
      user: {
        id: userId,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      },
    } as any)
  })

  afterAll(async () => {
    // Clean up test data
    await User.deleteOne({ email: testUser.email })
    await Product.deleteMany({ slug: { $regex: /^test-product/ } })
    await Brand.deleteOne({ slug: testBrand.slug })
    await Category.deleteOne({ slug: testCategory.slug })
    await Favorite.deleteMany({})
    jest.clearAllMocks()
  })

  describe('Add Favorite', () => {
    beforeEach(async () => {
      // Clean favorites before each test
      await Favorite.deleteMany({ user: userId })
    })

    it('should successfully add a product to favorites', async () => {
      const result = await addFavorite(productId)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Added to Favorites')

      // Verify favorite was created in database
      const favorite = await Favorite.findOne({ user: userId, product: productId })
      expect(favorite).toBeDefined()
      expect(favorite?.user.toString()).toBe(userId)
      expect(favorite?.product.toString()).toBe(productId)
    })

    it('should not duplicate favorite if already exists', async () => {
      // Add favorite first time
      await addFavorite(productId)
      const firstCount = await Favorite.countDocuments({ user: userId, product: productId })
      expect(firstCount).toBe(1)

      // Add same favorite again
      const result = await addFavorite(productId)
      expect(result.success).toBe(true)

      // Should still be only one favorite
      const secondCount = await Favorite.countDocuments({ user: userId, product: productId })
      expect(secondCount).toBe(1)
    })

    it('should reject invalid product ID', async () => {
      const result = await addFavorite('invalid-product-id')

      expect(result.success).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should reject non-existent product', async () => {
      const fakeProductId = new Types.ObjectId().toString()
      const result = await addFavorite(fakeProductId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Product not found')
    })

    it('should require authentication', async () => {
      // Mock unauthenticated user
      mockAuth.mockResolvedValueOnce(null)

      const result = await addFavorite(productId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Authentication required')

      // Restore mock
      mockAuth.mockResolvedValue({
        user: {
          id: userId,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        },
      } as any)
    })
  })

  describe('Remove Favorite', () => {
    beforeEach(async () => {
      // Clean and add a favorite before each test
      await Favorite.deleteMany({ user: userId })
      await addFavorite(productId)
    })

    it('should successfully remove a product from favorites', async () => {
      const result = await removeFavorite(productId)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Removed from Favorites')

      // Verify favorite was removed from database
      const favorite = await Favorite.findOne({ user: userId, product: productId })
      expect(favorite).toBeNull()
    })

    it('should handle removing non-existent favorite gracefully', async () => {
      const fakeProductId = new Types.ObjectId().toString()
      const result = await removeFavorite(fakeProductId)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Removed from Favorites')
    })

    it('should require authentication', async () => {
      // Mock unauthenticated user
      mockAuth.mockResolvedValueOnce(null)

      const result = await removeFavorite(productId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Authentication required')

      // Restore mock
      mockAuth.mockResolvedValue({
        user: {
          id: userId,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        },
      } as any)
    })
  })

  describe('Toggle Favorite', () => {
    beforeEach(async () => {
      // Clean favorites before each test
      await Favorite.deleteMany({ user: userId })
    })

    it('should add favorite when not already favorited', async () => {
      const result = await toggleFavorite(productId)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Added to Favorites')
      expect(result.isFavorite).toBe(true)

      // Verify favorite was created
      const favorite = await Favorite.findOne({ user: userId, product: productId })
      expect(favorite).toBeDefined()
    })

    it('should remove favorite when already favorited', async () => {
      // Add favorite first
      await addFavorite(productId)

      const result = await toggleFavorite(productId)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Removed from Favorites')
      expect(result.isFavorite).toBe(false)

      // Verify favorite was removed
      const favorite = await Favorite.findOne({ user: userId, product: productId })
      expect(favorite).toBeNull()
    })

    it('should handle multiple toggles correctly', async () => {
      // First toggle - add
      const result1 = await toggleFavorite(productId)
      expect(result1.isFavorite).toBe(true)

      // Second toggle - remove
      const result2 = await toggleFavorite(productId)
      expect(result2.isFavorite).toBe(false)

      // Third toggle - add again
      const result3 = await toggleFavorite(productId)
      expect(result3.isFavorite).toBe(true)

      // Verify final state
      const favorite = await Favorite.findOne({ user: userId, product: productId })
      expect(favorite).toBeDefined()
    })

    it('should reject non-existent product', async () => {
      const fakeProductId = new Types.ObjectId().toString()
      const result = await toggleFavorite(fakeProductId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Product not found')
    })
  })

  describe('Get My Favorite IDs', () => {
    beforeEach(async () => {
      // Clean favorites before each test
      await Favorite.deleteMany({ user: userId })
    })

    it('should return empty array when no favorites', async () => {
      const ids = await getMyFavoriteIds()

      expect(Array.isArray(ids)).toBe(true)
      expect(ids).toHaveLength(0)
    })

    it('should return array of favorite product IDs', async () => {
      // Add multiple favorites
      await addFavorite(productId)

      const ids = await getMyFavoriteIds()

      expect(Array.isArray(ids)).toBe(true)
      expect(ids).toHaveLength(1)
      expect(ids).toContain(productId)
    })

    it('should return multiple favorite IDs', async () => {
      // Create additional products
      const product2 = await Product.create({
        name: 'Test Product 2',
        slug: 'test-product-2',
        price: 99.99,
        listPrice: 129.99,
        countInStock: 10,
        category: categoryId,
        brand: brandId,
        isPublished: true,
        sku: 'TEST-FAV-002',
        images: ['/images/test.jpg'],
        avgRating: 0,
        numReviews: 0,
      })
      const product3 = await Product.create({
        name: 'Test Product 3',
        slug: 'test-product-3',
        price: 99.99,
        listPrice: 129.99,
        countInStock: 10,
        category: categoryId,
        brand: brandId,
        isPublished: true,
        sku: 'TEST-FAV-003',
        images: ['/images/test.jpg'],
        avgRating: 0,
        numReviews: 0,
      })

      // Add favorites
      await addFavorite(productId)
      await addFavorite(product2._id.toString())
      await addFavorite(product3._id.toString())

      const ids = await getMyFavoriteIds()

      expect(ids).toHaveLength(3)
      expect(ids).toContain(productId)
      expect(ids).toContain(product2._id.toString())
      expect(ids).toContain(product3._id.toString())

      // Clean up
      await Product.deleteMany({ _id: { $in: [product2._id, product3._id] } })
    })

    it('should require authentication', async () => {
      // Mock unauthenticated user
      mockAuth.mockResolvedValueOnce(null)

      await expect(getMyFavoriteIds()).rejects.toThrow('Authentication required')

      // Restore mock
      mockAuth.mockResolvedValue({
        user: {
          id: userId,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        },
      } as any)
    })
  })

  describe('Get My Favorites (Paginated)', () => {
    beforeEach(async () => {
      // Clean favorites before each test
      await Favorite.deleteMany({ user: userId })
    })

    it('should return paginated favorites with product details', async () => {
      // Add a favorite
      await addFavorite(productId)

      const result = await getMyFavorites({ page: 1, limit: 12 })

      expect(result).toBeDefined()
      expect(result.data).toHaveLength(1)
      expect(result.totalPages).toBe(1)
      expect(result.data[0].slug).toBe('test-product-favorites')
    })

    it('should return empty data when no favorites', async () => {
      const result = await getMyFavorites({ page: 1, limit: 12 })

      expect(result.data).toHaveLength(0)
      expect(result.totalPages).toBe(1)
    })

    it('should handle pagination correctly', async () => {
      // Create 15 test products and add them to favorites
      const products = []
      for (let i = 0; i < 15; i++) {
        const product = await Product.create({
          name: `Test Product ${i}`,
          slug: `test-product-${i}`,
          price: 99.99,
          listPrice: 129.99,
          countInStock: 10,
          category: categoryId,
          brand: brandId,
          isPublished: true,
          sku: `TEST-FAV-PG-${i}`,
          images: ['/images/test.jpg'],
          avgRating: 0,
          numReviews: 0,
        })
        products.push(product)
        await addFavorite(product._id.toString())
      }

      // Get first page (12 items)
      const page1 = await getMyFavorites({ page: 1, limit: 12 })
      expect(page1.data).toHaveLength(12)
      expect(page1.totalPages).toBe(2)

      // Get second page (3 items)
      const page2 = await getMyFavorites({ page: 2, limit: 12 })
      expect(page2.data).toHaveLength(3)
      expect(page2.totalPages).toBe(2)

      // Clean up
      await Product.deleteMany({ _id: { $in: products.map(p => p._id) } })
    })

    it('should use default pagination values', async () => {
      await addFavorite(productId)

      const result = await getMyFavorites({})

      expect(result).toBeDefined()
      expect(result.data).toBeDefined()
      expect(result.totalPages).toBeGreaterThanOrEqual(1)
    })

    it('should require authentication', async () => {
      // Mock unauthenticated user
      mockAuth.mockResolvedValueOnce(null)

      await expect(getMyFavorites({ page: 1, limit: 12 })).rejects.toThrow('Authentication required')

      // Restore mock
      mockAuth.mockResolvedValue({
        user: {
          id: userId,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        },
      } as any)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    beforeEach(async () => {
      await Favorite.deleteMany({ user: userId })
    })

    it('should handle concurrent favorite operations', async () => {
      // Add and remove favorite simultaneously
      const operations = [
        addFavorite(productId),
        addFavorite(productId),
        addFavorite(productId),
      ]

      const results = await Promise.all(operations)

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Should only have one favorite
      const count = await Favorite.countDocuments({ user: userId, product: productId })
      expect(count).toBe(1)
    })

    it('should handle empty product ID', async () => {
      const result = await addFavorite('')

      expect(result.success).toBe(false)
      expect(result.message).toBeDefined()
    })

    it('should return favorites sorted by most recent first', async () => {
      // Create multiple products
      const product2 = await Product.create({
        name: 'Product 2',
        slug: 'product-2',
        price: 99.99,
        listPrice: 129.99,
        countInStock: 10,
        category: categoryId,
        brand: brandId,
        isPublished: true,
        sku: 'TEST-FAV-SORT-002',
        images: ['/images/test.jpg'],
        avgRating: 0,
        numReviews: 0,
      })
      const product3 = await Product.create({
        name: 'Product 3',
        slug: 'product-3',
        price: 99.99,
        listPrice: 129.99,
        countInStock: 10,
        category: categoryId,
        brand: brandId,
        isPublished: true,
        sku: 'TEST-FAV-SORT-003',
        images: ['/images/test.jpg'],
        avgRating: 0,
        numReviews: 0,
      })

      // Add favorites with delay to ensure different timestamps
      await addFavorite(productId)
      await new Promise(resolve => setTimeout(resolve, 100))
      await addFavorite(product2._id.toString())
      await new Promise(resolve => setTimeout(resolve, 100))
      await addFavorite(product3._id.toString())

      const result = await getMyFavorites({ page: 1, limit: 12 })

      // Should be in reverse chronological order
      expect(result.data[0].slug).toBe('product-3')
      expect(result.data[1].slug).toBe('product-2')
      expect(result.data[2].slug).toBe('test-product-favorites')

      // Clean up
      await Product.deleteMany({ _id: { $in: [product2._id, product3._id] } })
    })
  })
})
