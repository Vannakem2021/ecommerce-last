import { EllipsisVertical } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import CartButton from './cart-button'
import UserButton from './user-button'
import ThemeSwitcher from './theme-switcher'
import LanguageSwitcher from './language-switcher'
import CurrencySwitcher from './currency-switcher'
import WishlistButton from './wishlist-button'
import { useTranslations } from 'next-intl'

const Menu = ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const t = useTranslations()
  return (
    <div className='flex items-center gap-2'>
      {/* Desktop Menu */}
      <nav className='hidden lg:flex items-center gap-4'>
        <CurrencySwitcher />
        <LanguageSwitcher />
        <ThemeSwitcher />
        <UserButton />
        {forAdmin ? null : (
          <>
            <WishlistButton />
            <CartButton />
          </>
        )}
      </nav>

      {/* Mobile Menu */}
      <nav className='lg:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle header-button'>
            <EllipsisVertical className='h-6 w-6' />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start'>
            <SheetHeader className='w-full'>
              <div className='flex items-center justify-between'>
                <SheetTitle>{t('Header.Site Menu')}</SheetTitle>
                <SheetDescription></SheetDescription>
              </div>
            </SheetHeader>
            <CurrencySwitcher />
            <LanguageSwitcher />
            <ThemeSwitcher />
            <UserButton />
            {forAdmin ? null : (
              <>
                <WishlistButton />
                <CartButton />
              </>
            )}
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}

export default Menu
