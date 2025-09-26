import Image from 'next/image'
import Link from 'next/link'
import { getAllCategories } from '@/lib/actions/product.actions'
import Menu from './menu'
import Search from './search'
import data from '@/lib/data'
import Sidebar from './sidebar'
import { getSetting } from '@/lib/actions/setting.actions'
import { getPublishedWebPagesForNavigation } from '@/lib/actions/web-page.actions'
import { getTranslations } from 'next-intl/server'
import Container from '@/components/shared/container'
import TopBar from './top-bar'
import LanguageSwitcher from './language-switcher'

export default async function Header() {
  const categories = await getAllCategories()
  const { site } = await getSetting()
  const publishedPages = await getPublishedWebPagesForNavigation()
  const t = await getTranslations()

  // Combine static menu items with dynamic pages
  const staticMenus = data.headerMenus.filter(menu => !menu.href.startsWith('/page/'))
  const dynamicPageMenus = publishedPages.map(page => ({
    name: page.title,
    href: `/page/${page.slug}`
  }))

  // Combine all menu items for the drawer
  const allMenuItems = [...staticMenus, ...dynamicPageMenus]

  return (
    <header>
      <div className='bg-black text-white'>
        <Container padding='sm'>
          <div className='flex items-center justify-between h-16'>
            {/* Left: Hamburger Menu + Logo */}
            <div className='flex items-center gap-3'>
              <Sidebar categories={categories} menuItems={allMenuItems} />
              <Link
                href='/'
                className='flex items-center header-button font-extrabold text-xl lg:text-2xl'
              >
                <Image
                  src={site.logo}
                  width={32}
                  height={32}
                  alt={`${site.name} logo`}
                  className='lg:w-10 lg:h-10'
                />
                <span className='hidden sm:block ml-2'>{site.name}</span>
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className='flex-1 max-w-2xl mx-4 hidden sm:block'>
              <Search />
            </div>

            {/* Right: Utility Icons */}
            <div className='flex items-center gap-2'>
              <div className='hidden lg:flex items-center gap-2 text-sm'>
                <LanguageSwitcher />
                <span className='text-gray-300'>|</span>
                <TopBar showPhoneOnly />
              </div>
              <Menu />
            </div>
          </div>

          {/* Mobile Search */}
          <div className='sm:hidden pb-3'>
            <Search />
          </div>
        </Container>
      </div>
    </header>
  )
}
