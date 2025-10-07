'use client'

import React from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AccountSidebarNav from './account-sidebar-nav'
import UserAvatar from '../header/user-avatar'
import useSignOut from '@/hooks/use-sign-out'

interface NavItem {
  title: string
  href: string
  icon: string
}

interface AccountSidebarContentProps {
  session: {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      createdAt?: Date | string
    }
  }
  navItems: NavItem[]
}

export function AccountSidebarContent({ session, navItems }: AccountSidebarContentProps) {
  const { signOut, isSigningOut } = useSignOut()

  return (
    <div className='space-y-4 pb-6'>
      {/* Profile Section */}
      <div className='flex items-center gap-3 mb-6'>
        <UserAvatar
          user={{
            name: session.user.name,
            image: session.user.image,
          }}
          size="md"
          className='flex-shrink-0 border border-border'
        />
        <div className='flex-1 min-w-0'>
          <h2 className='font-semibold text-sm truncate'>{session.user.name}</h2>
          <p className='text-xs text-muted-foreground truncate'>
            Member since {new Date(session.user.createdAt || Date.now()).getFullYear()}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className='space-y-1'>
        <AccountSidebarNav items={navItems} />
      </nav>

      {/* Bottom Actions */}
      <div className='pt-4 border-t'>
        {/* Sign Out Button */}
        <Button
          variant='ghost'
          className='w-full justify-start text-muted-foreground hover:text-foreground'
          onClick={() => signOut()}
          disabled={isSigningOut}
        >
          <LogOut className='w-4 h-4 mr-3' />
          <span className='text-sm'>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </Button>
      </div>
    </div>
  )
}
