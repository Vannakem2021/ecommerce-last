import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'

import { getUserById } from '@/lib/actions/user.actions'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import CustomerDetailsView from './customer-details-view'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Customer Details',
}

export default async function CustomerDetailsPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const { id } = params

  const session = await auth()

  // Check if user has permission to read users
  if (!session?.user?.role || !hasPermission(session.user.role, 'users.read')) {
    throw new Error('Insufficient permissions to view customers')
  }

  const user = await getUserById(id)
  if (!user) notFound()

  // Ensure this is actually a customer
  if (user.role !== 'user') {
    throw new Error('This user is not a customer')
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
            <Link href="/admin/users" className="flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Users
            </Link>
          </Button>
          <span>/</span>
          <span className="text-muted-foreground">Customers</span>
          <span>/</span>
          <span className="text-foreground">Customer Details</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Customer Details</h1>
                <p className="text-muted-foreground mt-1">
                  View customer account information and order history
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground" title={user._id}>
            Customer ID: {user._id.length > 12 ? `${user._id.substring(0, 8)}...${user._id.substring(user._id.length - 4)}` : user._id}
          </div>
        </div>
      </div>

      {/* View Content */}
      <CustomerDetailsView user={user} />
    </div>
  )
}
