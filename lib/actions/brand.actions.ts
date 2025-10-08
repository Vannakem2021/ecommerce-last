'use server'

import { connectToDatabase } from '@/lib/db'
import Brand, { IBrand } from '@/lib/db/models/brand.model'
import { revalidatePath } from 'next/cache'
import { formatError } from '../utils'
import { BrandInputSchema, BrandUpdateSchema } from '../validator'
import { IBrandInput } from '@/types'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import { requirePermission } from '../rbac'

// CREATE
export async function createBrand(data: IBrandInput) {
  try {
    // Check if current user has permission to create brands
    await requirePermission('brands.create')

    const brand = BrandInputSchema.parse(data)
    await connectToDatabase()
    await Brand.create(brand)
    revalidatePath('/admin/brands')
    revalidatePath('/') // Revalidate homepage to show new brand
    return {
      success: true,
      message: 'Brand created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateBrand(data: z.infer<typeof BrandUpdateSchema>) {
  try {
    // Check if current user has permission to update brands
    await requirePermission('brands.update')

    const brand = BrandUpdateSchema.parse(data)
    await connectToDatabase()
    await Brand.findByIdAndUpdate(brand._id, brand)
    revalidatePath('/admin/brands')
    revalidatePath('/') // Revalidate homepage to show brand updates
    return {
      success: true,
      message: 'Brand updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE
export async function deleteBrand(id: string) {
  try {
    // Check if current user has permission to delete brands
    await requirePermission('brands.delete')

    await connectToDatabase()
    const res = await Brand.findByIdAndDelete(id)
    if (!res) throw new Error('Brand not found')
    revalidatePath('/admin/brands')
    revalidatePath('/') // Revalidate homepage to remove deleted brand
    return {
      success: true,
      message: 'Brand deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ONE BRAND BY ID
export async function getBrandById(brandId: string) {
  await connectToDatabase()
  const brand = await Brand.findById(brandId)
  return JSON.parse(JSON.stringify(brand)) as IBrand
}

// GET ALL BRANDS FOR ADMIN
export async function getAllBrandsForAdmin({
  query,
  page = 1,
  sort = 'latest',
  status = 'all',
  limit,
}: {
  query: string
  page?: number
  sort?: string
  status?: string
  limit?: number
}) {
  await connectToDatabase()

  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  
  // Build query filter
  const queryFilter: Record<string, unknown> = {}
  
  // Search filter
  if (query && query !== 'all') {
    queryFilter.name = {
      $regex: query,
      $options: 'i',
    }
  }
  
  // Status filter
  if (status === 'active') {
    queryFilter.active = true
  } else if (status === 'inactive') {
    queryFilter.active = false
  }

  // Sort order
  const order: Record<string, 1 | -1> =
    sort === 'name-asc'
      ? { name: 1 }
      : sort === 'name-desc'
        ? { name: -1 }
        : sort === 'oldest'
          ? { _id: 1 }
          : { _id: -1 } // latest (default)

  const brands = await Brand.find(queryFilter)
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countBrands = await Brand.countDocuments(queryFilter)
  
  return {
    brands: JSON.parse(JSON.stringify(brands)) as IBrand[],
    totalPages: Math.ceil(countBrands / limit),
    totalBrands: countBrands,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + brands.length,
  }
}

// GET ALL ACTIVE BRANDS
export async function getAllActiveBrands() {
  await connectToDatabase()
  const brands = await Brand.find({ active: true }).sort({ name: 1 }).lean()
  return JSON.parse(JSON.stringify(brands)) as IBrand[]
}


// GET ALL ACTIVE BRANDS WITH PRODUCT COUNTS
export async function getAllActiveBrandsWithCounts(limit?: number) {
  await connectToDatabase()
  
  // Import Product model
  const Product = (await import('@/lib/db/models/product.model')).default
  
  const brands = await Brand.find({ active: true }).sort({ name: 1 }).lean()
  
  // Get product counts for each brand
  const brandsWithCounts = await Promise.all(
    brands.map(async (brand) => {
      const count = await Product.countDocuments({ 
        brand: brand._id,
        isPublished: true 
      })
      return {
        ...brand,
        productCount: count,
      }
    })
  )
  
  // Apply limit (show all active brands, even with 0 products)
  const limitedBrands = limit ? brandsWithCounts.slice(0, limit) : brandsWithCounts
  
  return JSON.parse(JSON.stringify(limitedBrands)) as (IBrand & { productCount: number })[]
}