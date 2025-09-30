import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { getPromotionById } from '@/lib/actions/promotion.actions'
import PromotionForm from '../../promotion-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Tag } from 'lucide-react'

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
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
              <Link href="/admin/promotions" className="flex items-center gap-1 hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
                Promotions
              </Link>
            </Button>
            <span>/</span>
            <span className="text-foreground">Edit Promotion</span>
          </div>

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Edit Promotion</h1>
                  <p className="text-muted-foreground mt-1">
                    Update promotion settings and configuration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <PromotionForm
          type="Update"
          promotion={promotion}
          promotionId={id}
        />
      </div>
    )
  } catch {
    notFound()
  }
}
