'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Edit,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  Percent,
  DollarSign,
  Truck,
  Tag
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
import { formatDateTime } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
    <div className='space-y-6'>
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Promotions Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {totalPromotions} promotion{totalPromotions !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promotions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Button onClick={handleSearch} disabled={isPending} size="sm">
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4'>
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

      {/* Enhanced Promotions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/50 border-b">
                  <TableHead className="font-semibold text-foreground">PROMOTION</TableHead>
                  <TableHead className="font-semibold text-foreground">TYPE & VALUE</TableHead>
                  <TableHead className="font-semibold text-foreground">STATUS</TableHead>
                  <TableHead className="font-semibold text-foreground">USAGE</TableHead>
                  <TableHead className="font-semibold text-foreground">VALID PERIOD</TableHead>
                  <TableHead className="font-semibold text-foreground">CREATED</TableHead>
                  <TableHead className="w-[120px] font-semibold text-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Tag className="h-8 w-8 text-muted-foreground/50" />
                        <p>No promotions found</p>
                        <p className="text-sm">Create your first promotion to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((promotion) => (
                    <TableRow key={promotion._id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950">
                            <Tag className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{promotion.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {promotion.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          {getPromotionIcon(promotion.type)}
                          <div>
                            <div className="font-medium">
                              {getPromotionValue(promotion)}
                            </div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {promotion.type.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={isPromotionActive(promotion) ? 'default' : 'secondary'}
                          className={isPromotionActive(promotion)
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }
                        >
                          {isPromotionActive(promotion) ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm">
                          <div className="font-medium">
                            {promotion.usedCount}
                            {promotion.usageLimit > 0 && ` / ${promotion.usageLimit}`}
                          </div>
                          <div className="text-muted-foreground">
                            {promotion.usageLimit === 0 ? 'Unlimited' : 'uses'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="text-sm">
                            <div>{formatDateTime(promotion.startDate).dateOnly}</div>
                            <div className="text-muted-foreground">
                              to {formatDateTime(promotion.endDate).dateOnly}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <div className="text-sm">
                            {formatDateTime(promotion.createdAt).dateOnly}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                  asChild
                                >
                                  <Link href={`/admin/promotions/${promotion._id}`}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {canUpdate && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                    asChild
                                  >
                                    <Link href={`/admin/promotions/${promotion._id}/edit`}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit promotion</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {canDelete && (
                            <DeleteDialog id={promotion._id} action={deletePromotion} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
