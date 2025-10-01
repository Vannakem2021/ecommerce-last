import * as React from 'react'
import Link from 'next/link'
import { X, ChevronRight, MenuIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SignOut } from '@/lib/actions/user.actions'
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
  menuItems?: { name: string; href: string }[]
}) {
  const session = await auth()

  const locale = await getLocale()

  const t = await getTranslations()
  return (
    <Drawer direction={getDirection(locale) === 'rtl' ? 'right' : 'left'}>
      <DrawerTrigger className='flex items-center gap-2 text-white hover:text-white/80 transition-colors bg-black/20 hover:bg-black/30 px-4 py-2 rounded'>
        <MenuIcon className='h-6 w-6' />
        <span className='font-medium text-base'>{t('Header.All')} Categories</span>
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

          {/* Search Box */}
          <div className='p-4 border-b'>
            <div className='relative'>
              <Input
                placeholder='Search Keywords'
                className='h-10 pr-10 border-2 border-primary rounded-none focus-visible:ring-0 focus-visible:ring-offset-0'
              />
              <Search className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            </div>
          </div>

          {/* Navigation Menu */}
          <div className='flex-1 overflow-y-auto'>
            <nav>
              {menuItems.map((item) => (
                <DrawerClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className='flex items-center justify-between px-5 py-3.5 border-b hover:bg-muted/50 transition-colors'
                  >
                    <span className='font-medium text-sm uppercase'>{item.name}</span>
                    <ChevronRight className='h-4 w-4 text-muted-foreground' />
                  </Link>
                </DrawerClose>
              ))}

              {categories.map((category) => (
                <DrawerClose asChild key={category}>
                  <Link
                    href={`/search?category=${category}`}
                    className='flex items-center justify-between px-5 py-3.5 border-b hover:bg-muted/50 transition-colors'
                  >
                    <span className='font-medium text-sm uppercase'>{category}</span>
                    <ChevronRight className='h-4 w-4 text-muted-foreground' />
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </div>

          {/* Bottom Links */}
          <div className='border-t'>
            <DrawerClose asChild>
              <Link
                href='/page/contact-us'
                className='flex items-center justify-between px-5 py-3.5 border-b hover:bg-muted/50 transition-colors'
              >
                <span className='font-medium text-sm uppercase'>CONTACT</span>
              </Link>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
