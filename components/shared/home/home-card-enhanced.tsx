import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { IProduct } from '@/lib/db/models/product.model'
import ProductCardHorizontal from '@/components/shared/product/product-card-horizontal'

type CardItem = {
  title: string
  link: { text: string; href: string }
  items: {
    name: string
    items?: string[]
    image: string
    href: string
    count?: number
  }[] | IProduct[]
  showNewBadge?: boolean
  showRanking?: boolean
}

export function HomeCardEnhanced({ cards }: { cards: CardItem[] }) {
  // Helper to check if item is IProduct
  const isProduct = (item: any): item is IProduct => {
    return item && typeof item === 'object' && '_id' in item && 'slug' in item
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-4'>
      {cards.map((card) => (
        <Card key={card.title} className='rounded-none flex flex-col bg-card border-border'>
          <CardContent className='p-4 flex-1'>
            <h3 className='text-xl font-bold mb-4'>{card.title}</h3>
            {/* Check if first item is a product to determine layout */}
            {card.items.length > 0 && isProduct(card.items[0]) ? (
              // Product items: Use horizontal cards in single column
              <div className='grid grid-cols-1 gap-3'>
                {card.items.map((item, index) => {
                  if (isProduct(item)) {
                    return (
                      <ProductCardHorizontal
                        key={item._id}
                        product={item}
                        showNewBadge={card.showNewBadge}
                        ranking={card.showRanking ? index + 1 : undefined}
                      />
                    )
                  }
                  return null
                })}
              </div>
            ) : (
              // Category items: Keep 2x2 grid layout
              <div className='grid grid-cols-2 gap-4'>
                {card.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className='flex flex-col'
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      className='aspect-square object-scale-down max-w-full h-auto mx-auto'
                      height={120}
                      width={120}
                    />
                    <p className='text-center text-sm whitespace-nowrap overflow-hidden text-ellipsis'>
                      {item.name}
                    </p>
                    {item.count !== undefined && (
                      <p className='text-center text-xs text-muted-foreground mt-1'>
                        ({item.count})
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          {card.link && (
            <CardFooter>
              <Link href={card.link.href} className='mt-4 block'>
                {card.link.text}
              </Link>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
