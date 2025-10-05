import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductCardSkeleton() {
  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-0'>
        {/* Image skeleton */}
        <Skeleton className='w-full aspect-square' />
        
        <div className='p-4 space-y-3'>
          {/* Title skeleton */}
          <Skeleton className='h-5 w-full' />
          <Skeleton className='h-5 w-3/4' />
          
          {/* Rating skeleton */}
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-12' />
          </div>
          
          {/* Price skeleton */}
          <Skeleton className='h-6 w-24' />
          
          {/* Button skeleton */}
          <Skeleton className='h-10 w-full' />
        </div>
      </CardContent>
    </Card>
  )
}
