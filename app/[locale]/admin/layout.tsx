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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { site } = await getSetting()
  return (
    <>
      <div className='flex h-screen'>
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className='hidden md:flex md:flex-shrink-0'>
          <AdminNav />
        </div>

        {/* Main content area */}
        <div className='flex flex-col flex-1 overflow-hidden'>
          {/* Header */}
          <div className='bg-black text-white'>
            <div className='flex h-16 items-center px-4'>
              {/* Mobile sidebar trigger */}
              <div className='md:hidden mr-3'>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-muted/10">
                      <MenuIcon className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <AdminNav />
                  </SheetContent>
                </Sheet>
              </div>

              <Link href='/'>
                <Image
                  src='/icons/logo.svg'
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
          <div className='flex-1 overflow-auto p-4'>{children}</div>
        </div>
      </div>
    </>
  )
}
