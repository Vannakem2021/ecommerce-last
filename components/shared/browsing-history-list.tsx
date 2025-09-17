'use client'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import React, { useEffect, useState, useMemo } from 'react'
import ProductSlider from './product/product-slider'
import { useTranslations } from 'next-intl'
import { Separator } from '../ui/separator'
import { cn } from '@/lib/utils'

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
    <div className='bg-background'>
      <Separator className={cn('mb-4', className)} />
      {relatedData.length > 0 && (
        <ProductSlider
          title={t("Related to items that you've viewed")}
          products={relatedData}
          hideDetails={false}
        />
      )}
      <Separator className='mb-4' />
      {historyData.length > 0 && (
        <ProductSlider
          title={t('Your browsing history')}
          products={historyData}
          hideDetails={true}
        />
      )}
    </div>
  )
}

