import Link from 'next/link'
import Container from '@/components/shared/container'
import { Flame, Sparkles, TrendingUp, RefreshCcw } from 'lucide-react'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { getAllCategories } from '@/lib/actions/product.actions'
import data from '@/lib/data'
import { getPublishedWebPagesForNavigation } from '@/lib/actions/web-page.actions'
import Sidebar from './sidebar'

export default async function CategoryNav() {
  const session = await auth()
  const allCategories = await getAllCategories()
  const publishedPages = await getPublishedWebPagesForNavigation()

  // Combine static menu items with dynamic pages
  const staticMenus = data.headerMenus.filter(menu => !menu.href.startsWith('/page/'))
  const dynamicPageMenus = publishedPages.map(page => ({
    name: page.title,
    href: `/page/${page.slug}`,
    section: page.section || 'more'
  }))

  const allMenuItems = [...staticMenus, ...dynamicPageMenus]

  // Get dynamic sections from settings for navbar
  const categories = [
    { name: 'Hot Deals', icon: Flame, href: '/search?discount=true' },
    { name: 'New Arrivals', icon: Sparkles, href: '/search?sort=latest' },
    { name: 'Best Sellers', icon: TrendingUp, href: '/search?sort=best-selling' },
    { name: 'Second Hand', icon: RefreshCcw, href: '/search?secondHand=true' },
  ]

  return (
    <div className='bg-primary'>
      <Container padding='sm'>
        <div className='flex items-center justify-between h-14'>
          {/* All Categories Toggle */}
          <div className='flex items-center gap-4'>
            <Sidebar categories={allCategories} menuItems={allMenuItems} />
          </div>

          {/* Category Links */}
          <nav className='hidden lg:flex items-center gap-6 flex-1 ml-6'>
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className='flex items-center gap-2 text-white hover:text-white/80 transition-colors text-base font-medium'
                >
                  <Icon className='h-5 w-5' />
                  <span>{category.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Login/Sign Up Button */}
          <div className='ml-auto'>
            {!session ? (
              <Button
                asChild
                variant='secondary'
                size='default'
                className='font-semibold bg-white text-primary hover:bg-white/90 h-10'
              >
                <Link href='/sign-in'>Login / Sign Up</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  )
}
