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
      <div className='flex min-h-screen'>
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className='hidden md:flex md:flex-shrink-0 fixed left-0 top-0 h-full z-10'>
          <AdminNav userRole={session.user.role} />
        </div>

        {/* Main content area */}
        <div className='flex flex-col flex-1 min-h-screen md:ml-64'>
          {/* Header */}
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
                    <AdminNav userRole={session.user.role} />
                  </SheetContent>
                </Sheet>
              </div>

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
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className='flex-1 p-4 pb-20' data-main-content>{children}</div>
        </div>
      </div>
    </>
  )
}
