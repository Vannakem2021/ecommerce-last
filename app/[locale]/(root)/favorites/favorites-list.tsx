'use client'

import React from 'react'
import ProductCard from '@/components/shared/product/product-card'
import { IProduct } from '@/lib/db/models/product.model'
import useFavorites from '@/hooks/use-favorites'

export default function FavoritesList({ products }: { products: IProduct[] }) {
  const { ids, loaded } = useFavorites()

  const visible = loaded ? products.filter((p) => ids.includes(p._id)) : products

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {visible.map((product) => (
        <ProductCard key={product._id} product={product} hideAddToCart />
      ))}
      {loaded && visible.length === 0 && (
        <div className='py-6 text-muted-foreground'>No favorites yet</div>
      )}
    </div>
  )
}
