import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label='Breadcrumb' 
      className={cn('flex items-center gap-1 md:gap-2 text-xs md:text-sm overflow-x-auto scrollbar-hide', className)}
    >
      <Link 
        href='/' 
        className='flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0'
      >
        <Home className='h-3 w-3 md:h-4 md:w-4' />
        <span className='sr-only'>Home</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <div key={index} className='flex items-center gap-1 md:gap-2 flex-shrink-0'>
            <ChevronRight className='h-3 w-3 md:h-4 md:w-4 text-muted-foreground' />
            
            {item.href && !isLast ? (
              <Link 
                href={item.href}
                className='text-muted-foreground hover:text-foreground transition-colors truncate max-w-[100px] md:max-w-[200px]'
                title={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={cn(
                  'font-medium truncate',
                  isLast ? 'text-foreground max-w-[150px] md:max-w-none' : 'text-muted-foreground max-w-[100px] md:max-w-[200px]'
                )}
                aria-current={isLast ? 'page' : undefined}
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
