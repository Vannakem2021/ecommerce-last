import { ShieldCheck, Truck, RefreshCw, Headphones, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustBadge {
  icon: 'secure' | 'shipping' | 'returns' | 'support' | 'warranty'
  label: string
}

interface TrustBadgesProps {
  badges?: TrustBadge[]
  className?: string
}

const iconMap = {
  secure: ShieldCheck,
  shipping: Truck,
  returns: RefreshCw,
  support: Headphones,
  warranty: Award,
}

const defaultBadges: TrustBadge[] = [
  { icon: 'secure', label: 'Secure Checkout' },
  { icon: 'warranty', label: 'Warranty' },
  { icon: 'returns', label: 'Easy Returns' },
  { icon: 'shipping', label: 'Fast Shipping' },
  { icon: 'support', label: '24/7 Support' },
]

export default function TrustBadges({
  badges = defaultBadges,
  className,
}: TrustBadgesProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border',
        className
      )}
    >
      {badges.map((badge, index) => {
        const Icon = iconMap[badge.icon]
        return (
          <div
            key={index}
            className='flex items-center gap-2 text-sm'
          >
            <Icon className='w-5 h-5 text-primary' />
            <span className='font-medium'>{badge.label}</span>
          </div>
        )
      })}
    </div>
  )
}
