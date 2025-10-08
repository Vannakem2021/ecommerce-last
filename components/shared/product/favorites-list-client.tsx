'use client'

import React, { useOptimistic, startTransition } from 'react'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import ProductCard from '@/components/shared/product/product-card'
import { IProduct } from '@/lib/db/models/product.model'
import useFavorites from '@/hooks/use-favorites'
import { Card, CardContent } from '@/components/ui/card'

export default function FavoritesListClient({ products }: { products: IProduct[] }) {
  const [optimisticProducts, removeOptimistic] = useOptimistic(
    products,
    (state: IProduct[], id: string) => state.filter((p) => p._id !== id)
  )

  const { remove, loaded } = useFavorites()

  if (loaded && optimisticProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-base font-medium mb-1">No favorites yet</p>
            <p className="text-sm mb-4">Start adding products to see your favorites here</p>
            <Link 
              href="/search" 
              className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors"
            >
              Browse products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

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
    </div>
  )
}
