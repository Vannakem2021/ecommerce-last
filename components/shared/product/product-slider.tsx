'use client'

import * as React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import ProductCard from './product-card'
import { IProduct } from '@/lib/db/models/product.model'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
  viewAllHref,
  viewAllText = 'View All',
}: {
  title?: string
  products: IProduct[]
  hideDetails?: boolean
  viewAllHref?: string
  viewAllText?: string
}) {
  return (
    <div className='w-full'>
      <div className='container mx-auto px-4'>
        {/* Header with View All */}
        <div className='flex justify-between items-center mb-4 md:mb-6'>
          <h2 className='text-base sm:text-lg md:text-xl lg:text-2xl font-bold'>{title}</h2>
          {viewAllHref && (
            <Link 
              href={viewAllHref}
              className='text-xs sm:text-sm text-primary hover:underline flex items-center gap-1 font-medium transition-colors'
            >
              {viewAllText}
              <ArrowRight className='h-3 w-3 sm:h-4 sm:w-4' />
            </Link>
          )}
        </div>

        {/* Carousel with Scroll Indicators */}
        <div className='relative'>
          <Carousel
            opts={{
              align: 'start',
            }}
            className='w-full max-w-7xl'
          >
            <CarouselContent className='-ml-2 md:-ml-4'>
              {products.map((product) => (
                <CarouselItem
                  key={product._id}
                  className='pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6'
                >
                  <ProductCard
                    hideDetails={hideDetails}
                    hideAddToCart
                    hideBorder
                    product={product}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='hidden md:flex -left-4 lg:-left-6' />
            <CarouselNext className='hidden md:flex -right-4 lg:-right-6' />
          </Carousel>

          {/* Gradient Scroll Indicators */}
          <div className='absolute right-0 top-0 bottom-12 w-8 md:w-12 bg-gradient-to-l from-background to-transparent pointer-events-none' />
          <div className='absolute left-0 top-0 bottom-12 w-8 md:w-12 bg-gradient-to-r from-background to-transparent pointer-events-none' />
        </div>

        {/* Mobile Swipe Hint */}
        <div className='md:hidden text-center text-xs text-muted-foreground mt-3'>
          ← Swipe to see more →
        </div>
      </div>
    </div>
  )
}
