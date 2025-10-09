'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, ChevronLeft, ChevronRight, Users, Shield } from 'lucide-react'
import UserOverviewCards from '@/components/shared/user/user-overview-cards'
import UserFilters from '@/components/shared/user/user-filters'
import CustomerList from '@/components/shared/user/customer-list'
import SystemUserList from '@/components/shared/user/system-user-list'
import { getAllUsersWithPermissions } from '@/lib/actions/user.actions'
import { normalizeRole } from '@/lib/rbac-utils'

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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [emailFilter, setEmailFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, emailFilter, roleFilter, sortBy, activeTab])

  // Separate customers from system users (ensure arrays exist even if data is empty/loading)
  const customers = usersData?.data?.filter(user => normalizeRole(user.role) === 'user') || []
  const systemUsers = usersData?.data?.filter(user => normalizeRole(user.role) !== 'user') || []

  // Apply filters to customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      )
    }

    // Email verification filter
    if (emailFilter === 'verified') {
      result = result.filter(customer => customer.emailVerified === true)
    } else if (emailFilter === 'unverified') {
      result = result.filter(customer => customer.emailVerified === false || !customer.emailVerified)
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })

    return result
  }, [customers, searchQuery, emailFilter, sortBy])

  // Apply filters to system users
  const filteredSystemUsers = useMemo(() => {
    let result = [...systemUsers]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => normalizeRole(user.role) === roleFilter)
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })

    return result
  }, [systemUsers, searchQuery, roleFilter, sortBy])

  // Calculate metrics (REAL DATA ONLY - NO FAKE DATA)
  const customerMetrics = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.emailVerified).length,
    newThisMonth: customers.filter(c => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(c.createdAt) > monthAgo
    }).length
  }

  const systemMetrics = {
    totalSystemUsers: systemUsers.length,
    admins: systemUsers.filter(user => normalizeRole(user.role) === 'admin').length,
    managers: systemUsers.filter(user => normalizeRole(user.role) === 'manager').length
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

  // Show loading state
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

  // Show error message if data failed to load
  if (!usersData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1 text-destructive">Error loading users</p>
          </div>
        </div>
      </div>
    )
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
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
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
        <TabsContent value="customers" className="space-y-4">
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
        <TabsContent value="system" className="space-y-4">
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
