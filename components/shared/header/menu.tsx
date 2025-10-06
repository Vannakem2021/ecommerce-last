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
          <SheetContent className='w-[280px]'>
            <SheetHeader>
              <SheetTitle className='text-left'>{t('Header.Site Menu')}</SheetTitle>
              <SheetDescription></SheetDescription>
            </SheetHeader>
            
            <div className='mt-6 space-y-1'>
              {/* Settings Section */}
              <div className='space-y-1'>
                <div className='px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Preferences
                </div>
                <div className='w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 rounded-md transition-colors'>
                  <span className='text-sm'>Currency</span>
                  <CurrencySwitcher />
                </div>
                <div className='w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 rounded-md transition-colors'>
                  <span className='text-sm'>Language</span>
                  <LanguageSwitcher />
                </div>
                <div className='w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 rounded-md transition-colors'>
                  <span className='text-sm'>Theme</span>
                  <ThemeSwitcher />
                </div>
              </div>

              {/* Account Section */}
              <div className='pt-4 space-y-1'>
                <div className='px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Account
                </div>
                <div className='px-3 flex items-center gap-2'>
                  <UserButton />
                  {!forAdmin && <CartButton />}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}

export default Menu
