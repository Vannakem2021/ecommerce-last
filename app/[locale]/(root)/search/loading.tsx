import ProductCardSkeleton from '@/components/shared/product/product-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function SearchLoading() {
  return (
    <div className='min-h-screen'>
      <div className='max-w-screen-2xl mx-auto px-4'>
        {/* Breadcrumbs skeleton */}
        <div className='py-4'>
          <Skeleton className='h-5 w-48' />
        </div>

        <div className='grid md:grid-cols-5 md:gap-6'>
          {/* Mobile filter button skeleton */}
          <div className='md:hidden mb-4 flex gap-3 items-center'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 flex-1' />
          </div>

          {/* Desktop sidebar skeleton */}
          <div className='hidden md:block space-y-6 md:col-span-1'>
            <Skeleton className='h-8 w-32' />
            <div className='space-y-4'>
              <Skeleton className='h-6 w-full' />
              <Skeleton className='h-6 w-full' />
              <Skeleton className='h-6 w-full' />
              <Skeleton className='h-6 w-full' />
            </div>
          </div>

          {/* Main content skeleton */}
          <div className='md:col-span-4 space-y-4'>
            {/* Header skeleton */}
            <div className='flex items-center justify-between'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-10 w-40' />
            </div>

            {/* Product grid skeleton */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'>
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
