'use client'

import ProductPrice from '@/components/shared/product/product-price'
import { getMonthName } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

type TableChartProps = {
  labelType: 'month' | 'product'
  data: {
    label: string
    image?: string
    value: number
    id?: string
    rank?: number
  }[]
}

import React from 'react'

interface ProgressBarProps {
  value: number // Accepts a number between 0 and 100
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  // Ensure value stays within 0-100 range
  const boundedValue = Math.min(100, Math.max(0, value))

  return (
    <div className='relative w-full h-4 overflow-hidden'>
      <div
        className='bg-primary h-full transition-all duration-300 rounded-lg'
        style={{
          width: `${boundedValue}%`,
          float: 'right', // Aligns the bar to start from the right
        }}
      />
    </div>
  )
}

export default function TableChart({
  labelType = 'month',
  data = [],
}: TableChartProps) {
  const max = Math.max(...data.map((item) => item.value))
  
  // Calculate growth trends for months
  const dataWithPercentage = data.map((x, index) => {
    const percentage = Math.round((x.value / max) * 100)
    let trend = 0
    if (labelType === 'month' && index > 0) {
      const previousValue = data[index - 1].value
      if (previousValue > 0) {
        trend = ((x.value - previousValue) / previousValue) * 100
      }
    }
    return {
      ...x,
      label: labelType === 'month' ? getMonthName(x.label) : x.label,
      percentage,
      trend,
    }
  })
  
  return (
    <div className='space-y-3'>
      {dataWithPercentage.map(({ label, id, value, image, percentage, trend }, index) => (
        <div
          key={label}
          className='grid grid-cols-[auto_1fr_auto] gap-3 items-center'
        >
          {/* Left: Rank/Image/Name */}
          <div className='flex items-center gap-2 min-w-0'>
            {labelType === 'product' && (
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
            )}
            
            {image ? (
              <Link className='flex items-center gap-2 min-w-0 flex-1' href={`/admin/products/${id}`}>
                <Image
                  className='rounded border aspect-square object-scale-down flex-shrink-0'
                  src={image!}
                  alt={label}
                  width={40}
                  height={40}
                />
                <div className='min-w-0 flex-1'>
                  <p className='text-xs md:text-sm font-medium truncate hover:text-primary transition-colors'>
                    {label}
                  </p>
                </div>
              </Link>
            ) : (
              <div className='text-xs md:text-sm font-medium'>{label}</div>
            )}
          </div>

          {/* Center: Progress Bar */}
          <div className='flex-1 min-w-[80px] max-w-[200px]'>
            <ProgressBar value={percentage} />
          </div>

          {/* Right: Value & Trend */}
          <div className='flex items-center justify-end gap-2 flex-shrink-0'>
            <ProductPrice price={value} plain className='text-xs md:text-sm font-semibold' />
            {labelType === 'month' && trend !== 0 && (
              <span className={`text-[10px] md:text-xs font-medium ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
