'use client'

import { CgShoppingCart } from 'react-icons/cg'
import Link from 'next/link'
import useIsMounted from '@/hooks/use-is-mounted'
import useShowSidebar from '@/hooks/use-cart-sidebar'
import useUserCart from '@/hooks/use-user-cart'
import { useLocale } from 'next-intl'
import { getDirection } from '@/i18n-config'

export default function CartButton() {
  const isMounted = useIsMounted()
  const {
    cart: { items },
  } = useUserCart()
  const cartItemsCount = items.reduce((a, c) => a + c.quantity, 0)
  const showSidebar = useShowSidebar()
  const locale = useLocale()
  return (
    <Link href='/cart' className='flex items-center gap-2 header-button relative'>
      <div className='relative'>
        <CgShoppingCart className='h-6 w-6' />

        {isMounted && cartItemsCount > 0 && (
          <span className='absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center'>
            {cartItemsCount}
          </span>
        )}

        {showSidebar && (
          <div
            className={`absolute top-[20px] ${
              getDirection(locale) === 'rtl'
                ? 'left-[-16px] rotate-[-270deg]'
                : 'right-[-16px] rotate-[-90deg]'
            }  z-10   w-0 h-0 border-l-[7px] border-r-[7px] border-b-[8px] border-transparent border-b-background`}
          ></div>
        )}
      </div>
    </Link>
  )
}
