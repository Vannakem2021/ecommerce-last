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
import AdminUserButton from '@/components/shared/header/admin-user-button'

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
    <>
      <Script id="admin-layout-class" strategy="beforeInteractive">
        {`document.documentElement.classList.add('admin-layout');`}
      </Script>
      <div className='flex flex-col min-h-screen'>
        {/* Header - Full Width */}
        <div className='bg-background text-foreground border-b border-border sticky top-0 z-20'>
          <div className='flex h-16 items-center px-4'>
            {/* Mobile sidebar trigger */}
            <div className='md:hidden mr-3'>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-muted/10">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SessionProvider session={session}>
                    <AdminNav userRole={session.user.role} />
                  </SessionProvider>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo */}
            <Link href='/'>
              <Image
                src={site.logo}
                width={48}
                height={48}
                alt={`${site.name} logo`}
              />
            </Link>

            <div className='ml-auto flex items-center space-x-4'>
              <Menu forAdmin />
              <SessionProvider session={session}>
                <AdminUserButton />
              </SessionProvider>
            </div>
          </div>
        </div>

        {/* Content area with sidebar */}
        <div className='flex flex-1 relative'>
          {/* Sidebar - Hidden on mobile, visible on desktop - Fixed positioning */}
          <div className='hidden md:flex md:flex-shrink-0 w-64 fixed top-16 left-0 h-[calc(100vh-4rem)] z-10'>
            <SessionProvider session={session}>
              <AdminNav userRole={session.user.role} />
            </SessionProvider>
          </div>

          {/* Page content - Scrollable with margin for sidebar */}
          <div className='flex-1 md:ml-64 overflow-y-auto' data-main-content>
            <Container padding='default' className='pt-6 pb-20'>
              {children}
            </Container>
          </div>
        </div>
      </div>
    </>
  )
}
