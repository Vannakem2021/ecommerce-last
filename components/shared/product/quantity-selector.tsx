'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantitySelectorProps {
  max: number
  defaultValue?: number
  onChange?: (quantity: number) => void
  translations: {
    quantity: string
    max: string
  }
  className?: string
}

export default function QuantitySelector({
  max,
  defaultValue = 1,
  onChange,
  translations,
  className,
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(defaultValue)

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1
      setQuantity(newQuantity)
      onChange?.(newQuantity)
    }
  }

  const handleIncrease = () => {
    if (quantity < max) {
      const newQuantity = quantity + 1
      setQuantity(newQuantity)
      onChange?.(newQuantity)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    const newQuantity = Math.min(Math.max(1, value), max)
    setQuantity(newQuantity)
    onChange?.(newQuantity)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium text-muted-foreground'>
          {translations.quantity}:
        </span>
        <div className='flex items-center border rounded-md'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className='h-9 w-9 p-0 hover:bg-muted'
          >
            <Minus className='h-4 w-4' />
          </Button>
          <Input
            type='number'
            min={1}
            max={max}
            value={quantity}
            onChange={handleInputChange}
            className='h-9 w-14 border-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          />
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleIncrease}
            disabled={quantity >= max}
            className='h-9 w-9 p-0 hover:bg-muted'
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        {max <= 10 && (
          <span className='text-xs text-muted-foreground'>
            {translations.max}: {max}
          </span>
        )}
      </div>
    </div>
  )
}
