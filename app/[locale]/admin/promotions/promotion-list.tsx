'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  Percent,
  DollarSign,
  Truck
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
import { formatDateTime, formatId } from '@/lib/utils'
import { deletePromotion } from '@/lib/actions/promotion.actions'
import { IPromotionDetails } from '@/types'
import { hasPermission } from '@/lib/rbac-utils'

interface PromotionListProps {
  data: IPromotionDetails[]
  totalPromotions: number
  page: number
  totalPages: number
  userRole: string
}

export default function PromotionList({
  data,
  totalPromotions,
  page,
  totalPages,
  userRole,
}: PromotionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('query') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const canUpdate = hasPermission(userRole, 'promotions.update')
  const canDelete = hasPermission(userRole, 'promotions.delete')

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      if (query) {
        params.set('query', query)
      } else {
        params.delete('query')
      }
      params.set('page', '1')
      router.push(`/admin/promotions?${params.toString()}`)
    })
  }

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      params.set('sort', newSort)
      params.set('page', '1')
      router.push(`/admin/promotions?${params.toString()}`)
    })
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      params.set('status', newStatus)
      params.set('page', '1')
      router.push(`/admin/promotions?${params.toString()}`)
    })
  }

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />
      case 'fixed':
        return <DollarSign className="h-4 w-4" />
      case 'free_shipping':
        return <Truck className="h-4 w-4" />
      default:
        return <Percent className="h-4 w-4" />
    }
  }

  const getPromotionValue = (promotion: IPromotionDetails) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}%`
    } else if (promotion.type === 'fixed') {
      return `$${promotion.value}`
    } else {
      return 'Free Shipping'
    }
  }

  const isPromotionActive = (promotion: IPromotionDetails) => {
    const now = new Date()
    return (
      promotion.active &&
      new Date(promotion.startDate) <= now &&
      new Date(promotion.endDate) >= now &&
      (promotion.usageLimit === 0 || promotion.usedCount < promotion.usageLimit)
    )
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='flex gap-2'>
                <Input
                  placeholder='Search by code or name...'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className='flex-1'
                />
                <Button onClick={handleSearch} disabled={isPending}>
                  <Search className='h-4 w-4' />
                </Button>
              </div>
            </div>
            
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Sort by' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='latest'>Latest</SelectItem>
                <SelectItem value='oldest'>Oldest</SelectItem>
                <SelectItem value='name'>Name</SelectItem>
                <SelectItem value='code'>Code</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Promotions ({totalPromotions})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='w-[120px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((promotion) => (
                  <TableRow key={promotion._id}>
                    <TableCell className='font-mono font-medium'>
                      {promotion.code}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {promotion.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPromotionIcon(promotion.type)}
                        <span className="capitalize">{promotion.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className='font-medium'>
                      {getPromotionValue(promotion)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={isPromotionActive(promotion) ? 'default' : 'secondary'}
                      >
                        {isPromotionActive(promotion) ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {promotion.usedCount}
                        {promotion.usageLimit > 0 && ` / ${promotion.usageLimit}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDateTime(promotion.startDate).dateOnly}</div>
                        <div className="text-muted-foreground">
                          to {formatDateTime(promotion.endDate).dateOnly}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(promotion.createdAt).dateOnly}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          asChild
                        >
                          <Link href={`/admin/promotions/${promotion._id}`}>
                            <Eye className='h-4 w-4' />
                          </Link>
                        </Button>
                        
                        {canUpdate && (
                          <Button
                            variant='ghost'
                            size='sm'
                            asChild
                          >
                            <Link href={`/admin/promotions/${promotion._id}/edit`}>
                              <Edit className='h-4 w-4' />
                            </Link>
                          </Button>
                        )}
                        
                        {canDelete && (
                          <DeleteDialog
                            id={promotion._id}
                            action={deletePromotion}
                            trigger={
                              <Button variant='ghost' size='sm'>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} />
      )}
    </div>
  )
}
