'use client'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface RolePermissionsDetailProps {
  role: string
}

const rolePermissions = {
  admin: {
    allowed: [
      'Manage all users and assign roles',
      'Create, edit, and delete system users',
      'Manage all products and inventory',
      'View, edit, and manage all orders',
      'Access analytics and reports',
      'Manage system settings and configurations',
      'Access all administrative features',
    ],
    denied: [],
  },
  manager: {
    allowed: [
      'Manage products and inventory',
      'View and edit orders',
      'Access sales analytics and reports',
      'Manage product categories and brands',
      'Handle customer inquiries',
    ],
    denied: [
      'Cannot create or manage system users',
      'Cannot change user roles',
      'Cannot access system settings',
      'Limited administrative features',
    ],
  },
  seller: {
    allowed: [
      'Manage products and inventory',
      'Update stock levels',
      'View orders (read-only)',
      'Upload product images',
      'Update product descriptions',
    ],
    denied: [
      'Cannot edit or manage orders',
      'Cannot access analytics',
      'Cannot manage users',
      'Cannot access system settings',
      'Limited to product management only',
    ],
  },
}

export function RolePermissionsDetail({ role }: RolePermissionsDetailProps) {
  const [isOpen, setIsOpen] = useState(false)
  const permissions = rolePermissions[role as keyof typeof rolePermissions] || rolePermissions.seller

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline">
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        View detailed permissions
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="space-y-3 pl-6">
          {/* Allowed Permissions */}
          {permissions.allowed.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Access Granted</p>
              {permissions.allowed.map((permission, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{permission}</span>
                </div>
              ))}
            </div>
          )}

          {/* Denied Permissions */}
          {permissions.denied.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Restrictions</p>
              {permissions.denied.map((permission, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{permission}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
