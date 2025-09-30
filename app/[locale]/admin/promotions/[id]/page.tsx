import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { getPromotionById, getPromotionUsageStats } from '@/lib/actions/promotion.actions'
import PromotionDetails from './promotion-details'

export const metadata: Metadata = {
  title: 'Promotion Details',
}

export default async function PromotionDetailsPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const { id } = params

  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'promotions.read')) {
    throw new Error('Insufficient permissions to view promotions')
  }

  try {
    const [promotion, usageStats] = await Promise.all([
      getPromotionById(id),
      getPromotionUsageStats(id)
    ])

    if (!promotion) {
      notFound()
    }

    return (
      <PromotionDetails 
        promotion={promotion} 
        usageStats={usageStats}
        userRole={session.user.role}
      />
    )
  } catch {
    notFound()
  }
}
