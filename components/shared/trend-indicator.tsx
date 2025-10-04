import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendIndicatorProps {
  value: number
  className?: string
  showValue?: boolean
  inverse?: boolean // For metrics where decrease is good (e.g., costs)
}

export function TrendIndicator({ 
  value, 
  className,
  showValue = true,
  inverse = false
}: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  // Determine if trend is good or bad
  const isGood = inverse ? isNegative : isPositive
  const isBad = inverse ? isPositive : isNegative

  const Icon = isPositive 
    ? TrendingUp 
    : isNegative 
    ? TrendingDown 
    : Minus

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium",
      isGood && "text-green-600 dark:text-green-500",
      isBad && "text-red-600 dark:text-red-500",
      isNeutral && "text-muted-foreground",
      className
    )}>
      <Icon className="h-3 w-3" />
      {showValue && (
        <span>
          {isPositive && '+'}
          {value.toFixed(1)}%
        </span>
      )}
    </div>
  )
}
