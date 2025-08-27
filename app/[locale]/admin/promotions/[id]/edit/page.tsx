import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { getPromotionById } from '@/lib/actions/promotion.actions'
import PromotionForm from '../../promotion-form'

export const metadata: Metadata = {
  title: 'Edit Promotion',
}

export default async function EditPromotionPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const { id } = params

  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'promotions.update')) {
    throw new Error('Insufficient permissions to edit promotions')
  }

  try {
    const promotion = await getPromotionById(id)

    if (!promotion) {
      notFound()
    }

    return (
      <PromotionForm 
        type="Update" 
        promotion={promotion} 
        promotionId={id}
      />
    )
  } catch (error) {
    notFound()
  }
}
