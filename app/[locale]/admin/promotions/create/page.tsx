import { Metadata } from 'next'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import PromotionForm from '../promotion-form'

export const metadata: Metadata = {
  title: 'Create Promotion',
}

export default async function CreatePromotionPage() {
  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'promotions.create')) {
    throw new Error('Insufficient permissions to create promotions')
  }

  return <PromotionForm type="Create" />
}
