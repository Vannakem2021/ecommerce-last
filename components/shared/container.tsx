import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'default' | 'wide' | 'full'
  padding?: 'default' | 'none' | 'sm' | 'lg'
}

export default function Container({
  children,
  className,
  size = 'default',
  padding = 'default',
}: ContainerProps) {
  const sizeClasses = {
    default: 'max-w-[1600px]',
    wide: 'max-w-[1800px]',
    full: 'max-w-full',
  }

  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4',
    default: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  }

  return (
    <div
      className={cn(
        'w-full mx-auto',
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}