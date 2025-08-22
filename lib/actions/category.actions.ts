'use server'

import { connectToDatabase } from '@/lib/db'
import Category, { ICategory } from '@/lib/db/models/category.model'
import { revalidatePath } from 'next/cache'
import { formatError } from '../utils'
import { CategoryInputSchema, CategoryUpdateSchema } from '../validator'
import { ICategoryInput } from '@/types'
import { z } from 'zod'
import { getSetting } from './setting.actions'

// CREATE
export async function createCategory(data: ICategoryInput) {
  try {
    const category = CategoryInputSchema.parse(data)
    await connectToDatabase()
    await Category.create(category)
    revalidatePath('/admin/categories')
    return {
      success: true,
      message: 'Category created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateCategory(data: z.infer<typeof CategoryUpdateSchema>) {
  try {
    const category = CategoryUpdateSchema.parse(data)
    await connectToDatabase()
    await Category.findByIdAndUpdate(category._id, category)
    revalidatePath('/admin/categories')
    return {
      success: true,
      message: 'Category updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE
export async function deleteCategory(id: string) {
  try {
    await connectToDatabase()
    const res = await Category.findByIdAndDelete(id)
    if (!res) throw new Error('Category not found')
    revalidatePath('/admin/categories')
    return {
      success: true,
      message: 'Category deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ONE CATEGORY BY ID
export async function getCategoryById(categoryId: string) {
  await connectToDatabase()
  const category = await Category.findById(categoryId)
  return JSON.parse(JSON.stringify(category)) as ICategory
}

// GET ALL CATEGORIES FOR ADMIN
export async function getAllCategoriesForAdmin({
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

  const categories = await Category.find({
    ...queryFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countCategories = await Category.countDocuments({
    ...queryFilter,
  })
  return {
    categories: JSON.parse(JSON.stringify(categories)) as ICategory[],
    totalPages: Math.ceil(countCategories / limit),
    totalCategories: countCategories,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + categories.length,
  }
}

// GET ALL ACTIVE CATEGORIES
export async function getAllActiveCategories() {
  await connectToDatabase()
  const categories = await Category.find({ active: true }).sort({ name: 1 }).lean()
  return JSON.parse(JSON.stringify(categories)) as ICategory[]
}
