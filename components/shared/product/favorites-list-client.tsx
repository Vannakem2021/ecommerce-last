'use client'

import React, { useOptimistic, startTransition } from 'react'
import ProductCard from '@/components/shared/product/product-card'
import { IProduct } from '@/lib/db/models/product.model'
import useFavorites from '@/hooks/use-favorites'

export default function FavoritesListClient({ products }: { products: IProduct[] }) {
  const [optimisticProducts, removeOptimistic] = useOptimistic(
    products,
    (state: IProduct[], id: string) => state.filter((p) => p._id !== id)
  )

  const { remove, loaded } = useFavorites()

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {optimisticProducts.map((product) => (
        <form
          key={product._id}
          onSubmit={async (e) => {
            e.preventDefault()
            // React 19: optimistic updates must occur in a transition
            startTransition(() => removeOptimistic(product._id))
            await remove(product._id)
          }}
        >
          <ProductCard
            product={product}
            hideAddToCart
            favoriteButtonSubmit
            favoriteButtonControlled
          />
        </form>
      ))}
      {loaded && optimisticProducts.length === 0 && (
        <div className='py-6 text-muted-foreground'>No favorites yet</div>
      )}
    </div>
  )
}
