import * as React from 'react'
import Link from 'next/link'
import { X, ChevronRight, UserCircle, MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <DrawerTrigger className='header-button flex items-center !p-2  '>
        <MenuIcon className='h-5 w-5 mr-1' />
        {t('Header.All')}
      </DrawerTrigger>
      <DrawerContent className='w-[350px] mt-0 top-0'>
        <div className='flex flex-col h-full'>
          {/* User Header Section */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
            <DrawerHeader className='p-0 flex-1'>
              <DrawerTitle className='flex items-center'>
                <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3 shadow-lg'>
                  <UserCircle className='h-6 w-6 text-white' />
                </div>
                {session ? (
                  <DrawerClose asChild>
                    <Link href='/account' className='hover:text-green-600 transition-colors'>
                      <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                        {t('Header.Hello')}, {session.user.name}
                      </div>
                    </Link>
                  </DrawerClose>
                ) : (
                  <DrawerClose asChild>
                    <Link href='/sign-in' className='hover:text-green-600 transition-colors'>
                      <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                        {t('Header.Welcome')}! {t('Header.sign in')}
                      </div>
                    </Link>
                  </DrawerClose>
                )}
              </DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <DrawerClose asChild>
              <Button variant='ghost' size='icon' className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full'>
                <X className='h-5 w-5' />
                <span className='sr-only'>Close</span>
              </Button>
            </DrawerClose>
          </div>

          {/* Navigation Menu */}
          <div className='border-b border-gray-200 dark:border-gray-700'>
            <div className='px-6 py-4'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center'>
                <svg className='w-5 h-5 mr-2 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z'></path>
                </svg>
Navigation
              </h2>
            </div>
            <nav className='pb-4'>
              {menuItems.map((item) => (
                <DrawerClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className='flex items-center justify-between px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 group'
                  >
                    <span className='font-medium'>{item.name}</span>
                    <ChevronRight className='h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors' />
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </div>

          {/* Shop By Category */}
          <div className='flex-1 overflow-y-auto border-b border-gray-200 dark:border-gray-700'>
            <div className='px-6 py-4'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center'>
                <svg className='w-5 h-5 mr-2 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5zM10 18a1 1 0 100-2 1 1 0 000 2z' clipRule='evenodd'></path>
                </svg>
                {t('Header.Shop By Department')}
              </h2>
            </div>
            <nav className='pb-4'>
              {categories.map((category) => (
                <DrawerClose asChild key={category}>
                  <Link
                    href={`/search?category=${category}`}
                    className='flex items-center justify-between px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 group'
                  >
                    <div className='flex items-center'>
                      <div className='w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mr-3 group-hover:bg-green-500 transition-colors'></div>
                      <span className='font-medium'>{category}</span>
                    </div>
                    <ChevronRight className='h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors' />
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </div>

          {/* Help & Settings */}
          <div className='mt-auto'>
            <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4'>
                <svg className='w-5 h-5 mr-2 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z' clipRule='evenodd'></path>
                </svg>
                {t('Header.Help & Settings')}
              </h2>

              <div className='space-y-1'>
                <DrawerClose asChild>
                  <Link
                    href='/account'
                    className='flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors duration-200 group'
                  >
                    <svg className='w-4 h-4 mr-3 text-gray-400 group-hover:text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' clipRule='evenodd'></path>
                    </svg>
                    <span className='font-medium'>{t('Header.Your account')}</span>
                  </Link>
                </DrawerClose>

                <DrawerClose asChild>
                  <Link
                    href='/page/customer-service'
                    className='flex items-center px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors duration-200 group'
                  >
                    <svg className='w-4 h-4 mr-3 text-gray-400 group-hover:text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z'></path>
                    </svg>
                    <span className='font-medium'>{t('Header.Customer Service')}</span>
                  </Link>
                </DrawerClose>

                {session ? (
                  <form action={SignOut} className='w-full'>
                    <Button
                      className='w-full justify-start px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 text-base font-medium'
                      variant='ghost'
                    >
                      <svg className='w-4 h-4 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z' clipRule='evenodd'></path>
                      </svg>
                      {t('Header.Sign out')}
                    </Button>
                  </form>
                ) : (
                  <DrawerClose asChild>
                    <Link
                      href='/sign-in'
                      className='flex items-center px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200 font-medium'
                    >
                      <svg className='w-4 h-4 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z' clipRule='evenodd'></path>
                      </svg>
                      {t('Header.Sign in')}
                    </Link>
                  </DrawerClose>
                )}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
