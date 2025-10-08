'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AccountSidebarContent } from './account-sidebar-content'

interface NavItem {
  title: string
  href: string
  icon: string
}

interface MobileAccountHeaderProps {
  session: {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      createdAt?: Date | string
      hasPassword?: boolean
    }
  }
  navItems: NavItem[]
}

export function MobileAccountHeader({ session, navItems }: MobileAccountHeaderProps) {
  return (
    <div className='lg:hidden mb-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold'>Account</h1>
          <p className='text-sm text-muted-foreground'>{session.user.name}</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' size='icon'>
              <Menu className='h-5 w-5' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-[280px] sm:w-[320px]'>
            <SheetTitle className='sr-only'>Account Navigation</SheetTitle>
            <AccountSidebarContent session={session} navItems={navItems} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
