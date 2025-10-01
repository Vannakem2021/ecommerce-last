import Link from 'next/link'
import { Heart } from 'lucide-react'

export default async function WishlistButton() {
  // TODO: Get actual wishlist count from user session/database
  const wishlistCount = 0

  return (
    <Link
      href='/favorites'
      className='flex items-center gap-2 header-button relative'
    >
      <div className='relative'>
        <Heart className='h-6 w-6' />
        {wishlistCount > 0 && (
          <span className='absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center'>
            {wishlistCount}
          </span>
        )}
      </div>
      <span className='hidden xl:inline text-sm'>
        <span className='text-xs text-muted-foreground block'>Wishlist</span>
        <span className='font-medium'>{wishlistCount} items</span>
      </span>
    </Link>
  )
}
