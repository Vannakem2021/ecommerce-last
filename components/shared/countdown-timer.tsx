'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  endTime: Date
  onExpire?: () => void
  className?: string
}

export function CountdownTimer({ endTime, onExpire, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true })
        if (onExpire) onExpire()
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds, expired: false })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [endTime, onExpire])

  if (timeLeft.expired) {
    return <span className={className}>Expired</span>
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0')

  return (
    <span className={className}>
      {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
    </span>
  )
}
