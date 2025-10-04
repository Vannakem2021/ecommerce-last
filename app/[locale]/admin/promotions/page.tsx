import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { getAllPromotions } from '@/lib/actions/promotion.actions'
import PromotionList from './promotion-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Percent, Tag, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Promotions',
}

export default async function AdminPromotionsPage(props: {
  searchParams: Promise<{
    page: string
    query: string
    sort: string
    status: string
  }>
}) {
  const searchParams = await props.searchParams
  const page = Number(searchParams.page) || 1
  const searchText = searchParams.query || ''
  const sort = searchParams.sort || 'latest'
  const status = searchParams.status || 'all'

  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'promotions.read')) {
    throw new Error('Insufficient permissions to view promotions')
  }

  const data = await getAllPromotions({
    query: searchText,
    page,
    sort,
    status,
  })

  const canCreate = hasPermission(session.user.role, 'promotions.create')

  // Calculate promotion statistics
  const activePromotions = data.promotions.filter((promo: { active: boolean; startDate: string | Date; endDate: string | Date; usageLimit: number; usedCount: number }) => {
    const now = new Date()
    return (
      promo.active &&
      new Date(promo.startDate) <= now &&
      new Date(promo.endDate) >= now &&
      (promo.usageLimit === 0 || promo.usedCount < promo.usageLimit)
    )
  }).length

  const totalUsage = data.promotions.reduce((sum: number, promo: { usedCount: number }) => sum + promo.usedCount, 0)

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Promotions</h1>
          <p className="text-muted-foreground mt-1">
            Manage discount codes and promotional campaigns
          </p>
        </div>
        {canCreate && (
          <Button asChild className="flex items-center gap-2">
            <Link href="/admin/promotions/create">
              <Plus className="h-4 w-4" />
              Create Promotion
            </Link>
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Promotions</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPromotions}</div>
            <p className="text-xs text-muted-foreground">
              All promotion codes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Percent className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePromotions}</div>
            <p className="text-xs text-muted-foreground">
              Currently valid promotions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Times codes were used
            </p>
          </CardContent>
        </Card>
      </div>

      <PromotionList
        data={data.promotions}
        totalPromotions={data.totalPromotions}
        page={page}
        totalPages={data.totalPages}
        userRole={session.user.role}
      />
    </div>
  )
}
