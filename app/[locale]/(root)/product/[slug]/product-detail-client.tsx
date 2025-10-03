'use client'

import { useState } from 'react'
import { IProduct } from '@/lib/db/models/product.model'
import SelectVariantWithPricing from '@/components/shared/product/select-variant-with-pricing'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/components/ui/card'
import { generateId, round2 } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export default function ProductDetailClient({
  product,
  translations,
}: {
  product: IProduct
  translations: {
    inStock: string
    outOfStock: string
    onlyXLeft: string
  }
}) {
  const searchParams = useSearchParams()
  
  // Check if product has new variant system
  const hasVariants = product.variants && (
    (product.variants.storage && product.variants.storage.length > 0) ||
    (product.variants.ram && product.variants.ram.length > 0) ||
    (product.variants.colors && product.variants.colors.length > 0)
  )

  // State for dynamic pricing
  const [currentPrice, setCurrentPrice] = useState(product.price)
  const [currentListPrice, setCurrentListPrice] = useState(product.listPrice || product.price)

  const handlePriceChange = (newPrice: number, newListPrice: number) => {
    setCurrentPrice(newPrice)
    setCurrentListPrice(newListPrice)
  }

  // Get current selections from URL
  const storage = searchParams.get('storage') || product.variants?.storage?.[0]?.value || ''
  const ram = searchParams.get('ram') || product.variants?.ram?.[0]?.value || ''
  const color = searchParams.get('color') || 
    (hasVariants ? product.variants?.colors?.[0] : product.colors[0]) || ''
  const size = searchParams.get('size') || product.sizes[0] || ''

  return (
    <div className="space-y-4">
      {/* Price Display */}
      <ProductPrice
        price={currentPrice}
        listPrice={currentListPrice}
        forListing={false}
      />

      {/* Variant Selection */}
      {hasVariants ? (
        <SelectVariantWithPricing
          product={product}
          onPriceChange={handlePriceChange}
        />
      ) : (
        <SelectVariant
          product={product}
          size={size}
          color={color}
        />
      )}

      {/* Stock & Add to Cart */}
      <div className="flex flex-col gap-3">
        {product.countInStock > 0 && product.countInStock <= 3 && (
          <div className="text-destructive font-bold">
            {translations.onlyXLeft}
          </div>
        )}
        
        {product.countInStock !== 0 ? (
          <div className="text-green-700 text-lg font-semibold">
            {translations.inStock}
          </div>
        ) : (
          <div className="text-destructive text-lg font-semibold">
            {translations.outOfStock}
          </div>
        )}

        {product.countInStock !== 0 && (
          <AddToCart
            item={{
              clientId: generateId(),
              product: product._id,
              countInStock: product.countInStock,
              name: product.name,
              slug: product.slug,
              category: typeof product.category === 'object' 
                ? (product.category as unknown as { name: string }).name 
                : product.category,
              price: round2(currentPrice),
              quantity: 1,
              image: product.images[0],
              size: hasVariants ? (storage || ram || size) : size,
              color: color,
            }}
          />
        )}
      </div>
    </div>
  )
}
