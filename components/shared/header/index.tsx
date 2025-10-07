import Image from 'next/image'
import Link from 'next/link'
import Menu from './menu'
import StorefrontSearchWrapper from './storefront-search-wrapper'
import { getSetting } from '@/lib/actions/setting.actions'
import Container from '@/components/shared/container'
import TopBar from './top-bar'
import CategoryNav from './category-nav'
import ScrollHeader from './scroll-header'

export default async function Header() {
  const { site } = await getSetting()

  return (
    <>
      <ScrollHeader>
        {/* Top Bar */}
        <TopBar />

        {/* Main Header */}
        <div className='bg-background border-b relative z-[60]'>
          <Container padding='sm'>
            <div className='flex items-center justify-between h-16 lg:h-20'>
              {/* Left: Logo */}
              <div className='flex items-center gap-3'>
                <Link
                  href='/'
                  className='flex items-center header-button'
                >
                  <Image
                    src={site.logo}
                    width={48}
                    height={48}
                    alt={`${site.name} logo`}
                    className='w-10 h-10 lg:w-12 lg:h-12'
                  />
                  <div className='hidden sm:flex flex-col ml-2'>
                    <span className='font-bold text-lg lg:text-xl text-primary'>{site.name}</span>
                    <span className='text-xs text-muted-foreground'>Electronics Store</span>
                  </div>
                </Link>
              </div>

              {/* Center: Search Bar */}
              <div className='flex-1 max-w-2xl mx-4 hidden md:block'>
                <StorefrontSearchWrapper />
              </div>

              {/* Right: Utility Icons */}
              <div className='flex items-center gap-3'>
                <Menu />
              </div>
            </div>

            {/* Mobile Search */}
            <div className='md:hidden pb-3'>
              <StorefrontSearchWrapper />
            </div>
          </Container>
        </div>
      </ScrollHeader>

      {/* Category Navigation - Sticky */}
      <div className='sticky top-0 z-50'>
        <CategoryNav />
      </div>
    </>
  )
}
