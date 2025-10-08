import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'
import StickyPromoBar from '@/components/shared/promotion/sticky-promo-bar'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen'>
      <StickyPromoBar />
      <Header />
      <main className='flex-1 flex flex-col'>{children}</main>
      <Footer />
    </div>
  )
}
