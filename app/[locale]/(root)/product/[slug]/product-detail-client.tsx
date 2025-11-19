'use client'

import { useState } from 'react'
import { IProduct } from '@/lib/db/models/product.model'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import AddToCart from '@/components/shared/product/add-to-cart'
import StockBadge from '@/components/shared/product/stock-badge'
import QuantitySelector from '@/components/shared/product/quantity-selector'
import { generateId, round2 } from '@/lib/utils'
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
  // Simple product - use direct values
  const currentPrice = product.price
  const currentStock = product.countInStock
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || '')
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
  }

  return (
    <div className="space-y-6">
      {/* Price Display - Larger and more prominent */}
      <div className="space-y-2">
        <ProductPrice
          price={currentPrice}
          listPrice={product.listPrice}
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
        countInStock={currentStock}
        lowStockThreshold={3}
        translations={{
          inStock: translations.inStock,
          lowStock: translations.lowStock,
          outOfStock: translations.outOfStock,
        }}
      />

      {/* Low Stock Warning */}
      {currentStock > 0 && currentStock <= 3 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-300">
          <span className="font-semibold">⚡ {translations.onlyXLeft}</span>
        </div>
      )}

      <Separator />

      {/* Color Selection - Simple products only show colors */}
      {product.colors.length > 0 && (
        <SelectVariant
          product={{ ...product, sizes: [] } as any}
          size=""
          color={selectedColor}
          onColorChange={setSelectedColor}
        />
      )}

      {/* Quantity Selector */}
      {currentStock > 0 && (
        <>
          <Separator />
          <QuantitySelector
            max={Math.min(currentStock, 10)}
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
      {currentStock > 0 && (
        <>
          <Separator />
          <AddToCart
            item={{
              clientId: generateId(),
              product: product._id,
              countInStock: currentStock,
              name: product.name,
              slug: product.slug,
              category: typeof product.category === 'object' && product.category !== null 
                ? (product.category as unknown as { name: string }).name 
                : product.category,
              price: round2(currentPrice),
              listPrice: product.listPrice,
              sku: product.sku,
              basePrice: product.price,
              variantModifiers: undefined,
              quantity: quantity,
              image: product.images && product.images[0] && product.images[0].trim() !== '' ? product.images[0] : '/placeholder.png',
              size: '',
              color: selectedColor,
            }}
          />
        </>
      )}
    </div>
  )
}
