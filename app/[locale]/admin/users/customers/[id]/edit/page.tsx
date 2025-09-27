import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'

import { getUserById } from '@/lib/actions/user.actions'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import CustomerEditForm from './customer-edit-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Customer',
}

export default async function CustomerEditPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const { id } = params

  const session = await auth()

  // Check if user has permission to update users
  if (!session?.user?.role || !hasPermission(session.user.role, 'users.update')) {
    throw new Error('Insufficient permissions to edit customers')
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
          <span className="text-foreground">Edit Customer</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Edit Customer</h1>
                <p className="text-muted-foreground mt-1">
                  Update customer account information and preferences
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground" title={user._id}>
            Customer ID: {user._id.length > 12 ? `${user._id.substring(0, 8)}...${user._id.substring(user._id.length - 4)}` : user._id}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <CustomerEditForm user={user} currentUserRole={session.user.role} />
    </div>
  )
}