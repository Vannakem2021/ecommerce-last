'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, ChevronLeft, ChevronRight, Users, UserCog } from 'lucide-react'
import UserOverviewCards from '@/components/shared/user/user-overview-cards'
import UserFilters from '@/components/shared/user/user-filters'
import CustomerList from '@/components/shared/user/customer-list'
import SystemUserList from '@/components/shared/user/system-user-list'
import { ExportUsersButton } from '@/components/shared/user/export-users-button'
import { getAllUsersWithPermissions, getCustomerStatistics } from '@/lib/actions/user.actions'
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
  const [topCustomer, setTopCustomer] = useState<{ name: string; email: string; orderCount: number; totalSpent: number } | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [emailFilter, setEmailFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        // Fetch all users and top customer statistics in parallel
        const [usersResult, topCustomerResult] = await Promise.all([
          getAllUsersWithPermissions({ page: 1, limit: 1000 }),
          getCustomerStatistics()
        ])
        setUsersData(usersResult)
        if (topCustomerResult.success && topCustomerResult.data) {
          setTopCustomer(topCustomerResult.data)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, emailFilter, roleFilter, sortBy, activeTab])

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

  // Separate customers from system users
  const customers = usersData.data.filter(user => normalizeRole(user.role) === 'user')
  const systemUsers = usersData.data.filter(user => normalizeRole(user.role) !== 'user')

  // Apply filters to customers
  let filteredCustomers = [...customers]

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredCustomers = filteredCustomers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query)
    )
  }

  // Email verification filter
  if (emailFilter === 'verified') {
    filteredCustomers = filteredCustomers.filter(customer => customer.emailVerified === true)
  } else if (emailFilter === 'unverified') {
    filteredCustomers = filteredCustomers.filter(customer => customer.emailVerified === false || !customer.emailVerified)
  }

  // Sort customers
  filteredCustomers.sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  // Apply filters to system users
  let filteredSystemUsers = [...systemUsers]

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredSystemUsers = filteredSystemUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (roleFilter !== 'all') {
    filteredSystemUsers = filteredSystemUsers.filter(user => normalizeRole(user.role) === roleFilter)
  }

  // Sort system users
  filteredSystemUsers.sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  // Calculate metrics (REAL DATA ONLY - NO FAKE DATA)
  const customerMetrics = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.emailVerified).length,
    newThisMonth: customers.filter(c => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(c.createdAt) > monthAgo
    }).length,
    topCustomer: topCustomer?.name,
    topCustomerOrders: topCustomer?.orderCount
  }

  const systemMetrics = {
    totalSystemUsers: systemUsers.length,
    admins: systemUsers.filter(user => normalizeRole(user.role) === 'admin').length,
    managers: systemUsers.filter(user => normalizeRole(user.role) === 'manager').length,
    sellers: systemUsers.filter(user => normalizeRole(user.role) === 'seller').length
  }

  // Pagination for filtered results
  const pageSize = 10
  const activeFilteredUsers = activeTab === 'customers' ? filteredCustomers : filteredSystemUsers
  const currentPageUsers = activeFilteredUsers.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(activeFilteredUsers.length / pageSize)

  const startItem = activeFilteredUsers.length === 0 ? 0 : ((page - 1) * pageSize) + 1
  const endItem = Math.min(page * pageSize, activeFilteredUsers.length)

  const handleClearFilters = () => {
    setSearchQuery('')
    setEmailFilter('all')
    setRoleFilter('all')
    setSortBy('latest')
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage customers and users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportUsersButton 
            userType={activeTab === 'customers' ? 'customer' : 'system'}
            totalUsers={activeTab === 'customers' ? filteredCustomers.length : filteredSystemUsers.length}
          />
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
            <UserCog className="h-4 w-4" />
            User ({systemUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          {/* Customer Overview Cards */}
          <UserOverviewCards type="customers" customerMetrics={customerMetrics} />

          {/* Customer Filters */}
          <UserFilters
            type="customers"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            emailFilter={emailFilter}
            onEmailFilterChange={setEmailFilter}
            sort={sortBy}
            onSortChange={setSortBy}
            totalResults={filteredCustomers.length}
            currentRange={filteredCustomers.length === 0 ? 'No' : `${startItem}-${endItem} of ${filteredCustomers.length}`}
            onClearFilters={handleClearFilters}
          />

          {/* Customers Table */}
          <div className="border rounded-lg">
            <CustomerList
              data={currentPageUsers}
              totalCustomers={filteredCustomers.length}
              page={page}
              totalPages={totalPages}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Showing {startItem} to {endItem} of {filteredCustomers.length} customers
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
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={page >= totalPages}
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
          {/* Header with Create Button */}
          <div className="flex items-center justify-end">
            {usersData.permissions.canCreate && (
              <Button asChild className="flex items-center gap-2">
                <Link href="/admin/users/create">
                  <Plus className="h-4 w-4" />
                  Create User
                </Link>
              </Button>
            )}
          </div>
          
          {/* System User Overview Cards */}
          <UserOverviewCards type="system" systemMetrics={systemMetrics} />

          {/* System User Filters */}
          <UserFilters
            type="system"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            sort={sortBy}
            onSortChange={setSortBy}
            totalResults={filteredSystemUsers.length}
            currentRange={filteredSystemUsers.length === 0 ? 'No' : `${startItem}-${endItem} of ${filteredSystemUsers.length}`}
            onClearFilters={handleClearFilters}
          />

          {/* System Users Table */}
          <div className="border rounded-lg">
            <SystemUserList
              data={currentPageUsers}
              totalUsers={filteredSystemUsers.length}
              page={page}
              totalPages={totalPages}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Showing {startItem} to {endItem} of {filteredSystemUsers.length} system users
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
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={page >= totalPages}
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
