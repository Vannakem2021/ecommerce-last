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

export async function BrandGrid({ brands, maxDisplay = 19 }: BrandGridProps) {
  const t = await getTranslations('Home')
  
  // Limit brands to display (reserve 1 spot for "View All" if needed)
  const displayBrands = brands.slice(0, maxDisplay)
  const hasMore = brands.length > maxDisplay

  return (
    <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3'>
      {displayBrands.map((brand) => (
        <Link
          key={brand._id}
          href={`/search?brand=${encodeURIComponent(brand.name)}`}
          className='group'
        >
          <Card className='rounded-md border-border hover:shadow-md hover:border-primary/50 transition-all duration-300 h-full'>
            <CardContent className='p-3 md:p-4 flex flex-col items-center justify-center aspect-square'>
              {brand.logo ? (
                <div className='relative w-full h-full flex items-center justify-center'>
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={80}
                    height={80}
                    className='object-contain max-w-[70%] max-h-[70%] group-hover:scale-105 transition-transform duration-300'
                  />
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center w-full h-full'>
                  <span className='font-semibold text-xs md:text-sm text-center line-clamp-2 group-hover:text-primary transition-colors'>
                    {brand.name}
                  </span>
                </div>
              )}
              {brand.productCount > 0 && (
                <p className='text-[10px] md:text-xs text-muted-foreground mt-1 text-center'>
                  {brand.productCount}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
      
      {hasMore && (
        <Link href='/search' className='group'>
          <Card className='rounded-md border-border hover:shadow-md hover:border-primary/50 transition-all duration-300 h-full bg-secondary/20'>
            <CardContent className='p-3 md:p-4 flex flex-col items-center justify-center aspect-square'>
              <div className='flex flex-col items-center gap-1 text-center'>
                <ArrowRight className='h-5 w-5 md:h-6 md:w-6 text-primary group-hover:translate-x-1 transition-transform' />
                <span className='font-semibold text-[10px] md:text-xs group-hover:text-primary transition-colors'>
                  {t('View All')}
                </span>
                <span className='text-[9px] md:text-[10px] text-muted-foreground'>
                  +{brands.length - maxDisplay}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  )
}
