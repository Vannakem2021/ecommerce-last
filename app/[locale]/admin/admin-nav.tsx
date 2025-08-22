'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
  SettingsIcon,
  ImageIcon,
  Languages,
  Currency,
  CreditCard,
  Package as PackageIcon,
  Tag,
  Layers,
  Warehouse
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

const mainLinks = [
  {
    title: 'Overview',
    href: '/admin/overview',
    icon: BarChart3,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Inventory',
    href: '/admin/inventory',
    icon: Warehouse,
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Layers,
  },
  {
    title: 'Brands',
    href: '/admin/brands',
    icon: Tag,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Pages',
    href: '/admin/web-pages',
    icon: FileText,
  },
]

const settingsLinks = [
  { name: 'Site Info', hash: 'setting-site-info', icon: Info },
  { name: 'Common Settings', hash: 'setting-common', icon: SettingsIcon },
  { name: 'Carousels', hash: 'setting-carousels', icon: ImageIcon },
  { name: 'Languages', hash: 'setting-languages', icon: Languages },
  { name: 'Currencies', hash: 'setting-currencies', icon: Currency },
  { name: 'Payment Methods', hash: 'setting-payment-methods', icon: CreditCard },
  { name: 'Delivery Dates', hash: 'setting-delivery-dates', icon: PackageIcon },
]

export function AdminNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const t = useTranslations('Admin')
  const [settingsOpen, setSettingsOpen] = useState(pathname.includes('/admin/settings'))

  const isSettingsActive = pathname.includes('/admin/settings')

  return (
    <nav
      className={cn(
        'flex flex-col w-64 h-full bg-black text-white border-r border-border',
        className
      )}
      {...props}
    >
      <div className="flex flex-col space-y-1 p-4">
        {/* Main Navigation Links */}
        {mainLinks.map((item) => {
          const Icon = item.icon
          const isActive = pathname.includes(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'admin-sidebar-link',
                isActive
                  ? 'admin-sidebar-link-active'
                  : 'admin-sidebar-link-inactive'
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.title)}
            </Link>
          )
        })}

        {/* Settings Collapsible Section */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'admin-sidebar-link justify-between w-full',
                isSettingsActive
                  ? 'admin-sidebar-link-active'
                  : 'admin-sidebar-link-inactive'
              )}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                {t('Settings')}
              </div>
              {settingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {settingsLinks.map((item) => {
              const Icon = item.icon

              const handleSettingsClick = (e: React.MouseEvent) => {
                e.preventDefault()
                // Navigate to settings page first if not already there
                if (!pathname.includes('/admin/settings')) {
                  window.location.href = `/admin/settings#${item.hash}`
                } else {
                  // If already on settings page, just scroll to section
                  const section = document.getElementById(item.hash)
                  if (section) {
                    const top = section.offsetTop - 16
                    window.scrollTo({ top, behavior: 'smooth' })
                  }
                }
              }

              return (
                <a
                  key={item.hash}
                  href={`/admin/settings#${item.hash}`}
                  onClick={handleSettingsClick}
                  className={cn(
                    'flex items-center gap-3 px-6 py-2 rounded-md text-sm transition-colors cursor-pointer',
                    'hover:bg-muted/10 hover:text-white text-muted-foreground'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {item.name}
                </a>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </nav>
  )
}
