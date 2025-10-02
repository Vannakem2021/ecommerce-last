'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProductCard from '@/components/shared/product/product-card'
import { CountdownTimer } from '@/components/shared/countdown-timer'
import { IProduct } from '@/lib/db/models/product.model'
import { useTranslations } from 'next-intl'

interface FlashDealsProps {
  products: IProduct[]
  endTime?: Date
}

export function FlashDeals({ products, endTime }: FlashDealsProps) {
  const t = useTranslations('Home')
  
  // Use the earliest ending product's saleEndDate if available
  const dealEndTime = endTime || (products[0]?.saleEndDate ? new Date(products[0].saleEndDate) : new Date(Date.now() + 24 * 60 * 60 * 1000))

  if (products.length === 0) return null

  return (
    <Card className='w-full rounded-none bg-card border-2 border-destructive'>
      <CardHeader className='p-4 pb-2'>
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <div className='flex items-center gap-3'>
            <h2 className='text-xl md:text-2xl font-bold flex items-center gap-2'>
              <span className='text-2xl'>⚡</span>
              {t('Flash Deals')}
            </h2>
            <Badge variant='destructive' className='text-xs md:text-sm'>
              {t('Limited Time')}
            </Badge>
          </div>
          <div className='flex items-center gap-2 text-sm md:text-base'>
            <Clock className='h-4 w-4 md:h-5 md:w-5' />
            <span className='font-medium'>{t('Ends in')}:</span>
            <CountdownTimer 
              endTime={dealEndTime} 
              className='font-mono font-bold text-destructive'
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4 pt-2'>
        <Carousel
          opts={{
            align: 'start',
          }}
          className='w-full'
        >
          <CarouselContent className='-ml-2 md:-ml-4'>
            {products.map((product) => {
              const discountPercentage = product.listPrice > product.price
                ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
                : 0

              return (
                <CarouselItem
                  key={product._id}
                  className='pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5 xl:basis-1/6'
                >
                  <div className='relative'>
                    {discountPercentage > 0 && (
                      <Badge 
                        variant='destructive' 
                        className='absolute top-2 right-2 z-10 text-xs md:text-sm font-bold'
                      >
                        -{discountPercentage}% 🔥
                      </Badge>
                    )}
                    <ProductCard
                      hideDetails={false}
                      hideAddToCart
                      hideBorder
                      product={product}
                    />
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious className='left-0 md:left-2' />
          <CarouselNext className='right-0 md:right-2' />
        </Carousel>
      </CardContent>
    </Card>
  )
}
