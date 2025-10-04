'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IUser } from '@/lib/db/models/user.model'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { 
  UserIcon, 
  MailIcon, 
  CalendarIcon, 
  MapPinIcon, 
  CreditCardIcon,
  ShoppingBagIcon,
  PackageIcon,
  KeyIcon,
  CheckCircleIcon,
  ExternalLinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface CustomerDetailsViewProps {
  user: IUser
}

interface CustomerStats {
  totalOrders: number
  totalSpent: number
  averageOrder: number
  lastOrderDate: string | null
}

interface RecentOrder {
  _id: string
  orderNumber: string
  totalPrice: number
  deliveryStatus: string
  createdAt: string
}

const CustomerDetailsView = ({ user }: CustomerDetailsViewProps) => {
  const { toast } = useToast()
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    totalSpent: 0,
    averageOrder: 0,
    lastOrderDate: null
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch(`/api/customers/${user._id}/stats`)
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setRecentOrders(data.recentOrders)
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [user._id])

  const handleResendVerification = async () => {
    setActionLoading('verify')
    try {
      const response = await fetch('/api/customers/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Verification email sent successfully' })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send verification email'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendPasswordReset = async () => {
    setActionLoading('reset')
    try {
      const response = await fetch('/api/customers/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Password reset link sent successfully' })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send password reset'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleManualVerify = async () => {
    setActionLoading('manual-verify')
    try {
      const response = await fetch('/api/customers/manual-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({ title: 'Success', description: 'Email verified successfully' })
        window.location.reload()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify email'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'shipped':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Customer Overview - 2 Column Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Profile Information */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium break-all">{user.email}</p>
                  {user.emailVerified ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✓ Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                <p className="font-medium">{formatDateTime(user.createdAt).dateOnly}</p>
              </div>
            </div>

            {/* Right Column: Order Statistics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Total Orders</span>
                <span className="text-xl font-bold">
                  {loading ? '...' : stats.totalOrders}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="text-xl font-bold text-green-600">
                  {loading ? '...' : formatCurrency(stats.totalSpent)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Average Order</span>
                <span className="text-xl font-bold">
                  {loading ? '...' : formatCurrency(stats.averageOrder)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              {stats.lastOrderDate && (
                <CardDescription className="mt-1">
                  Last order: {formatDateTime(new Date(stats.lastOrderDate)).dateOnly}
                </CardDescription>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/orders?search=${user.email}`}>
                <ExternalLinkIcon className="h-3.5 w-3.5 mr-1.5" />
                View All
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
              Loading orders...
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{order.orderNumber}</span>
                    <Badge variant="outline" className={getDeliveryStatusColor(order.deliveryStatus)}>
                      {order.deliveryStatus || 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatCurrency(order.totalPrice)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(new Date(order.createdAt)).dateOnly}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No orders yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contact & Delivery Information (Combined) */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Delivery Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shipping Address */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              Shipping Address
            </h4>
            {user.address ? (
              <div className="pl-6 text-sm space-y-1">
                <p className="font-medium">{user.address.fullName || 'N/A'}</p>
                <p className="text-muted-foreground">{user.address.phone || 'N/A'}</p>
                <p className="text-muted-foreground">
                  {(user.address && 'houseNumber' in user.address) && user.address.houseNumber && `${user.address.houseNumber} `}
                  {user.address.street && `${user.address.street}, `}
                  {(user.address && 'communeName' in user.address) && user.address.communeName && `${user.address.communeName}, `}
                  {(user.address && 'districtName' in user.address) && user.address.districtName && `${user.address.districtName}, `}
                  {(user.address && 'provinceName' in user.address) && user.address.provinceName ? user.address.provinceName : 'Not complete'}
                </p>
              </div>
            ) : (
              <p className="pl-6 text-sm text-muted-foreground">No address on file</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              Payment Method
            </h4>
            <p className="pl-6 text-sm text-muted-foreground capitalize">
              {user.paymentMethod || 'Not set'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions (Admin Tools) */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Administrative tools to help manage this customer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!user.emailVerified && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={actionLoading === 'verify'}
                >
                  <MailIcon className="h-3.5 w-3.5 mr-1.5" />
                  {actionLoading === 'verify' ? 'Sending...' : 'Resend Verification'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManualVerify}
                  disabled={actionLoading === 'manual-verify'}
                >
                  <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                  {actionLoading === 'manual-verify' ? 'Verifying...' : 'Verify Email'}
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSendPasswordReset}
              disabled={actionLoading === 'reset'}
            >
              <KeyIcon className="h-3.5 w-3.5 mr-1.5" />
              {actionLoading === 'reset' ? 'Sending...' : 'Send Password Reset'}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders?search=${user.email}`}>
                <ShoppingBagIcon className="h-3.5 w-3.5 mr-1.5" />
                View All Orders
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerDetailsView
