'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Upload, ChevronLeft, ChevronRight, Users, Shield } from 'lucide-react'
import UserOverviewCards from '@/components/shared/user/user-overview-cards'
import UserFilters from '@/components/shared/user/user-filters'
import CustomerList from '@/components/shared/user/customer-list'
import SystemUserList from '@/components/shared/user/system-user-list'
import { getAllUsersWithPermissions } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'
import { normalizeRole } from '@/lib/rbac-utils'

// Simulated data - in real implementation, this would come from server
interface UsersData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  totalPages: number
  permissions: {
    canCreate: boolean
  }
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('customers')
  const [page, setPage] = useState(1)
  const [usersData, setUsersData] = useState<UsersData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        // Fetch all users by setting a high limit to get everyone
        const data = await getAllUsersWithPermissions({ page: 1, limit: 1000 })
        setUsersData(data)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!usersData) {
    return <div>Error loading users</div>
  }

  // Separate customers from system users (normalize roles for comparison)
  const customers = usersData.data.filter(user => normalizeRole(user.role) === 'user')
  const systemUsers = usersData.data.filter(user => normalizeRole(user.role) !== 'user')


  // Calculate metrics
  const customerMetrics = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.emailVerified).length,
    newThisMonth: customers.filter(c => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(c.createdAt) > monthAgo
    }).length,
    totalOrders: 0, // Would come from order data
    averageOrderValue: 0, // Would come from order data
    topCustomer: customers[0]?.name
  }

  const systemMetrics = {
    totalSystemUsers: systemUsers.length,
    admins: systemUsers.filter(user => normalizeRole(user.role) === 'admin').length,
    managers: systemUsers.filter(user => normalizeRole(user.role) === 'manager').length,
    sellers: systemUsers.filter(user => normalizeRole(user.role) === 'seller').length,
    recentLogins: systemUsers.filter(() => {
      // Simulate recent login check
      return Math.random() > 0.5
    }).length
  }

  const currentPageCustomers = customers.slice((page - 1) * 10, page * 10)
  const currentPageSystemUsers = systemUsers.slice((page - 1) * 10, page * 10)
  const totalCustomerPages = Math.ceil(customers.length / 10)
  const totalSystemUserPages = Math.ceil(systemUsers.length / 10)

  const totalActiveUsers = activeTab === 'customers' ? customers.length : systemUsers.length

  const startItem = ((page - 1) * 10) + 1
  const endItem = Math.min(page * 10, totalActiveUsers)

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage customers and system users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          {usersData.permissions.canCreate && (
            <Button asChild className="flex items-center gap-2">
              <Link href="/admin/users/create">
                <Plus className="h-4 w-4" />
                Create System User
              </Link>
            </Button>
          )}
        </div>
      </div>


      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System Users ({systemUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          {/* Customer Overview Cards */}
          <UserOverviewCards type="customers" customerMetrics={customerMetrics} />

          {/* Customer Filters */}
          <UserFilters
            type="customers"
            totalResults={customers.length}
            currentRange={customers.length === 0 ? 'No' : `${startItem}-${Math.min(endItem, customers.length)} of ${customers.length}`}
          />

          {/* Enhanced Customers Table */}
          <div className="border rounded-lg">
            <CustomerList
              data={currentPageCustomers}
              totalCustomers={customers.length}
              page={page}
              totalPages={totalCustomerPages}
            />

            {/* Enhanced Pagination for Customers */}
            {totalCustomerPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Showing {startItem} to {Math.min(endItem, customers.length)} of {customers.length} customers
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {totalCustomerPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={page >= totalCustomerPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* System Users Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* System User Overview Cards */}
          <UserOverviewCards type="system" systemMetrics={systemMetrics} />

          {/* System User Filters */}
          <UserFilters
            type="system"
            totalResults={systemUsers.length}
            currentRange={systemUsers.length === 0 ? 'No' : `${startItem}-${Math.min(endItem, systemUsers.length)} of ${systemUsers.length}`}
          />

          {/* Enhanced System Users Table */}
          <div className="border rounded-lg">
            <SystemUserList
              data={currentPageSystemUsers}
              totalUsers={systemUsers.length}
              page={page}
              totalPages={totalSystemUserPages}
            />

            {/* Enhanced Pagination for System Users */}
            {totalSystemUserPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Showing {startItem} to {Math.min(endItem, systemUsers.length)} of {systemUsers.length} system users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {totalSystemUserPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={page >= totalSystemUserPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
