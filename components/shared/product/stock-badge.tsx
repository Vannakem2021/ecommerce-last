'use client'

import { Badge } from '@/components/ui/badge'
import { Package, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StockBadgeProps {
  countInStock: number
  lowStockThreshold?: number
  translations: {
    inStock: string
    lowStock: string
    outOfStock: string
  }
  className?: string
}

export default function StockBadge({
  countInStock,
  lowStockThreshold = 3,
  translations,
  className,
}: StockBadgeProps) {
  // Determine stock status
  const isOutOfStock = countInStock === 0
  const isLowStock = countInStock > 0 && countInStock <= lowStockThreshold
  const isInStock = countInStock > lowStockThreshold

  // Get status details
  const getStatusConfig = () => {
    if (isOutOfStock) {
      return {
        label: translations.outOfStock,
        variant: 'destructive' as const,
        icon: AlertCircle,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400',
      }
    }
    if (isLowStock) {
      return {
        label: `${translations.lowStock} (${countInStock} ${countInStock === 1 ? 'item' : 'items'} left)`,
        variant: 'outline' as const,
        icon: Package,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/20 dark:text-yellow-400',
      }
    }
    return {
      label: translations.inStock,
      variant: 'outline' as const,
      icon: CheckCircle,
      className: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20 dark:text-green-400',
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 w-fit px-3 py-1.5 text-sm font-medium',
        config.className,
        className
      )}
    >
      <Icon className='w-4 h-4' />
      <span>{config.label}</span>
    </Badge>
  )
}
