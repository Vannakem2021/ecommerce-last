import { auth } from '@/auth'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, UserRound  } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import UserSignOutButton from './user-sign-out-button'

export default async function UserButton() {
  const t = await getTranslations()
  const session = await auth()
  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger className='header-button' asChild>
          <div className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
            {/* Avatar Icon */}
            <div className='w-7 h-7 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm'>
              <UserRound className='h-5 w-5 text-white' />
            </div>

            {/* User Name */}
            <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
              {session ? session.user.name : t('Header.sign in')}
            </span>

            {/* Smaller Arrow */}
            <ChevronDownIcon className='h-3 w-3 text-gray-500 dark:text-gray-400' />
          </div>
        </DropdownMenuTrigger>
        {session ? (
          <DropdownMenuContent className='w-64' align='end' forceMount>
            <DropdownMenuLabel className='font-normal p-3'>
              <div className='flex items-center gap-3'>
                {/* Avatar in dropdown */}
                <div className='w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0'>
                  <UserRound className='h-6 w-6 text-white' />
                </div>
                <div className='flex flex-col space-y-1 min-w-0'>
                  <p className='text-sm font-semibold leading-none text-gray-900 dark:text-gray-100 truncate'>
                    {session.user.name}
                  </p>
                  <p className='text-xs leading-none text-muted-foreground truncate'>
                    {session.user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <Link className='w-full' href='/account'>
                <DropdownMenuItem>{t('Header.Your account')}</DropdownMenuItem>
              </Link>
              <Link className='w-full' href='/account/orders'>
                <DropdownMenuItem>{t('Header.Your orders')}</DropdownMenuItem>
              </Link>
              <Link className='w-full' href='/favorites'>
                <DropdownMenuItem>{t('Header.Your favorites', { fallback: 'Your favorites' })}</DropdownMenuItem>
              </Link>

              {session.user.role === 'Admin' && (
                <Link className='w-full' href='/admin/overview'>
                  <DropdownMenuItem>{t('Header.Admin')}</DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>
            <DropdownMenuItem className='p-0 mb-1'>
              <UserSignOutButton className='w-full py-4 px-2 h-4 justify-start'>
                {t('Header.Sign out')}
              </UserSignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent className='w-56' align='end' forceMount>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  className={cn(buttonVariants(), 'w-full')}
                  href='/sign-in'
                >
                  {t('Header.Sign in')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className='font-normal'>
                {t('Header.New Customer')}?{' '}
                <Link href='/sign-up'>{t('Header.Sign up')}</Link>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  )
}
