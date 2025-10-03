'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserIcon, MailIcon, PhoneIcon } from 'lucide-react'

interface OrderCustomerSummaryProps {
  customer: {
    name: string
    email?: string
  } | null
  phone?: string
  isAdmin?: boolean
}

export default function OrderCustomerSummary({
  customer,
  phone,
  isAdmin = false,
}: OrderCustomerSummaryProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
        <div className="space-y-3">
          {/* Name */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <UserIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">
                {customer?.name || 'Guest Customer'}
              </div>
            </div>
          </div>

          {/* Email */}
          {customer?.email && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                <MailIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Email</div>
                <a
                  href={`mailto:${customer.email}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {customer.email}
                </a>
              </div>
            </div>
          )}

          {/* Phone */}
          {phone && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <PhoneIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Phone</div>
                <a
                  href={`tel:${phone}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {phone}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Contact Actions */}
        {isAdmin && customer?.email && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`mailto:${customer.email}`}>
                <MailIcon className="h-4 w-4 mr-2" />
                Email Customer
              </a>
            </Button>
            {phone && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={`tel:${phone}`}>
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Call Customer
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
