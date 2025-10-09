'use client'

import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { round2 } from '@/lib/utils'
import { Check } from 'lucide-react'

// Helper function to normalize color values
const normalizeColor = (color: string): string => {
  // If it's a hex color (starts with #), return as-is
  if (color.startsWith('#')) {
    return color
  }
  // Otherwise, convert to lowercase for CSS color names
  return color.toLowerCase()
}

// Helper function to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
  // Common light colors that need dark checkmark
  const lightColors = ['white', 'yellow', 'lime', 'cyan', 'lightblue', 'lightgreen', 
                       'lightyellow', 'lightcyan', 'lightgray', 'lightgrey', 'silver',
                       'beige', 'ivory', 'lavender', 'pink', 'lightpink', 'peachpuff']
  
  const normalizedColor = color.toLowerCase()
  
  // Check if it's a known light color
  if (lightColors.includes(normalizedColor)) {
    return true
  }
  
  // For hex colors, calculate luminance
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
  }
  
  return false
}

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
    searchParams.get('storage') || product.variants?.storage?.[0] || ''
  )
  const [selectedRam, setSelectedRam] = useState(
    searchParams.get('ram') || product.variants?.ram?.[0] || ''
  )
  const [selectedColor, setSelectedColor] = useState(
    searchParams.get('color') || product.variants?.colors?.[0] || ''
  )

  // Calculate total price
  const calculatePrice = () => {
    // For legacy variant system, no price modifiers - just return base price
    const finalPrice = round2(product.price)
    const finalListPrice = product.listPrice 
      ? round2(product.listPrice)
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
                key={storage}
                variant="outline"
                size="sm"
                className={
                  selectedStorage === storage
                    ? 'border-2 border-primary'
                    : 'border-2'
                }
                onClick={() => handleStorageChange(storage)}
              >
                {storage}
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
                key={ram}
                variant="outline"
                size="sm"
                className={
                  selectedRam === ram
                    ? 'border-2 border-primary'
                    : 'border-2'
                }
                onClick={() => handleRamChange(ram)}
              >
                {ram}
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
            {product.variants.colors.map((color) => {
              const normalizedColor = normalizeColor(color)
              const isLight = isLightColor(color)
              return (
              <button
                key={color}
                type="button"
                className="relative rounded-full transition-all hover:scale-110"
                onClick={() => handleColorChange(color)}
                title={color}
                aria-label={`Select color ${color}`}
              >
                <span
                  style={{ 
                    backgroundColor: normalizedColor,
                  }}
                  className="inline-flex h-10 w-10 rounded-full border-2 border-gray-300 dark:border-gray-600 items-center justify-center"
                >
                  {selectedColor === color && (
                    <Check 
                      className={`h-5 w-5 drop-shadow-lg ${isLight ? 'text-gray-900' : 'text-white'}`}
                      strokeWidth={3} 
                    />
                  )}
                </span>
              </button>
            )})}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook to get current selections and calculated price
export function useVariantPricing(product: IProduct) {
  const searchParams = useSearchParams()
  
  const storage = searchParams.get('storage') || product.variants?.storage?.[0] || ''
  const ram = searchParams.get('ram') || product.variants?.ram?.[0] || ''
  const color = searchParams.get('color') || product.variants?.colors?.[0] || ''
  
  // For legacy variant system, no price modifiers
  return {
    storage,
    ram,
    color,
    price: round2(product.price),
    listPrice: product.listPrice ? round2(product.listPrice) : round2(product.price),
    priceModifier: 0
  }
}
