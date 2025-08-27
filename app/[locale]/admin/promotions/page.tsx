import { Metadata } from 'next'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { getAllPromotions } from '@/lib/actions/promotion.actions'
import PromotionList from './promotion-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

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

  return (
    <div className='space-y-4'>
      <div className='flex-between'>
        <h1 className='h1-bold'>Promotions</h1>
        {canCreate && (
          <Button asChild variant='default'>
            <Link href='/admin/promotions/create'>
              <Plus className='w-4 h-4' />
              Create Promotion
            </Link>
          </Button>
        )}
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
