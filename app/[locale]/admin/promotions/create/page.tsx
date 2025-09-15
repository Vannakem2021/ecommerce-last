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

  // Debugging: log who is creating the promotion (server-side log)
  console.log('[CreatePromotionPage] user:', session.user.id, session.user.email, session.user.role)

  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-2">Quick Test Scenarios</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Percentage promo: type=percentage, value=20 (1-100 only)</li>
          <li>Fixed promo: type=fixed, value=10.00 (must be > 0)</li>
          <li>Free shipping: type=free_shipping (value auto-set to 0)</li>
          <li>End date must be after start date (>= 1 minute)</li>
          <li>Scope products/categories require at least one selection</li>
          <li>Fixed discount: min order must be >= discount amount</li>
          <li>Duplicate code check (case-insensitive)</li>
        </ul>
      </div>
      <PromotionForm type="Create" />
    </div>
  )
}
