import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import UserCreateForm from './user-create-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, UserPlus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Create User',
}

export default async function CreateUserPage() {
  const session = await auth()

  // Check if user has permission to create users
  if (!session?.user?.role || !hasPermission(session.user.role, 'users.create')) {
    throw new Error('Insufficient permissions to create users')
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
          <span className="text-foreground">Create User</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950">
                <UserPlus className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Create User</h1>
                <p className="text-muted-foreground mt-1">
                  Add a new user with administrative privileges
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <UserCreateForm currentUserRole={session.user.role} />
    </div>
  )
}
