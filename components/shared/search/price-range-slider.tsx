'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface PriceRangeSliderProps {
  params: Record<string, string>
  min?: number
  max?: number
}

export default function PriceRangeSlider({ 
  params, 
  min = 0, 
  max = 2000 
}: PriceRangeSliderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('Search')
  
  // Parse current price from params
  const currentPrice = params.price || 'all'
  const [minPrice, maxPrice] = currentPrice === 'all' 
    ? [min, max] 
    : currentPrice.split('-').map(Number)
  
  const [priceRange, setPriceRange] = useState<number[]>([minPrice, maxPrice])
  const [tempRange, setTempRange] = useState<number[]>([minPrice, maxPrice])

  // Update temp range when params change
  useEffect(() => {
    const currentPrice = params.price || 'all'
    const [min, max] = currentPrice === 'all' 
      ? [0, 2000] 
      : currentPrice.split('-').map(Number)
    setTempRange([min, max])
    setPriceRange([min, max])
  }, [params.price])

  const handleApply = () => {
    const newParams = { ...params }
    
    // Only set price if it's not the full range
    if (tempRange[0] === min && tempRange[1] === max) {
      delete newParams.price
    } else {
      newParams.price = `${tempRange[0]}-${tempRange[1]}`
    }
    
    // Remove 'all' and empty values
    Object.keys(newParams).forEach((key) => {
      if (newParams[key] === 'all' || newParams[key] === '') {
        delete newParams[key]
      }
    })
    
    router.push(`/search?${new URLSearchParams(newParams).toString()}`)
  }

  const handleReset = () => {
    setTempRange([min, max])
    const newParams = { ...params }
    delete newParams.price
    
    // Remove 'all' and empty values
    Object.keys(newParams).forEach((key) => {
      if (newParams[key] === 'all' || newParams[key] === '') {
        delete newParams[key]
      }
    })
    
    router.push(`/search?${new URLSearchParams(newParams).toString()}`)
  }

  const hasChanged = tempRange[0] !== priceRange[0] || tempRange[1] !== priceRange[1]
  const isDefault = tempRange[0] === min && tempRange[1] === max

  return (
    <div className='space-y-4'>
      <div className='font-semibold mb-3'>{t('Price Range')}</div>
      
      <div className='px-2'>
        <Slider
          value={tempRange}
          onValueChange={setTempRange}
          min={min}
          max={max}
          step={10}
          className='w-full'
        />
      </div>
      
      <div className='flex items-center justify-between text-sm text-muted-foreground px-2'>
        <span>${tempRange[0]}</span>
        <span>${tempRange[1]}</span>
      </div>
      
      {(hasChanged || !isDefault) && (
        <div className='flex gap-2 pt-2'>
          <Button 
            size='sm' 
            onClick={handleApply}
            disabled={!hasChanged}
            className='flex-1'
          >
            {t('Apply')}
          </Button>
          {!isDefault && (
            <Button 
              size='sm' 
              variant='outline' 
              onClick={handleReset}
              className='flex-1'
            >
              {t('Reset')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
