import Link from 'next/link'
import { IProduct } from '@/lib/db/models/product.model'
import ProductCard from '@/components/shared/product/product-card'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface CategorySectionProps {
  title: string
  products: IProduct[]
  categorySlug?: string
}

export function CategorySection({ title, products, categorySlug }: CategorySectionProps) {
  const t = useTranslations('Home')
  
  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className='space-y-4'>
      {/* Category Title and View All Link */}
      <div>
        <div className='flex items-center justify-between mb-2'>
          <h2 className='h2-bold'>{title}</h2>
          {categorySlug && (
            <Link
              href={`/search?category=${categorySlug}`}
              className='flex items-center gap-1 text-sm font-medium text-primary hover:underline'
            >
              {t('View All')}
              <ChevronRight className='h-4 w-4' />
            </Link>
          )}
        </div>
        {/* Horizontal line below title */}
        <div className='h-[3px] w-16 bg-primary rounded-full'></div>
      </div>

      {/* Products Grid - 5 columns on desktop */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4'>
        {products.slice(0, 6).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  )
}
