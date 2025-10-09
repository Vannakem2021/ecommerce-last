'use server'

import { connectToDatabase } from '@/lib/db'
import Promotion, { IPromotion } from '@/lib/db/models/promotion.model'
import PromotionUsage from '@/lib/db/models/promotion-usage.model'
import mongoose from 'mongoose'
import Product from '@/lib/db/models/product.model'
import Category from '@/lib/db/models/category.model'
import { revalidatePath } from 'next/cache'
import { formatError, round2 } from '../utils'
import {
  PromotionInputSchema,
  PromotionUpdateSchema,
  PromotionUsageInputSchema
} from '../validator'
import {
  IPromotionInput,
  IPromotionUpdate,
  IPromotionUsageInput,
  PromotionValidationResult,
  Cart,
  OrderItem
} from '@/types'
import { requirePermission } from '../rbac'
import { auth } from '@/auth'
import { getSetting } from './setting.actions'

// CREATE PROMOTION
export async function createPromotion(data: IPromotionInput) {
  try {
    await requirePermission('promotions.create')
    
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const validatedData = PromotionInputSchema.parse(data)

    // Extra business validations
    // 1) Date sanity: ensure at least 1 minute window
    if (!(validatedData.endDate > validatedData.startDate)) {
      throw new Error('End date must be after start date')
    }
    if (validatedData.endDate.getTime() - validatedData.startDate.getTime() < 60_000) {
      throw new Error('Promotion period must be at least 1 minute long')
    }

    // 2) Conditional value rules
    if (validatedData.type === 'percentage') {
      if (validatedData.value < 1 || validatedData.value > 100) {
        throw new Error('Percentage value must be between 1 and 100')
      }
    } else if (validatedData.type === 'fixed') {
      if (validatedData.value <= 0) {
        throw new Error('Fixed discount value must be greater than 0')
      }
      // 6) Minimum order value vs discount amount
      if (validatedData.minOrderValue > 0 && validatedData.minOrderValue < validatedData.value) {
        throw new Error('Minimum order value must be greater than or equal to the discount amount')
      }
    } else if (validatedData.type === 'free_shipping') {
      // Ensure value is 0 for free shipping
      validatedData.value = 0
    }

    // 4) Validate selected products/categories exist and are active
    await connectToDatabase()
    if (validatedData.appliesTo === 'products') {
      if (!validatedData.applicableProducts?.length) {
        throw new Error('Select at least one product for this promotion')
      }
      const found = await Product.countDocuments({
        _id: { $in: validatedData.applicableProducts },
        isPublished: true,
      })
      if (found !== validatedData.applicableProducts.length) {
        throw new Error('Some selected products do not exist or are not active')
      }
    }
    if (validatedData.appliesTo === 'categories') {
      if (!validatedData.applicableCategories?.length) {
        throw new Error('Select at least one category for this promotion')
      }
      const found = await Category.countDocuments({
        _id: { $in: validatedData.applicableCategories },
        active: true,
      })
      if (found !== validatedData.applicableCategories.length) {
        throw new Error('Some selected categories do not exist or are not active')
      }
    }

    const promotion = {
      ...validatedData,
      createdBy: new mongoose.Types.ObjectId(session.user.id)
    }
    
    // 5) Robust duplicate code check (case-insensitive)
    const existingPromotion = await Promotion.findOne({ code: promotion.code.toUpperCase() })
    if (existingPromotion) {
      throw new Error('Promotion code already exists')
    }

    await Promotion.create(promotion)
    revalidatePath('/admin/promotions')
    
    return {
      success: true,
      message: 'Promotion created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE PROMOTION
export async function updatePromotion(data: IPromotionUpdate) {
  try {
    await requirePermission('promotions.update')
    
    const promotion = PromotionUpdateSchema.parse(data)
    await connectToDatabase()
    
    // Check if promotion exists
    const existingPromotion = await Promotion.findById(promotion._id)
    if (!existingPromotion) {
      throw new Error('Promotion not found')
    }

    // Check if code is being changed and if new code already exists (case-insensitive)
    if (promotion.code !== (existingPromotion as unknown as { code: string }).code) {
      const codeExists = await Promotion.findOne({ code: promotion.code.toUpperCase(), _id: { $ne: promotion._id } })
      if (codeExists) throw new Error('Promotion code already exists')
    }

    // Extra business validations (same as create)
    if (!(promotion.endDate > promotion.startDate)) {
      throw new Error('End date must be after start date')
    }
    if (promotion.endDate.getTime() - promotion.startDate.getTime() < 60_000) {
      throw new Error('Promotion period must be at least 1 minute long')
    }
    if (promotion.type === 'percentage') {
      if (promotion.value < 1 || promotion.value > 100) {
        throw new Error('Percentage value must be between 1 and 100')
      }
    } else if (promotion.type === 'fixed') {
      if (promotion.value <= 0) {
        throw new Error('Fixed discount value must be greater than 0')
      }
      if (promotion.minOrderValue > 0 && promotion.minOrderValue < promotion.value) {
        throw new Error('Minimum order value must be greater than or equal to the discount amount')
      }
    } else if (promotion.type === 'free_shipping') {
      promotion.value = 0
    }

    if (promotion.appliesTo === 'products') {
      if (!promotion.applicableProducts?.length) {
        throw new Error('Select at least one product for this promotion')
      }
      const found = await Product.countDocuments({
        _id: { $in: promotion.applicableProducts },
        isPublished: true,
      })
      if (found !== promotion.applicableProducts.length) {
        throw new Error('Some selected products do not exist or are not active')
      }
    }
    if (promotion.appliesTo === 'categories') {
      if (!promotion.applicableCategories?.length) {
        throw new Error('Select at least one category for this promotion')
      }
      const found = await Category.countDocuments({
        _id: { $in: promotion.applicableCategories },
        active: true,
      })
      if (found !== promotion.applicableCategories.length) {
        throw new Error('Some selected categories do not exist or are not active')
      }
    }

    await Promotion.findByIdAndUpdate(promotion._id, promotion)
    revalidatePath('/admin/promotions')
    
    return {
      success: true,
      message: 'Promotion updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE PROMOTION
export async function deletePromotion(id: string) {
  try {
    await requirePermission('promotions.delete')
    
    await connectToDatabase()
    
    const promotion = await Promotion.findById(id)
    if (!promotion) {
      throw new Error('Promotion not found')
    }

    // Check if promotion has been used
    const usageCount = await PromotionUsage.countDocuments({ promotion: id })
    if (usageCount > 0) {
      throw new Error('Cannot delete promotion that has been used. Deactivate it instead.')
    }

    await Promotion.findByIdAndDelete(id)
    revalidatePath('/admin/promotions')
    
    return {
      success: true,
      message: 'Promotion deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL PROMOTIONS (Admin)
export async function getAllPromotions({
  query = '',
  page = 1,
  sort = 'latest',
  status = 'all'
}: {
  query?: string
  page?: number
  sort?: string
  status?: string
} = {}) {
  try {
    await requirePermission('promotions.read')
    
    await connectToDatabase()
    
    const { common: { pageSize } } = await getSetting()
    const limit = pageSize
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {}
    
    if (query) {
      filter.$or = [
        { code: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }

    if (status === 'active') {
      filter.active = true
    } else if (status === 'inactive') {
      filter.active = false
    }

    // Build sort
    let sortOption: any = {}
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 }
        break
      case 'oldest':
        sortOption = { createdAt: 1 }
        break
      case 'name':
        sortOption = { name: 1 }
        break
      case 'code':
        sortOption = { code: 1 }
        break
      default:
        sortOption = { createdAt: -1 }
    }

    const promotions = await Promotion.find(filter)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name slug')
      .populate('applicableCategories', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)

    const totalPromotions = await Promotion.countDocuments(filter)
    const totalPages = Math.ceil(totalPromotions / limit)

    // Handle cases where users might be deleted
    const processedPromotions = promotions.map(promo => {
      const obj = promo.toObject() as any
      if (obj.createdBy && typeof obj.createdBy === 'object' && !(obj.createdBy as any).name) {
        obj.createdBy = (obj.createdBy as any)._id || obj.createdBy
      }
      return obj
    })

    return {
      promotions: JSON.parse(JSON.stringify(processedPromotions)),
      totalPromotions,
      totalPages,
      page,
    }
  } catch (error) {
    throw new Error(formatError(error))
  }
}

// GET PROMOTION BY ID
export async function getPromotionById(id: string) {
  try {
    await requirePermission('promotions.read')
    
    await connectToDatabase()
    
    const promotion = await Promotion.findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name slug price listPrice')
      .populate('applicableCategories', 'name')

    if (!promotion) {
      throw new Error('Promotion not found')
    }

    // Check if createdBy populate failed (user was deleted)
    const result = promotion.toObject() as any
    if (result.createdBy && typeof result.createdBy === 'object' && !(result.createdBy as any).name) {
      // User was deleted or doesn't exist
      result.createdBy = (result.createdBy as any)._id || result.createdBy
    }

    return JSON.parse(JSON.stringify(result))
  } catch (error) {
    throw new Error(formatError(error))
  }
}

// VALIDATE PROMOTION CODE
export async function validatePromotionCode(
  code: string,
  cart: Cart,
  userId?: string
): Promise<PromotionValidationResult> {
  try {
    await connectToDatabase()

    const promotion = await Promotion.findOne({
      code: code.toUpperCase()
    }).populate('applicableProducts applicableCategories')

    if (!promotion || !(promotion as unknown as { active: boolean }).active) {
      return { success: false, error: 'Invalid or inactive promotion code' }
    }

    const now = new Date()
    const promo = promotion as unknown as { startDate: Date; endDate: Date; usageLimit: number; usedCount: number; userUsageLimit: number; _id: string }
    if (promo.startDate > now || promo.endDate < now) {
      return { success: false, error: 'Promotion code has expired' }
    }

    // Check usage limits
    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return { success: false, error: 'Promotion usage limit reached' }
    }

    // Check user usage limit
    if (userId && promo.userUsageLimit > 0) {
      const userUsageCount = await PromotionUsage.countDocuments({
        promotion: promo._id,
        user: userId
      })
      if (userUsageCount >= promo.userUsageLimit) {
        return { success: false, error: 'You have reached the usage limit for this promotion' }
      }
    }

    // Calculate cart total and check minimum order value
    const cartTotal = cart.itemsPrice || 0
    if (cartTotal < (promo as unknown as { minOrderValue: number }).minOrderValue) {
      return {
        success: false,
        error: `Minimum order value of $${(promo as unknown as { minOrderValue: number }).minOrderValue} required`
      }
    }

    // Check if promotion applies to cart items
    let eligibleItems = getEligibleCartItems(cart.items, promotion)
    if (eligibleItems.length === 0) {
      return {
        success: false,
        error: 'Promotion not applicable to items in your cart'
      }
    }

    // Check if promotion excludes sale items (hot deals)
    const excludeSaleItems = (promotion as unknown as { excludeSaleItems?: boolean }).excludeSaleItems
    if (excludeSaleItems) {
      // Filter out items that are on sale (have listPrice > price)
      const nonSaleItems = eligibleItems.filter(item => {
        // If item has listPrice and it's greater than price, it's a hot deal
        const itemListPrice = (item as unknown as { listPrice?: number }).listPrice
        return !itemListPrice || itemListPrice <= item.price
      })

      if (nonSaleItems.length === 0) {
        return {
          success: false,
          error: 'This promotion code cannot be applied to items already on sale. Please use full-price items to apply this discount.'
        }
      }

      // Update eligible items to only non-sale items
      eligibleItems = nonSaleItems
    }

    // Calculate discount
    const discountResult = calculatePromotionDiscount(eligibleItems, promotion)

    return {
      success: true,
      discount: discountResult.discount,
      promotion: JSON.parse(JSON.stringify(promotion)),
      freeShipping: (promotion as unknown as { type: string }).type === 'free_shipping'
    }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
}

// Helper function to get eligible cart items
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEligibleCartItems(items: OrderItem[], promotion: any): OrderItem[] {
  if (promotion.appliesTo === 'all') {
    return items
  }

  if (promotion.appliesTo === 'products') {
    return items.filter(item =>
      promotion.applicableProducts.some((productId: { toString: () => string }) =>
        productId.toString() === item.product.toString()
      )
    )
  }

  if (promotion.appliesTo === 'categories') {
    return items.filter(item =>
      promotion.applicableCategories.some((categoryId: { toString: () => string }) =>
        categoryId.toString() === item.category.toString()
      )
    )
  }

  return []
}

// Helper function to calculate discount
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculatePromotionDiscount(
  eligibleItems: OrderItem[],
  promotion: any
): { discount: number } {
  if (promotion.type === 'free_shipping') {
    return { discount: 0 } // Free shipping handled separately
  }

  const eligibleTotal = eligibleItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  )

  let discount = 0
  if (promotion.type === 'percentage') {
    discount = round2((promotion.value / 100) * eligibleTotal)
  } else if (promotion.type === 'fixed') {
    discount = Math.min(promotion.value, eligibleTotal)
  }

  // Apply maxDiscountAmount cap if set (prevents excessive discounts)
  if (promotion.maxDiscountAmount > 0) {
    discount = Math.min(discount, promotion.maxDiscountAmount)
  }

  return { discount: round2(discount) }
}

// RECORD PROMOTION USAGE
export async function recordPromotionUsage(
  data: IPromotionUsageInput,
  session?: mongoose.ClientSession
) {
  try {
    const usage = PromotionUsageInputSchema.parse(data)
    // Avoid redundant connect when participating in an existing transaction
    if (!session) await connectToDatabase()

    // Check if usage already recorded for this order
    const existingUsageQuery = PromotionUsage.findOne({ order: usage.order })
    if (session) existingUsageQuery.session(session)
    const existingUsage = await existingUsageQuery
    if (existingUsage) {
      return { success: true, message: 'Promotion usage already recorded for this order' }
    }

    // Create usage record
    if (session) {
      await PromotionUsage.create([usage], { session })
    } else {
      await PromotionUsage.create(usage as any)
    }

    // Increment promotion usage count
    if (session) {
      await Promotion.findByIdAndUpdate(
        usage.promotion,
        { $inc: { usedCount: 1 } },
        { session }
      )
    } else {
      await Promotion.findByIdAndUpdate(
        usage.promotion,
        { $inc: { usedCount: 1 } }
      )
    }

    return {
      success: true,
      message: 'Promotion usage recorded'
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET PROMOTION USAGE STATISTICS
export async function getPromotionUsageStats(promotionId: string) {
  try {
    await requirePermission('promotions.read')

    await connectToDatabase()

    const stats = await PromotionUsage.aggregate([
      { $match: { promotion: promotionId } },
      {
        $group: {
          _id: '$promotion',
          totalUsage: { $sum: 1 },
          totalDiscountGiven: { $sum: '$discountAmount' },
          averageDiscount: { $avg: '$discountAmount' },
          uniqueUsers: { $addToSet: '$user' },
        },
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' },
        },
      },
    ])

    return stats.length > 0 ? stats[0] : {
      totalUsage: 0,
      totalDiscountGiven: 0,
      averageDiscount: 0,
      uniqueUserCount: 0
    }
  } catch (error) {
    throw new Error(formatError(error))
  }
}

// GET ACTIVE PROMOTIONS (Public)
export async function getActivePromotions() {
  try {
    await connectToDatabase()
    
    const now = new Date()
    const promotions = await Promotion.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: 0 },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    })
    .populate('applicableProducts', 'name slug')
    .populate('applicableCategories', 'name')
    .sort({ createdAt: -1 })

    return JSON.parse(JSON.stringify(promotions))
  } catch (error) {
    throw new Error(formatError(error))
  }
}
