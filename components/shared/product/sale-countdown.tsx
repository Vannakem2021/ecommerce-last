'use client'

import { useEffect, useState, useRef } from 'react'
import { formatSaleTimeRemaining } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SaleCountdownProps {
  endDate: Date
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function SaleCountdown({
  endDate,
  size = 'md',
  className
}: SaleCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const timeLeft = endDate.getTime() - now.getTime()

      if (timeLeft <= 0) {
        setIsExpired(true)
        setTimeRemaining('Sale ended')
        return
      }

      setTimeRemaining(formatSaleTimeRemaining(endDate))

      // Determine urgency for styling and update interval
      const hoursLeft = timeLeft / (1000 * 60 * 60)
      let nextUpdate: number

      if (hoursLeft < 1) {
        // Update every second for last hour
        nextUpdate = 1000
      } else if (hoursLeft < 24) {
        // Update every minute for last 24 hours
        nextUpdate = 60000
      } else {
        // Update every hour for longer periods
        nextUpdate = 3600000
      }

      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Schedule next update
      timeoutRef.current = setTimeout(updateCountdown, nextUpdate)
    }

    updateCountdown()

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [endDate])

  if (isExpired) {
    return null
  }

  const now = new Date()
  const timeLeft = endDate.getTime() - now.getTime()
  const hoursLeft = timeLeft / (1000 * 60 * 60)
  
  // Determine urgency styling
  const urgencyClass = hoursLeft < 1 
    ? 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800'
    : hoursLeft < 24 
    ? 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800'
    : 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800'

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        urgencyClass,
        sizeClasses[size],
        className
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Sale ends in ${timeRemaining}`}
    >
      <svg 
        className="w-3 h-3 mr-1.5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      {timeRemaining}
    </div>
  )
}
