import * as React from 'react'
import Link from 'next/link'
import { X, ChevronRight, MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { auth } from '@/auth'
import { getLocale, getTranslations } from 'next-intl/server'
import { getDirection } from '@/i18n-config'

export default async function Sidebar({
  categories,
  menuItems = [],
}: {
  categories: string[]
  menuItems?: { name: string; href: string; section?: string }[]
}) {
  const session = await auth()

  const locale = await getLocale()

  const t = await getTranslations()
  return (
    <Drawer direction={getDirection(locale) === 'rtl' ? 'right' : 'left'}>
      <DrawerTrigger className='flex items-center gap-2 text-white hover:text-white/80 transition-colors bg-black/20 hover:bg-black/30 px-4 py-2 rounded'>
        <MenuIcon className='h-6 w-6' />
      </DrawerTrigger>
      <DrawerContent className='w-[300px] mt-0 top-0 rounded-none'>
        <div className='flex flex-col h-full'>
          {/* Close Button */}
          <div className='flex items-center justify-end p-3 border-b'>
            <DrawerClose asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <X className='h-5 w-5' />
                <span className='sr-only'>Close</span>
              </Button>
            </DrawerClose>
            <DrawerHeader className='hidden'>
              <DrawerTitle></DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
          </div>

          {/* Navigation Menu */}
          <div className='flex-1 overflow-y-auto'>
            <nav>
              {/* Shop Section */}
              <>
                <div className='px-5 py-2 bg-muted/30'>
                  <span className='text-xs font-bold text-primary uppercase tracking-wider'>
                    Shop
                  </span>
                </div>
                {/* Hot Deals Link */}
                <DrawerClose asChild>
                  <Link
                    href='/search?discount=true'
                    className='flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors'
                  >
                    <span className='font-medium text-sm'>{t('Home.Hot Deals')}</span>
                    <ChevronRight className='h-4 w-4 text-muted-foreground' />
                  </Link>
                </DrawerClose>
                {menuItems
                  .filter(item => 
                    ['New Arrivals', 'Featured Products', 'Best Sellers'].includes(item.name) ||
                    item.section === 'shop'
                  )
                  .map((item) => (
                    <DrawerClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className='flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors'
                      >
                        <span className='font-medium text-sm'>{item.name}</span>
                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                      </Link>
                    </DrawerClose>
                  ))}
                {/* Second Hand Link */}
                <DrawerClose asChild>
                  <Link
                    href='/search?secondHand=true'
                    className='flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors'
                  >
                    <span className='font-medium text-sm'>{t('Home.Second Hand')}</span>
                    <ChevronRight className='h-4 w-4 text-muted-foreground' />
                  </Link>
                </DrawerClose>
              </>

              {/* Categories Section */}
              {categories.length > 0 && (
                <>
                  <div className='px-5 py-2 bg-muted/30 border-t'>
                    <span className='text-xs font-bold text-primary uppercase tracking-wider'>
                      Categories
                    </span>
                  </div>
                  {categories.map((category) => (
                    <DrawerClose asChild key={category}>
                      <Link
                        href={`/search?category=${category}`}
                        className='flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors'
                      >
                        <span className='font-medium text-sm'>{category}</span>
                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                      </Link>
                    </DrawerClose>
                  ))}
                </>
              )}

              {/* Customer Service Section */}
              {menuItems.filter(item => 
                ['About Us', 'Help', 'Contact Us'].includes(item.name) ||
                item.section === 'customer-service'
              ).length > 0 && (
                <>
                  <div className='px-5 py-2 bg-muted/30 border-t'>
                    <span className='text-xs font-bold text-primary uppercase tracking-wider'>
                      Customer Service
                    </span>
                  </div>
                  {menuItems
                    .filter(item => 
                      ['About Us', 'Help', 'Contact Us'].includes(item.name) ||
                      item.section === 'customer-service'
                    )
                    .map((item) => (
                      <DrawerClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className='flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors'
                        >
                          <span className='font-medium text-sm'>{item.name}</span>
                          <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        </Link>
                      </DrawerClose>
                    ))}
                </>
              )}



              {/* Other Menu Items (fallback for items not in groups) */}
              {menuItems.filter(item => 
                ![
                  'Today\'s Deal', 'New Arrivals', 'Featured Products', 'Best Sellers',
                  'About Us', 'Help', 'Contact Us',
                  'Conditions of Use', 'Privacy Policy'
                ].includes(item.name) &&
                !['shop', 'customer-service', 'legal'].includes(item.section || '')
              ).length > 0 && (
                <>
                  <div className='px-5 py-2 bg-muted/30 border-t'>
                    <span className='text-xs font-bold text-primary uppercase tracking-wider'>
                      More
                    </span>
                  </div>
                  {menuItems
                    .filter(item => 
                      ![
                        'Today\'s Deal', 'New Arrivals', 'Featured Products', 'Best Sellers',
                        'About Us', 'Help', 'Contact Us',
                        'Conditions of Use', 'Privacy Policy'
                      ].includes(item.name) &&
                      !['shop', 'customer-service', 'legal'].includes(item.section || '')
                    )
                    .map((item) => (
                      <DrawerClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className='flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors'
                        >
                          <span className='font-medium text-sm'>{item.name}</span>
                          <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        </Link>
                      </DrawerClose>
                    ))}
                </>
              )}
            </nav>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
