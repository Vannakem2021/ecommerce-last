'use client'

import { useState } from 'react'
import { IProduct } from '@/lib/db/models/product.model'
import SelectVariantWithPricing from '@/components/shared/product/select-variant-with-pricing'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import AddToCart from '@/components/shared/product/add-to-cart'
import StockBadge from '@/components/shared/product/stock-badge'
import QuantitySelector from '@/components/shared/product/quantity-selector'
import { generateId, round2 } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

export default function ProductDetailClient({
  product,
  translations,
}: {
  product: IProduct
  translations: {
    inStock: string
    outOfStock: string
    lowStock: string
    onlyXLeft: string
    quantity: string
    max: string
    taxIncluded: string
    freeShipping: string
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
  const [quantity, setQuantity] = useState(1)

  const handlePriceChange = (newPrice: number, newListPrice: number) => {
    setCurrentPrice(newPrice)
    setCurrentListPrice(newListPrice)
  }

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
  }

  // Get current selections from URL
  const storage = searchParams.get('storage') || product.variants?.storage?.[0]?.value || ''
  const ram = searchParams.get('ram') || product.variants?.ram?.[0]?.value || ''
  const color = searchParams.get('color') || 
    (hasVariants ? product.variants?.colors?.[0] : product.colors[0]) || ''
  const size = searchParams.get('size') || product.sizes[0] || ''

  // Calculate savings
  const hasSavings = currentListPrice > currentPrice
  const savingsPercent = hasSavings 
    ? Math.round(((currentListPrice - currentPrice) / currentListPrice) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Price Display - Larger and more prominent */}
      <div className="space-y-2">
        <ProductPrice
          price={currentPrice}
          listPrice={currentListPrice}
          forListing={false}
          className="text-4xl"
        />
        {/* Tax and Shipping Info */}
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>• {translations.taxIncluded}</span>
          {currentPrice >= 50 && (
            <span>• {translations.freeShipping}</span>
          )}
        </div>
      </div>

      <Separator />

      {/* Stock Status - Prominent Badge */}
      <StockBadge
        countInStock={product.countInStock}
        lowStockThreshold={3}
        translations={{
          inStock: translations.inStock,
          lowStock: translations.lowStock,
          outOfStock: translations.outOfStock,
        }}
      />

      {/* Low Stock Warning */}
      {product.countInStock > 0 && product.countInStock <= 3 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-300">
          <span className="font-semibold">⚡ {translations.onlyXLeft}</span>
        </div>
      )}

      <Separator />

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

      {/* Quantity Selector */}
      {product.countInStock > 0 && (
        <>
          <Separator />
          <QuantitySelector
            max={Math.min(product.countInStock, 10)}
            defaultValue={1}
            onChange={handleQuantityChange}
            translations={{
              quantity: translations.quantity,
              max: translations.max,
            }}
          />
        </>
      )}

      {/* Add to Cart Button */}
      {product.countInStock > 0 && (
        <>
          <Separator />
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
              quantity: quantity,
              image: product.images && product.images[0] && product.images[0].trim() !== '' ? product.images[0] : '/placeholder.png',
              size: hasVariants ? (storage || ram || size) : size,
              color: color,
            }}
          />
        </>
      )}
    </div>
  )
}
