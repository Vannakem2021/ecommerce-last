'use client'

import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { round2 } from '@/lib/utils'

export default function SelectVariantWithPricing({
  product,
  onPriceChange,
}: {
  product: IProduct
  onPriceChange: (price: number, listPrice: number) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get initial selections from URL or defaults
  const [selectedStorage, setSelectedStorage] = useState(
    searchParams.get('storage') || product.variants?.storage?.[0]?.value || ''
  )
  const [selectedRam, setSelectedRam] = useState(
    searchParams.get('ram') || product.variants?.ram?.[0]?.value || ''
  )
  const [selectedColor, setSelectedColor] = useState(
    searchParams.get('color') || product.variants?.colors?.[0] || ''
  )

  // Calculate total price
  const calculatePrice = () => {
    let priceModifier = 0
    
    // Add storage modifier
    const storageOption = product.variants?.storage?.find(
      (s) => s.value === selectedStorage
    )
    if (storageOption) {
      priceModifier += storageOption.priceModifier
    }
    
    // Add RAM modifier
    const ramOption = product.variants?.ram?.find((r) => r.value === selectedRam)
    if (ramOption) {
      priceModifier += ramOption.priceModifier
    }
    
    const finalPrice = round2(product.price + priceModifier)
    const finalListPrice = product.listPrice 
      ? round2(product.listPrice + priceModifier)
      : finalPrice
    
    return { price: finalPrice, listPrice: finalListPrice }
  }

  // Update URL when variants change
  const updateURL = (storage: string, ram: string, color: string) => {
    const params = new URLSearchParams()
    if (storage) params.set('storage', storage)
    if (ram) params.set('ram', ram)
    if (color) params.set('color', color)
    
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // Notify parent of price changes
  useEffect(() => {
    const { price, listPrice } = calculatePrice()
    onPriceChange(price, listPrice)
  }, [selectedStorage, selectedRam, selectedColor])

  const handleStorageChange = (storage: string) => {
    setSelectedStorage(storage)
    updateURL(storage, selectedRam, selectedColor)
  }

  const handleRamChange = (ram: string) => {
    setSelectedRam(ram)
    updateURL(selectedStorage, ram, selectedColor)
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    updateURL(selectedStorage, selectedRam, color)
  }

  // Don't render if no variants configured
  if (!product.variants || 
      ((!product.variants.storage || product.variants.storage.length === 0) && 
       (!product.variants.ram || product.variants.ram.length === 0) && 
       (!product.variants.colors || product.variants.colors.length === 0))) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Storage Selection */}
      {product.variants.storage && product.variants.storage.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold text-sm">Storage:</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.storage.map((storage) => (
              <Button
                key={storage.value}
                variant="outline"
                size="sm"
                className={
                  selectedStorage === storage.value
                    ? 'border-2 border-primary'
                    : 'border-2'
                }
                onClick={() => handleStorageChange(storage.value)}
              >
                {storage.value}
                {storage.priceModifier > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    +${storage.priceModifier}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* RAM Selection */}
      {product.variants.ram && product.variants.ram.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold text-sm">RAM:</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.ram.map((ram) => (
              <Button
                key={ram.value}
                variant="outline"
                size="sm"
                className={
                  selectedRam === ram.value
                    ? 'border-2 border-primary'
                    : 'border-2'
                }
                onClick={() => handleRamChange(ram.value)}
              >
                {ram.value}
                {ram.priceModifier > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    +${ram.priceModifier}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {product.variants.colors && product.variants.colors.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold text-sm">Color:</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.colors.map((color) => (
              <Button
                key={color}
                variant="outline"
                size="sm"
                className={
                  selectedColor === color
                    ? 'border-2 border-primary'
                    : 'border-2'
                }
                onClick={() => handleColorChange(color)}
              >
                <div
                  style={{ backgroundColor: color.toLowerCase() }}
                  className="h-3 w-3 rounded-full border border-muted-foreground mr-1"
                />
                {color}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook to get current selections and calculated price
export function useVariantPricing(product: IProduct) {
  const searchParams = useSearchParams()
  
  const storage = searchParams.get('storage') || product.variants?.storage?.[0]?.value || ''
  const ram = searchParams.get('ram') || product.variants?.ram?.[0]?.value || ''
  const color = searchParams.get('color') || product.variants?.colors?.[0] || ''
  
  let priceModifier = 0
  
  const storageOption = product.variants?.storage?.find((s) => s.value === storage)
  if (storageOption) priceModifier += storageOption.priceModifier
  
  const ramOption = product.variants?.ram?.find((r) => r.value === ram)
  if (ramOption) priceModifier += ramOption.priceModifier
  
  return {
    storage,
    ram,
    color,
    price: round2(product.price + priceModifier),
    listPrice: product.listPrice ? round2(product.listPrice + priceModifier) : round2(product.price + priceModifier),
    priceModifier
  }
}
