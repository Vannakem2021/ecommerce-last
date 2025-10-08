import { auth } from '@/auth'
import { getUserById } from '@/lib/actions/user.actions'

import { Button } from '@/components/ui/button'
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
import { ChevronDownIcon, UserRound, User, Shield, Eye, LogOut } from 'lucide-react'
import { FiShoppingCart } from 'react-icons/fi'
import { LuFolderHeart } from 'react-icons/lu'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import UserSignOutButton from './user-sign-out-button'
import UserAvatar from './user-avatar'

export default async function UserButton() {
  const t = await getTranslations()
  const session = await auth()

  // Fetch fresh user data from database (same pattern as Settings page)
  let userData = null
  let hasPassword = false
  if (session?.user?.id) {
    try {
      userData = await getUserById(session.user.id)
      // Check if user has password to determine auth method (OAuth vs Credentials)
      hasPassword = !!userData?.password
    } catch (error) {
      console.error('[UserButton] getUserById error:', error)
    }
  }

  // Use database image if available (same as Settings page)
  const userImage = userData?.image || session?.user?.image

  // Check if user is staff (admin, manager, seller) or customer
  const isStaff = session && (session.user.role === 'admin' || session.user.role === 'manager' || session.user.role === 'seller')
  const isCustomer = session && session.user.role === 'user'

  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger className='header-button' asChild>
          <Button variant='ghost' className='relative h-12 w-12 p-0 rounded-full hover:bg-accent/50 transition-colors'>
            {session ? (
              <UserAvatar
                user={{
                  name: session.user.name,
                  image: userImage, // Use database image
                }}
                size="md"
                className='border border-border hover:border-primary transition-colors'
                hasPassword={hasPassword}
              />
            ) : (
              <UserRound className='h-6 w-6 text-muted-foreground' />
            )}
          </Button>
        </DropdownMenuTrigger>
        {session ? (
          <DropdownMenuContent className='w-72' align='end' forceMount>
            {/* User Profile Header */}
            <DropdownMenuLabel className='p-4'>
              <div className='flex items-center gap-3'>
                <UserAvatar
                  user={{
                    name: session.user.name,
                    image: userImage, // Use database image
                  }}
                  size="md"
                  className='border border-border flex-shrink-0'
                  hasPassword={hasPassword}
                />
                <div className='flex flex-col min-w-0'>
                  <p className='text-base font-semibold text-foreground truncate'>
                    {session.user.name}
                  </p>
                  {/* Show role only for staff (admin, manager, seller) */}
                  {isStaff && session.user.role && (
                    <p className='text-sm text-muted-foreground capitalize truncate'>
                      {session.user.role}
                    </p>
                  )}
                  <p className='text-xs text-muted-foreground truncate'>
                    {session.user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Account Actions */}
            <DropdownMenuGroup className='p-1'>
              <Link href='/account/manage'>
                <DropdownMenuItem className='flex items-center gap-3 cursor-pointer px-3 py-2.5'>
                  <User className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>My Profile</span>
                </DropdownMenuItem>
              </Link>

              {/* Show My Orders and My Favorites only for customers */}
              {isCustomer && (
                <>
                  <Link href='/account/orders'>
                    <DropdownMenuItem className='flex items-center gap-3 cursor-pointer px-3 py-2.5'>
                      <FiShoppingCart className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>My Orders</span>
                    </DropdownMenuItem>
                  </Link>

                  <Link href='/account/favorites'>
                    <DropdownMenuItem className='flex items-center gap-3 cursor-pointer px-3 py-2.5'>
                      <LuFolderHeart className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>My Favorites</span>
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
            </DropdownMenuGroup>

            {/* Admin Section */}
            {(session.user.role === 'admin' || session.user.role === 'manager' || session.user.role === 'seller') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className='p-1'>
                  <Link href='/admin/overview'>
                    <DropdownMenuItem className='flex items-center gap-3 cursor-pointer px-3 py-2.5'>
                      <Shield className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                      <span className='text-sm text-blue-600 dark:text-blue-400'>{t('Header.Admin')}</span>
                    </DropdownMenuItem>
                  </Link>

                  <Link href='/' target='_blank'>
                    <DropdownMenuItem className='flex items-center gap-3 cursor-pointer px-3 py-2.5'>
                      <Eye className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>View Store</span>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuGroup className='p-1'>
              <DropdownMenuItem className='p-0'>
                <UserSignOutButton className='w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-sm justify-start h-auto'>
                  <LogOut className='h-4 w-4' />
                  <span className='text-sm'>{t('Header.Sign out')}</span>
                </UserSignOutButton>
              </DropdownMenuItem>
            </DropdownMenuGroup>
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
