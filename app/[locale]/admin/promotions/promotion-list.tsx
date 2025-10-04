'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Edit,
  Eye,
  EyeOff,
  SearchIcon,
  Calendar,
  Percent,
  DollarSign,
  Truck,
  Tag,
  XIcon
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
import { Card, CardContent } from '@/components/ui/card'
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
  const [isPending, setIsPending] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get('query') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const canUpdate = hasPermission(userRole, 'promotions.update')
  const canDelete = hasPermission(userRole, 'promotions.delete')

  const updateURL = (updates: { query?: string; sort?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    params.set('page', '1')
    
    setIsPending(true)
    router.push(`/admin/promotions?${params.toString()}`)
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      updateURL({ query: value })
    }, 500)
  }

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    updateURL({ sort: newSort })
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    updateURL({ status: newStatus })
  }

  const clearAllFilters = () => {
    setSearchValue('')
    setSort('latest')
    setStatus('all')
    router.push('/admin/promotions')
  }

  useEffect(() => {
    setIsPending(false)
  }, [searchParams])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

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

  const activeFiltersCount = 
    (searchValue ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (sort !== 'latest' ? 1 : 0)

  return (
    <div className='space-y-6'>
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-4">
          <div className='flex flex-wrap items-center gap-4 mb-4'>
            <div className="flex-1 min-w-[300px] relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by code or name..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Clear All
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div>
              {isPending ? (
                <span>Loading...</span>
              ) : (
                <span>
                  {totalPromotions === 0 ? 'No' : `${totalPromotions}`}
                  {totalPromotions === 1 ? ' promotion' : ' promotions'}
                </span>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sort By
              </label>
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='latest'>Latest First</SelectItem>
                  <SelectItem value='oldest'>Oldest First</SelectItem>
                  <SelectItem value='name'>Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
