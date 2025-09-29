import { auth } from '@/auth'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, UserRound, User, ShoppingBag, Heart, Settings, Shield, Eye, LogOut } from 'lucide-react'
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
          <div className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors'>
            {/* Avatar Icon */}
            <div className='w-7 h-7 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm'>
              <UserRound className='h-5 w-5 text-white' />
            </div>

            {/* User Name */}
            <span className='text-sm font-medium text-foreground'>
              {session ? session.user.name : t('Header.sign in')}
            </span>

            {/* Smaller Arrow */}
            <ChevronDownIcon className='h-3 w-3 text-muted-foreground' />
          </div>
        </DropdownMenuTrigger>
        {session ? (
          <DropdownMenuContent className='w-80' align='end' forceMount>
            {/* User Info Header */}
            <DropdownMenuLabel className='flex items-center justify-between p-3'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0'>
                  <UserRound className='h-6 w-6 text-white' />
                </div>
                <div className='flex flex-col space-y-1 min-w-0'>
                  <p className='text-sm font-semibold leading-none text-foreground truncate'>
                    {session.user.name}
                  </p>
                  <p className='text-xs leading-none text-muted-foreground truncate'>
                    {session.user.email}
                  </p>
                </div>
              </div>
              {session.user.role && (
                <Badge variant={session.user.role === 'admin' ? 'destructive' : 'secondary'} className='text-xs'>
                  {session.user.role}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Account Actions */}
            <DropdownMenuGroup>
              <Link href='/account'>
                <DropdownMenuItem className='flex items-center gap-3 cursor-pointer p-3'>
                  <User className='h-4 w-4 text-muted-foreground' />
                  <div className='flex flex-col'>
                    <span className='font-medium text-sm'>{t('Header.Your account')}</span>
                    <span className='text-xs text-muted-foreground'>Manage your profile and preferences</span>
                  </div>
                </DropdownMenuItem>
              </Link>

              <Link href='/account/orders'>
                <DropdownMenuItem className='flex items-center gap-3 cursor-pointer p-3'>
                  <ShoppingBag className='h-4 w-4 text-muted-foreground' />
                  <div className='flex flex-col'>
                    <span className='font-medium text-sm'>{t('Header.Your orders')}</span>
                    <span className='text-xs text-muted-foreground'>View order history and status</span>
                  </div>
                </DropdownMenuItem>
              </Link>

              <Link href='/favorites'>
                <DropdownMenuItem className='flex items-center gap-3 cursor-pointer p-3'>
                  <Heart className='h-4 w-4 text-muted-foreground' />
                  <div className='flex flex-col'>
                    <span className='font-medium text-sm'>{t('Header.Your favorites', { fallback: 'Your favorites' })}</span>
                    <span className='text-xs text-muted-foreground'>Your saved items and wishlist</span>
                  </div>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            {/* Admin Section */}
            {(session.user.role === 'admin' || session.user.role === 'manager' || session.user.role === 'seller') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <Link href='/admin/overview'>
                    <DropdownMenuItem className='flex items-center gap-3 cursor-pointer p-3'>
                      <Shield className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                      <div className='flex flex-col'>
                        <span className='font-medium text-sm text-blue-600 dark:text-blue-400'>{t('Header.Admin')}</span>
                        <span className='text-xs text-muted-foreground'>Access admin dashboard</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>

                  <Link href='/' target='_blank'>
                    <DropdownMenuItem className='flex items-center gap-3 cursor-pointer p-3'>
                      <Eye className='h-4 w-4 text-muted-foreground' />
                      <div className='flex flex-col'>
                        <span className='font-medium text-sm'>View Store</span>
                        <span className='text-xs text-muted-foreground'>See customer perspective</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem className='p-0'>
              <UserSignOutButton className='w-full flex items-center gap-3 p-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-none justify-start h-auto'>
                <LogOut className='h-4 w-4' />
                <div className='flex flex-col items-start'>
                  <span className='font-medium text-sm'>{t('Header.Sign out')}</span>
                  <span className='text-xs text-muted-foreground'>Sign out of your account</span>
                </div>
              </UserSignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent className='w-64' align='end' forceMount>
            <DropdownMenuLabel className='p-3'>
              <div className='text-center'>
                <div className='w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2'>
                  <UserRound className='h-6 w-6 text-muted-foreground' />
                </div>
                <p className='text-sm font-medium text-foreground'>Welcome!</p>
                <p className='text-xs text-muted-foreground'>Sign in to access your account</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className='p-2'>
              <Link href='/sign-in'>
                <DropdownMenuItem className='flex items-center justify-center p-3'>
                  <Button className='w-full'>
                    {t('Header.Sign in')}
                  </Button>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <div className='p-3 text-center border-t'>
              <p className='text-xs text-muted-foreground'>
                {t('Header.New Customer')}?{' '}
                <Link href='/sign-up' className='text-primary hover:underline'>
                  {t('Header.Sign up')}
                </Link>
              </p>
            </div>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  )
}
