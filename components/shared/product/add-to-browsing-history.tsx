'use client'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import { useEffect } from 'react'

export default function AddToBrowsingHistory({
  id,
  category,
}: {
  id: string
  category: string
}) {
  const { addItem } = useBrowsingHistory()
  useEffect(() => {
    addItem({ id, category })
  }, [id, category, addItem])
  return null
}
