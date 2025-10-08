import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MobileAccountHeader } from '@/components/shared/account/mobile-account-header'
import { AccountSidebarContent } from '@/components/shared/account/account-sidebar-content'
import { getUserById } from '@/lib/actions/user.actions'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  // Fetch fresh user data from database (same as Settings page)
  const userData = await getUserById(session.user.id)

  // Check if user has password to determine auth method (OAuth vs Credentials)
  const hasPassword = !!userData?.password

  const navItems = [
    {
      title: 'My Orders',
      href: '/account/orders',
      icon: 'Package',
    },
    {
      title: 'My Favourites',
      href: '/account/favorites',
      icon: 'Heart',
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

  // Create enhanced session with fresh database image and auth method
  const enhancedSession = {
    ...session,
    user: {
      ...session.user,
      image: userData?.image || session.user.image, // Use database image (same as Settings)
      createdAt: userData?.createdAt || session.user.createdAt,
      hasPassword, // Pass auth method for initials display
    }
  }

  return (
    <div className='flex-1'>
      <div className='container mx-auto px-4 py-6'>
        {/* Mobile: Header with Drawer */}
        <MobileAccountHeader session={enhancedSession} navItems={navItems} />

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Desktop: Sticky Sidebar */}
          <aside className='hidden lg:block lg:w-64 flex-shrink-0 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto'>
            <AccountSidebarContent session={enhancedSession} navItems={navItems} />
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
