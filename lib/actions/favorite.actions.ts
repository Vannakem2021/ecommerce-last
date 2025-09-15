'use server'

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Favorite from '@/lib/db/models/favorite.model'
import Product from '@/lib/db/models/product.model'
import { formatError } from '@/lib/utils'
import { FavoriteListQuerySchema, FavoriteToggleSchema } from '@/lib/validator'
import { revalidatePath } from 'next/cache'
import { i18n } from '@/i18n-config'

function revalidateFavoritesPaths() {
  // Revalidate favorites pages across all locales
  try {
    for (const loc of i18n.locales) {
      revalidatePath(`/${loc.code}/favorites`)
    }
  } catch {}
}

export async function addFavorite(productId: string) {
  try {
    const { productId: pid } = FavoriteToggleSchema.parse({ productId })
    const session = await auth()
    if (!session?.user?.id) throw new Error('Authentication required')
    await connectToDatabase()
    // Validate product existence to avoid invalid references
    const product = await Product.findById(pid).select('_id').lean()
    if (!product) throw new Error('Product not found')
    await Favorite.updateOne(
      { user: session.user.id, product: pid },
      { $setOnInsert: { user: session.user.id, product: pid } },
      { upsert: true }
    )
    revalidateFavoritesPaths()
    return { success: true, message: 'Added to Favorites' }
  } catch (e) {
    return { success: false, message: formatError(e) }
  }
}

export async function removeFavorite(productId: string) {
  try {
    const { productId: pid } = FavoriteToggleSchema.parse({ productId })
    const session = await auth()
    if (!session?.user?.id) throw new Error('Authentication required')
    await connectToDatabase()
    await Favorite.deleteOne({ user: session.user.id, product: pid })
    revalidateFavoritesPaths()
    return { success: true, message: 'Removed from Favorites' }
  } catch (e) {
    return { success: false, message: formatError(e) }
  }
}

export async function toggleFavorite(productId: string) {
  try {
    const { productId: pid } = FavoriteToggleSchema.parse({ productId })
    const session = await auth()
    if (!session?.user?.id) throw new Error('Authentication required')
    await connectToDatabase()
    const existing = await Favorite.findOne({ user: session.user.id, product: pid })
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id })
      revalidateFavoritesPaths()
      return { success: true, message: 'Removed from Favorites', isFavorite: false }
    }
    // Validate product existence
    const product = await Product.findById(pid).select('_id').lean()
    if (!product) throw new Error('Product not found')
    await Favorite.create({ user: session.user.id, product: pid })
    revalidateFavoritesPaths()
    return { success: true, message: 'Added to Favorites', isFavorite: true }
  } catch (e) {
    return { success: false, message: formatError(e) }
  }
}

export async function getMyFavoriteIds() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Authentication required')
  await connectToDatabase()
  const favs = await Favorite.find({ user: session.user.id }).select('product').lean()
  return favs.map((f) => f.product.toString()) as string[]
}

export async function getMyFavorites({ page, limit }: { page?: number; limit?: number }) {
  const { page: p, limit: l } = FavoriteListQuerySchema.parse({ page, limit })
  const session = await auth()
  if (!session?.user?.id) throw new Error('Authentication required')
  await connectToDatabase()

  const q = { user: session.user.id }
  const total = await Favorite.countDocuments(q)
  const favs = await Favorite.find(q)
    .sort({ createdAt: -1 })
    .skip((p - 1) * (l || 12))
    .limit(l || 12)
    .populate({
      path: 'product',
      select:
        'name slug images brand category price listPrice tags avgRating numReviews countInStock isPublished sizes colors',
      populate: [
        { path: 'brand', select: 'name' },
        { path: 'category', select: 'name' },
      ],
    })
    .lean()

  const products = favs
    .map((f) => f.product)
    .filter(Boolean) // just in case product was deleted

  return {
    data: JSON.parse(JSON.stringify(products)),
    totalPages: Math.max(1, Math.ceil(total / (l || 12))),
  }
}
