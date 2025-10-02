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
  limit,
}: {
  query: string
  page?: number
  sort?: string
  limit?: number
}) {
  await connectToDatabase()

  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}

  const order: Record<string, 1 | -1> =
    sort === 'name-asc'
      ? { name: 1 }
      : sort === 'name-desc'
        ? { name: -1 }
        : { _id: -1 }

  const brands = await Brand.find({
    ...queryFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countBrands = await Brand.countDocuments({
    ...queryFilter,
  })
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
  
  // Filter out brands with no products and apply limit
  const filteredBrands = brandsWithCounts.filter(b => b.productCount > 0)
  const limitedBrands = limit ? filteredBrands.slice(0, limit) : filteredBrands
  
  return JSON.parse(JSON.stringify(limitedBrands)) as (IBrand & { productCount: number })[]
}