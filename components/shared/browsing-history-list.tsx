'use client'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import React, { useEffect } from 'react'
import ProductSlider from './product/product-slider'
import { useTranslations } from 'next-intl'
import { Separator } from '../ui/separator'
import { cn } from '@/lib/utils'

export default function BrowsingHistoryList({
  className,
}: {
  className?: string
}) {
  const { products } = useBrowsingHistory()
  const t = useTranslations('Home')
  return (
    products.length !== 0 && (
      <div className='bg-background'>
        <Separator className={cn('mb-4', className)} />
        <ProductList
          title={t("Related to items that you've viewed")}
          type='related'
        />
        <Separator className='mb-4' />
        <ProductList
          title={t('Your browsing history')}
          hideDetails
          type='history'
        />
      </div>
    )
  )
}

function ProductList({
  title,
  type = 'history',
  hideDetails = false,
  excludeId = '',
}: {
  title: string
  type: 'history' | 'related'
  excludeId?: string
  hideDetails?: boolean
}) {
  const { products } = useBrowsingHistory()
  const [data, setData] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [lastFetchKey, setLastFetchKey] = React.useState('')

  useEffect(() => {
    if (products.length === 0) {
      setData([])
      return
    }

    const categories = products.map((product) => product.category).join(',')
    const ids = products.map((product) => product.id).join(',')
    const fetchKey = `${type}-${excludeId}-${categories}-${ids}`
    
    if (fetchKey === lastFetchKey || loading) return

    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/products/browsing-history?type=${type}&excludeId=${excludeId}&categories=${categories}&ids=${ids}`
        )
        const data = await res.json()
        setData(data)
        setLastFetchKey(fetchKey)
      } catch (error) {
        console.error('Failed to fetch browsing history:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [excludeId, products, type, lastFetchKey, loading])

  return (
    data.length > 0 && (
      <ProductSlider title={title} products={data} hideDetails={hideDetails} />
    )
  )
}
