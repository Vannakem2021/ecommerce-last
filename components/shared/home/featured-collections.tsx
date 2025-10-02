import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FeaturedCollection } from '@/lib/constants/collections'
import { getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'

interface FeaturedCollectionsProps {
  collections: FeaturedCollection[]
}

export async function FeaturedCollections({ collections }: FeaturedCollectionsProps) {
  const t = await getTranslations('Home')

  if (!collections || collections.length === 0) return null

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      {collections.map((collection) => (
        <Link
          key={collection.id}
          href={collection.link}
          className='group block'
        >
          <Card className='relative overflow-hidden rounded-lg border-border hover:shadow-xl transition-all duration-300 h-[300px] md:h-[350px]'>
            {/* Background Image */}
            <div className='absolute inset-0'>
              <Image
                src={collection.image}
                alt={collection.title}
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-500'
                unoptimized
              />
              {/* Gradient Overlay */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />
            </div>

            {/* Content */}
            <div className='relative h-full flex flex-col justify-end p-6 md:p-8 text-white'>
              <h3 className='text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary transition-colors'>
                {collection.title}
              </h3>
              <p className='text-sm md:text-base text-gray-200 mb-4 line-clamp-2'>
                {collection.description}
              </p>
              <Button
                variant='secondary'
                className='w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors'
              >
                {t('Explore Collection')}
                <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
              </Button>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
