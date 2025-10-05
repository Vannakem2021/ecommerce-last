import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AccountSidebarNav from '@/components/shared/account/account-sidebar-nav'
import ProfilePictureModal from '@/components/shared/account/profile-picture-modal'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  const navItems = [
    {
      title: 'Overview',
      href: '/account',
      icon: 'Home',
    },
    {
      title: 'My Orders',
      href: '/account/orders',
      icon: 'Package',
    },
    {
      title: 'Addresses',
      href: '/account/addresses',
      icon: 'MapPin',
    },
    {
      title: 'Settings',
      href: '/account/manage',
      icon: 'Settings',
    },
  ]

  return (
    <div className='flex-1'>
      <div className='container mx-auto px-4 py-6'>
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Sidebar */}
          <aside className='lg:w-64 flex-shrink-0'>
            <div className='space-y-4'>
              {/* Profile Section */}
              <div className='flex items-center gap-3 mb-6'>
                <ProfilePictureModal
                  currentImage={session.user.image || undefined}
                  userName={session.user.name || 'User'}
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

              {/* Help Link */}
              <div className='pt-4 border-t'>
                <Button
                  variant='ghost'
                  className='w-full justify-start text-muted-foreground hover:text-foreground'
                  asChild
                >
                  <Link href='/help'>
                    <LogOut className='w-4 h-4 mr-3' />
                    <span className='text-sm'>Help</span>
                  </Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className='flex-1 min-w-0'>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
