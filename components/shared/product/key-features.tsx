import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeyFeaturesProps {
  features: string[]
  title?: string
  className?: string
}

export default function KeyFeatures({
  features,
  title = "Key Features",
  className,
}: KeyFeaturesProps) {
  if (!features || features.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          🎯 {title}
        </h3>
      )}
      <ul className='space-y-2'>
        {features.map((feature, index) => (
          <li
            key={index}
            className='flex items-start gap-3 text-sm text-muted-foreground'
          >
            <Check className='w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5' />
            <span className='flex-1'>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
