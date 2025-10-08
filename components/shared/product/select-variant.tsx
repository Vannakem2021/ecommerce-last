import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import Link from 'next/link'
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

export default function SelectVariant({
  product,
  size,
  color,
  onColorChange,
}: {
  product: IProduct
  color: string
  size: string
  onColorChange?: (color: string) => void
}) {
  const selectedColor = color || product.colors[0]
  const selectedSize = size || product.sizes[0]

  const handleColorClick = (clickedColor: string) => {
    if (onColorChange) {
      onColorChange(clickedColor)
    }
  }

  return (
    <>
      {product.colors.length > 0 && (
        <div className='space-y-2'>
          <div className='text-sm font-medium'>Color:</div>
          <div className='flex flex-wrap gap-2'>
            {product.colors.map((x: string) => {
              const normalizedColor = normalizeColor(x)
              const isLight = isLightColor(x)
              
              // If onColorChange is provided, use button instead of link
              if (onColorChange) {
                return (
                  <button
                    key={x}
                    onClick={() => handleColorClick(x)}
                    className='relative rounded-full transition-all hover:scale-110'
                    title={x}
                    aria-label={`Select color ${x}`}
                  >
                    <span
                      style={{ 
                        backgroundColor: normalizedColor,
                      }}
                      className='inline-flex h-10 w-10 rounded-full border-2 border-gray-300 dark:border-gray-600 items-center justify-center'
                    >
                      {selectedColor === x && (
                        <Check 
                          className={`h-5 w-5 drop-shadow-lg ${isLight ? 'text-gray-900' : 'text-white'}`}
                          strokeWidth={3} 
                        />
                      )}
                    </span>
                  </button>
                )
              }
              
              // Otherwise use Link (legacy behavior)
              return (
              <Link
                key={x}
                replace
                scroll={false}
                href={`?${new URLSearchParams({
                  color: x,
                  size: selectedSize,
                })}`}
                className='relative rounded-full transition-all hover:scale-110'
                title={x}
                aria-label={`Select color ${x}`}
              >
                <span
                  style={{ 
                    backgroundColor: normalizedColor,
                  }}
                  className='inline-flex h-10 w-10 rounded-full border-2 border-gray-300 dark:border-gray-600 items-center justify-center'
                >
                  {selectedColor === x && (
                    <Check 
                      className={`h-5 w-5 drop-shadow-lg ${isLight ? 'text-gray-900' : 'text-white'}`}
                      strokeWidth={3} 
                    />
                  )}
                </span>
              </Link>
            )})}
          </div>
        </div>
      )}
      {product.sizes.length > 0 && (
        <div className='mt-2 space-x-2 space-y-2'>
          <div>Size:</div>
          {product.sizes.map((x: string) => (
            <Button
              asChild
              variant='outline'
              className={
                selectedSize === x ? 'border-2  border-primary' : 'border-2  '
              }
              key={x}
            >
              <Link
                replace
                scroll={false}
                href={`?${new URLSearchParams({
                  color: selectedColor,
                  size: x,
                })}`}
              >
                {x}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </>
  )
}
