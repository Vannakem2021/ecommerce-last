import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import OrderCreateForm from './order-create-form'
import { getAllProductsForAdmin } from '@/lib/actions/product.actions'

export const metadata: Metadata = {
  title: 'Create Order - Admin',
}

export default async function CreateOrderPage() {
  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'orders.create')) {
    throw new Error('Insufficient permissions to create orders')
  }

  // Get products for selection
  const { products } = await getAllProductsForAdmin({ query: '', page: 1, limit: 1000 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Order</h1>
            <p className="text-muted-foreground mt-1">
              Create a new order for offline customers
            </p>
          </div>
        </div>
      </div>

      {/* Order Creation Form */}
      <OrderCreateForm products={products} />
    </div>
  )
}