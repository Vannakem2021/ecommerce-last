import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { MenuIcon } from 'lucide-react'
import Menu from '@/components/shared/header/menu'
import { AdminNav } from './admin-nav'
import { getSetting } from '@/lib/actions/setting.actions'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { auth } from '@/auth'
import { isSellerOrHigher } from '@/lib/rbac-utils'
import { redirectInsufficientRole, redirectAuthenticationRequired } from '@/lib/unauthorized-redirect'
import Script from 'next/script'
import Container from '@/components/shared/container'
import { SessionProvider } from 'next-auth/react'
import NotificationBell from '@/components/shared/header/notification-bell'
import GlobalSearch from '@/components/shared/header/global-search'
import QuickAddButton from '@/components/shared/header/quick-add-button'
import AdminPageTitle from './admin-page-title'

// Enable dynamic rendering with caching for better performance
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Check if user is authenticated
  if (!session?.user?.id) {
    console.warn('Unauthorized admin access attempt: No session')
    redirectAuthenticationRequired('/admin')
  }

  // Comprehensive admin access validation - require seller or higher role
  if (!session.user.role || !isSellerOrHigher(session.user.role)) {
    console.warn(`Unauthorized admin access attempt: User ${session.user.id} with role ${session.user.role}`)
    redirectInsufficientRole('/admin')
  }

  // Additional validation for session integrity
  if (typeof session.user.role !== 'string' || session.user.role.trim() === '') {
    console.error(`Invalid role format for user ${session.user.id}: ${session.user.role}`)
    redirectInsufficientRole('/admin')
  }

  const { site } = await getSetting()
  return (
    <SessionProvider session={session}>
      <AdminPageTitle />
      <Script id="admin-layout-class" strategy="beforeInteractive">
        {`document.documentElement.classList.add('admin-layout');`}
      </Script>
      <div className='flex h-screen overflow-hidden'>
        {/* Sidebar - Full height, hidden on mobile */}
        <aside className='hidden md:flex md:flex-col w-64 bg-background border-r border-border fixed top-0 left-0 h-screen z-20'>
          {/* Logo at top of sidebar */}
          <div className='flex h-16 items-center px-6'>
            <Link href='/'>
              <Image
                src={site.logo}
                width={48}
                height={48}
                alt={`${site.name} logo`}
              />
            </Link>
          </div>

          {/* Navigation */}
          <AdminNav userRole={session.user.role} />
        </aside>

        {/* Main content area */}
        <div className='flex flex-col flex-1 md:ml-64'>
          {/* Header - Full Width */}
          <header className='bg-background text-foreground border-b border-border sticky top-0 z-10'>
            <div className='flex h-16 items-center px-6'>
              {/* Mobile sidebar trigger */}
              <div className='md:hidden mr-3'>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-muted/10">
                      <MenuIcon className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <div className='flex h-16 items-center px-6'>
                      <Link href='/'>
                        <Image
                          src={site.logo}
                          width={48}
                          height={48}
                          alt={`${site.name} logo`}
                        />
                      </Link>
                    </div>
                    <AdminNav userRole={session.user.role} />
                  </SheetContent>
                </Sheet>
              </div>

              {/* Page title - Dynamic based on current route */}
              <div className='flex-1'>
                <h1 className='text-xl font-semibold' id='admin-page-title'>
                  {/* This will be updated by client component */}
                </h1>
              </div>

              {/* Right side actions */}
              <div className='flex items-center gap-4'>
                {/* Global Search */}
                <div className='hidden md:block w-64'>
                  <GlobalSearch />
                </div>

                {/* Quick Add Button */}
                <QuickAddButton />

                {/* Notification Bell */}
                <NotificationBell />

                {/* User Menu */}
                <Menu forAdmin />
              </div>
            </div>
          </header>

          {/* Page content - Scrollable */}
          <main className='flex-1 overflow-y-auto' data-main-content>
            <Container padding='default' className='pt-6 pb-20'>
              {children}
            </Container>
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
