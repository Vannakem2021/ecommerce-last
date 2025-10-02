'use client'

import { Button } from '@/components/ui/button'
import useFavorites from '@/hooks/use-favorites'
import { useAuthSession } from '@/hooks/use-auth-session'
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai'
import { usePathname, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import React from 'react'

export default function FavoriteButton({
  productId,
  className,
  size = 'icon',
  onToggleStart,
  onToggleError,
  onToggled,
  useInternalToggle = true,
  type,
}: {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'icon'
  onToggleStart?: (args: { productId: string; nextActive: boolean }) => void
  onToggleError?: (args: { productId: string; error?: unknown }) => void
  onToggled?: (args: { productId: string; isFavorite: boolean; success: boolean; message: string }) => void
  useInternalToggle?: boolean
  type?: 'button' | 'submit' | 'reset'
}) {
  const { isFavorite, toggle } = useFavorites()
  const auth = useAuthSession()
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const active = isFavorite(productId)
  const [pending, setPending] = React.useState(false)

  return (
    <Button
      aria-label={active ? 'Remove from Favorites' : 'Add to Favorites'}
      aria-pressed={active}
      aria-busy={pending}
      variant='ghost'
      size={size === 'icon' ? 'icon' : size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      className={cn(
        'rounded-full',
        active
          ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
          : 'text-muted-foreground hover:text-green-600 dark:hover:text-green-400',
        className
      )}
      type={type}
      disabled={pending}
      onClick={async (e) => {
        if (!useInternalToggle) {
          // Let enclosing form submit but prevent parent Link navigation
          e.stopPropagation()
          return
        }
        e.preventDefault() // prevent Link navigation
        e.stopPropagation()
        if (!auth.isAuthenticated) {
          router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname || '/')}`)
          return
        }
        if (pending) return
        const nextActive = !active
        onToggleStart?.({ productId, nextActive })
        setPending(true)
        const res = await toggle(productId)
        setPending(false)
        onToggled?.({ productId, isFavorite: !!res.isFavorite, success: res.success, message: res.message })
        toast({
          variant: res.success ? 'default' : 'destructive',
          description: res.message,
        })
        if (!res.success) {
          onToggleError?.({ productId, error: res.message })
        }
      }}
    >
      {active ? (
        <AiFillHeart className='h-6 w-6' />
      ) : (
        <AiOutlineHeart className='h-6 w-6' />
      )}
    </Button>
  )
}
