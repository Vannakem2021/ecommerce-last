'use client'

import { Button } from '@/components/ui/button'
import useFavorites from '@/hooks/use-favorites'
import { useAuthSession } from '@/hooks/use-auth-session'
import { Heart } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function FavoriteButton({
  productId,
  className,
  size = 'icon',
}: {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'icon'
}) {
  const { isFavorite, toggle } = useFavorites()
  const auth = useAuthSession()
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const active = isFavorite(productId)

  return (
    <Button
      aria-label={active ? 'Remove from Favorites' : 'Add to Favorites'}
      aria-pressed={active}
      variant='ghost'
      size={size === 'icon' ? 'icon' : size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      className={cn(
        'rounded-full',
        active ? 'text-primary' : 'text-muted-foreground',
        'hover:text-primary',
        className
      )}
      onClick={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!auth.isAuthenticated) {
          router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname || '/')}`)
          return
        }
        const res = await toggle(productId)
        toast({
          variant: res.success ? 'default' : 'destructive',
          description: res.message,
        })
      }}
    >
      <Heart
        className='h-5 w-5'
        fill={active ? 'currentColor' : 'none'}
        strokeWidth={active ? 0 : 2}
      />
    </Button>
  )
}
