'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const pageTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/overview': 'Overview',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/inventory': 'Inventory',
  '/admin/categories': 'Categories',
  '/admin/brands': 'Brands',
  '/admin/users': 'Users',
  '/admin/web-pages': 'Pages',
  '/admin/promotions': 'Promotions',
  '/admin/settings': 'Settings',
}

export default function AdminPageTitle() {
  const pathname = usePathname()

  useEffect(() => {
    // Get the base path without any sub-routes
    const basePath = pathname.split('/').slice(0, 3).join('/')
    const title = pageTitles[basePath] || 'Admin'

    // Update the title in the navbar
    const titleElement = document.getElementById('admin-page-title')
    if (titleElement) {
      titleElement.textContent = title
    }
  }, [pathname])

  return null
}
