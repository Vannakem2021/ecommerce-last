'use client'

import { useState, useMemo } from 'react'
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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  
  // Check if product has configuration-based variants
  const hasConfigurations = product.productType === 'variant' && 
    product.configurations && 
    product.configurations.length > 0

  // Legacy variant system check
  const hasLegacyVariants = product.variants && (
    (product.variants.storage && product.variants.storage.length > 0) ||
    (product.variants.ram && product.variants.ram.length > 0) ||
    (product.variants.colors && product.variants.colors.length > 0)
  )

  // Extract unique memory configurations (RAM | Storage) from configurations
  const memoryConfigurations = useMemo(() => {
    if (!hasConfigurations) return []
    
    const uniqueMemory = new Set<string>()
    product.configurations!.forEach(config => {
      const { ram, storage } = config.attributes
      if (ram && storage) {
        uniqueMemory.add(`${ram}|${storage}`)
      } else if (ram) {
        uniqueMemory.add(ram)
      } else if (storage) {
        uniqueMemory.add(storage)
      }
    })
    
    return Array.from(uniqueMemory)
  }, [hasConfigurations, product.configurations])

  // Extract unique colors from configurations
  const availableColors = useMemo(() => {
    if (!hasConfigurations) return product.colors || []
    
    const uniqueColors = new Set<string>()
    product.configurations!.forEach(config => {
      if (config.attributes.color) {
        uniqueColors.add(config.attributes.color)
      }
    })
    
    return Array.from(uniqueColors)
  }, [hasConfigurations, product.configurations, product.colors])

  // State for selected memory and color
  const [selectedMemory, setSelectedMemory] = useState<string>(memoryConfigurations[0] || '')
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || '')

  // Find the current configuration based on selections
  const currentConfiguration = useMemo(() => {
    if (!hasConfigurations) return null
    
    return product.configurations!.find(config => {
      const configMemory = config.attributes.ram && config.attributes.storage
        ? `${config.attributes.ram}|${config.attributes.storage}`
        : config.attributes.ram || config.attributes.storage || ''
      
      const colorMatch = !selectedColor || !config.attributes.color || config.attributes.color === selectedColor
      
      return configMemory === selectedMemory && colorMatch
    }) || product.configurations!.find(c => c.isDefault) || product.configurations![0]
  }, [hasConfigurations, product.configurations, selectedMemory, selectedColor])

  // Legacy system support
  const storage = searchParams.get('storage') || product.variants?.storage?.[0]?.value || ''
  const ram = searchParams.get('ram') || product.variants?.ram?.[0]?.value || ''
  const color = searchParams.get('color') || 
    (hasLegacyVariants ? product.variants?.colors?.[0] : product.colors[0]) || ''
  const size = searchParams.get('size') || product.sizes[0] || ''

  // Calculate price and stock based on configuration
  const currentPrice = hasConfigurations && currentConfiguration 
    ? currentConfiguration.price 
    : product.price
  
  const currentStock = hasConfigurations && currentConfiguration
    ? currentConfiguration.stock
    : product.countInStock

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

      {/* Configuration-Based Variant Selection */}
      {hasConfigurations ? (
        <div className="space-y-4">
          {/* Memory Configuration Selector */}
          {memoryConfigurations.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Memory Configuration</label>
              <div className="flex flex-wrap gap-2">
                {memoryConfigurations.map((memory) => (
                  <Button
                    key={memory}
                    variant={selectedMemory === memory ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMemory(memory)}
                    className={cn(
                      "font-medium",
                      selectedMemory === memory && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    {memory}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector - Use existing color circle UI */}
          {availableColors.length > 0 && (
            <SelectVariant
              product={{ ...product, colors: availableColors }}
              size=""
              color={selectedColor}
              onColorChange={setSelectedColor}
            />
          )}

          {/* Current Configuration Info */}
          {currentConfiguration && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU:</span>
                <span className="font-medium">{currentConfiguration.sku}</span>
              </div>
            </div>
          )}
        </div>
      ) : hasLegacyVariants ? (
        <SelectVariantWithPricing
          product={product}
          onPriceChange={(price) => {}}
        />
      ) : (
        <SelectVariant
          product={product}
          size={size}
          color={color}
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
              category: typeof product.category === 'object' 
                ? (product.category as unknown as { name: string }).name 
                : product.category,
              price: round2(currentPrice),
              listPrice: product.listPrice,
              // Configuration details
              configurationSku: hasConfigurations && currentConfiguration ? currentConfiguration.sku : undefined,
              basePrice: hasConfigurations && currentConfiguration ? currentConfiguration.price : product.price,
              variantModifiers: undefined,
              quantity: quantity,
              image: product.images && product.images[0] && product.images[0].trim() !== '' ? product.images[0] : '/placeholder.png',
              size: hasConfigurations ? selectedMemory : size,
              color: hasConfigurations ? selectedColor : color,
            }}
          />
        </>
      )}
    </div>
  )
}
