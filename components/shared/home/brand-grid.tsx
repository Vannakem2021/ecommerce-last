import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { IBrand } from '@/lib/db/models/brand.model'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface BrandWithCount extends IBrand {
  productCount: number
}

interface BrandGridProps {
  brands: BrandWithCount[]
  maxDisplay?: number
}

export async function BrandGrid({ brands, maxDisplay = 11 }: BrandGridProps) {
  const t = await getTranslations('Home')
  
  // Limit brands to display (reserve 1 spot for "View All" if needed)
  const displayBrands = brands.slice(0, maxDisplay)
  const hasMore = brands.length > maxDisplay

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4'>
      {displayBrands.map((brand) => (
        <Link
          key={brand._id}
          href={`/search?brand=${encodeURIComponent(brand.name)}`}
          className='group'
        >
          <Card className='rounded-lg border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full'>
            <CardContent className='p-4 md:p-6 flex flex-col items-center justify-center aspect-square'>
              {brand.logo ? (
                <div className='relative w-full h-full flex items-center justify-center'>
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={120}
                    height={120}
                    className='object-contain max-w-[80%] max-h-[80%] group-hover:scale-110 transition-transform duration-300'
                  />
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center w-full h-full'>
                  <span className='font-bold text-lg md:text-xl text-center line-clamp-2 group-hover:text-primary transition-colors'>
                    {brand.name}
                  </span>
                </div>
              )}
              {brand.productCount > 0 && (
                <p className='text-xs text-muted-foreground mt-2 text-center'>
                  {brand.productCount} {brand.productCount === 1 ? 'item' : 'items'}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
      
      {hasMore && (
        <Link href='/search' className='group'>
          <Card className='rounded-lg border-border hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full bg-secondary/20'>
            <CardContent className='p-4 md:p-6 flex flex-col items-center justify-center aspect-square'>
              <div className='flex flex-col items-center gap-2 text-center'>
                <ArrowRight className='h-8 w-8 md:h-10 md:w-10 text-primary group-hover:translate-x-1 transition-transform' />
                <span className='font-semibold text-sm md:text-base group-hover:text-primary transition-colors'>
                  {t('View All Brands')}
                </span>
                <span className='text-xs text-muted-foreground'>
                  +{brands.length - maxDisplay} {t('more')}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  )
}
