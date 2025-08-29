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
import { hasPermission } from '@/lib/rbac-utils'
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
    redirectAuthenticationRequired('/admin')
  }

  // Basic admin access check - more specific checks are done in individual pages
  if (!session.user.role || !hasPermission(session.user.role, 'reports.read')) {
    redirectInsufficientRole('/admin')
  }

  const { site } = await getSetting()
  return (
    <>
      <Script id="admin-layout-class" strategy="beforeInteractive">
        {`document.documentElement.classList.add('admin-layout');`}
      </Script>
      <div className='flex h-screen overflow-hidden'>
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className='hidden md:flex md:flex-shrink-0 fixed left-0 top-0 h-full z-10'>
          <AdminNav userRole={session.user.role} />
        </div>

        {/* Main content area */}
        <div className='flex flex-col flex-1 overflow-hidden md:ml-64'>
          {/* Header */}
          <div className='bg-background text-foreground border-b border-border'>
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
          <div className='flex-1 overflow-auto p-4' data-main-content>{children}</div>
        </div>
      </div>
    </>
  )
}
