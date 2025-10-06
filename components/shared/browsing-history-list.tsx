'use client'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import React, { useEffect, useState, useMemo } from 'react'
import ProductSlider from './product/product-slider'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '../ui/card'

// Cache for API responses to prevent duplicate calls
const apiCache = new Map<string, any>()
const pendingRequests = new Map<string, Promise<any>>()

export default function BrowsingHistoryList({
  className,
}: {
  className?: string
}) {
  const { products } = useBrowsingHistory()
  const t = useTranslations('Home')
  const [relatedData, setRelatedData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(false)

  // Memoize the API parameters to prevent unnecessary recalculations
  const apiParams = useMemo(() => {
    if (products.length === 0) return null

    const categories = products.map((product) => product.category).join(',')
    const ids = products.map((product) => product.id).join(',')
    return { categories, ids }
  }, [products])

  // Fetch both related and history data in a single effect
  useEffect(() => {
    if (!apiParams || loading) return

    const fetchBrowsingData = async () => {
      setLoading(true)

      try {
        const { categories, ids } = apiParams

        // Create cache keys for both requests
        const relatedKey = `related--${categories}-${ids}`
        const historyKey = `history--${categories}-${ids}`

        // Check cache first
        if (apiCache.has(relatedKey) && apiCache.has(historyKey)) {
          setRelatedData(apiCache.get(relatedKey))
          setHistoryData(apiCache.get(historyKey))
          setLoading(false)
          return
        }

        // Fetch both types in parallel, avoiding duplicate requests
        const fetchPromises = []

        if (!apiCache.has(relatedKey) && !pendingRequests.has(relatedKey)) {
          const relatedPromise = fetch(
            `/api/products/browsing-history?type=related&excludeId=&categories=${categories}&ids=${ids}`
          ).then(res => res.json())
          pendingRequests.set(relatedKey, relatedPromise)
          fetchPromises.push(relatedPromise.then(data => ({ type: 'related', data })))
        }

        if (!apiCache.has(historyKey) && !pendingRequests.has(historyKey)) {
          const historyPromise = fetch(
            `/api/products/browsing-history?type=history&excludeId=&categories=${categories}&ids=${ids}`
          ).then(res => res.json())
          pendingRequests.set(historyKey, historyPromise)
          fetchPromises.push(historyPromise.then(data => ({ type: 'history', data })))
        }

        // Wait for all new requests to complete
        if (fetchPromises.length > 0) {
          const results = await Promise.all(fetchPromises)

          results.forEach(({ type, data }) => {
            const key = type === 'related' ? relatedKey : historyKey
            apiCache.set(key, data)
            pendingRequests.delete(key)

            if (type === 'related') {
              setRelatedData(data)
            } else {
              setHistoryData(data)
            }
          })
        }

        // Set data from cache if it exists
        if (apiCache.has(relatedKey) && fetchPromises.length === 0) {
          setRelatedData(apiCache.get(relatedKey))
        }
        if (apiCache.has(historyKey) && fetchPromises.length === 0) {
          setHistoryData(apiCache.get(historyKey))
        }

      } catch (error) {
        console.error('Failed to fetch browsing history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBrowsingData()
  }, [apiParams, loading])

  // Clear cache periodically to prevent memory leaks
  useEffect(() => {
    if (apiCache.size > 20) {
      apiCache.clear()
      pendingRequests.clear()
    }
  }, [apiParams])

  if (products.length === 0) return null

  return (
    <div className={cn('py-8 md:py-12 space-y-6 md:space-y-8', className)}>
      {loading ? (
        <div className='space-y-6 md:space-y-8'>
          {/* Related Products Skeleton */}
          <Card className='rounded-lg border border-border'>
            <CardContent className='p-4 md:p-6'>
              <div className='h-8 w-64 bg-muted rounded mb-4 md:mb-6 animate-pulse' />
              <div className='flex gap-2 md:gap-4'>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className='flex-1 space-y-3'>
                    <div className='aspect-square bg-muted rounded animate-pulse' />
                    <div className='space-y-2 p-3'>
                      <div className='h-4 bg-muted rounded animate-pulse' />
                      <div className='h-4 bg-muted rounded w-3/4 animate-pulse' />
                      <div className='h-6 bg-muted rounded w-1/2 animate-pulse' />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* History Skeleton */}
          <Card className='rounded-lg border border-border'>
            <CardContent className='p-4 md:p-6'>
              <div className='h-8 w-48 bg-muted rounded mb-4 md:mb-6 animate-pulse' />
              <div className='flex gap-2 md:gap-4'>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className='flex-1 space-y-2'>
                    <div className='aspect-square bg-muted rounded animate-pulse' />
                    <div className='h-3 bg-muted rounded animate-pulse mx-2' />
                    <div className='h-4 bg-muted rounded w-2/3 mx-2 animate-pulse' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {relatedData.length > 0 && (
            <Card className='rounded-lg border border-border'>
              <CardContent className='p-4 md:p-6'>
                <ProductSlider
                  title={t("You May Also Like")}
                  products={relatedData}
                  hideDetails={false}
                  viewAllHref='/search'
                  viewAllText={t('View All')}
                />
              </CardContent>
            </Card>
          )}
          {historyData.length > 0 && (
            <Card className='rounded-lg border border-border'>
              <CardContent className='p-4 md:p-6'>
                <ProductSlider
                  title={t('Recently Viewed')}
                  products={historyData}
                  hideDetails={true}
                  viewAllHref='/search'
                  viewAllText={t('View All')}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

