'use client'

import { ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'
import useIsMounted from '@/hooks/use-is-mounted'
import useShowSidebar from '@/hooks/use-cart-sidebar'
import { cn } from '@/lib/utils'
import useUserCart from '@/hooks/use-user-cart'
import { useLocale, useTranslations } from 'next-intl'
import { getDirection } from '@/i18n-config'

export default function CartButton() {
  const isMounted = useIsMounted()
  const {
    cart: { items },
  } = useUserCart()
  const cartItemsCount = items.reduce((a, c) => a + c.quantity, 0)
  const showSidebar = useShowSidebar()
  const t = useTranslations()

  const locale = useLocale()
  return (
    <Link href='/cart' className='flex items-center gap-2 header-button relative'>
      <div className='relative'>
        <ShoppingCartIcon className='h-6 w-6' />

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

      <span className='hidden xl:inline text-sm'>
        <span className='text-xs text-muted-foreground block'>{t('Header.Cart')}</span>
        <span className='font-medium'>{isMounted ? cartItemsCount : 0} items</span>
      </span>
    </Link>
  )
}
