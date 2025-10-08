'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, MapPin, Settings, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: string
}

interface AccountSidebarNavProps {
  items: NavItem[]
}

const iconMap = {
  Package,
  Heart,
  MapPin,
  Settings,
}

export default function AccountSidebarNav({ items }: AccountSidebarNavProps) {
  const pathname = usePathname()

  return (
    <>
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = iconMap[item.icon as keyof typeof iconMap]
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {Icon && <Icon className='w-4 h-4 flex-shrink-0' />}
            <span>{item.title}</span>
          </Link>
        )
      })}
    </>
  )
}
