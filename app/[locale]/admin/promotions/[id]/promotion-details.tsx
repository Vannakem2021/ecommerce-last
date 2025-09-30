'use client'

import Link from 'next/link'
import { 
  Edit, 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Package,
  Layers,
  Percent,
  Truck
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDateTime } from '@/lib/utils'
import { IPromotionDetails } from '@/types'
import { hasPermission } from '@/lib/rbac-utils'

interface PromotionDetailsProps {
  promotion: IPromotionDetails
  usageStats: {
    totalUsage: number
    totalDiscountGiven: number
    averageDiscount: number
    uniqueUserCount: number
  }
  userRole: string
}

export default function PromotionDetails({
  promotion,
  usageStats,
  userRole,
}: PromotionDetailsProps) {
  const canUpdate = hasPermission(userRole, 'promotions.update')

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-5 w-5" />
      case 'fixed':
        return <DollarSign className="h-5 w-5" />
      case 'free_shipping':
        return <Truck className="h-5 w-5" />
      default:
        return <Percent className="h-5 w-5" />
    }
  }

  const getPromotionValue = () => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}%`
    } else if (promotion.type === 'fixed') {
      return `$${promotion.value}`
    } else {
      return 'Free Shipping'
    }
  }

  const isPromotionActive = () => {
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
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/admin/promotions'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Promotions
            </Link>
          </Button>
          <div>
            <h1 className='h1-bold'>{promotion.name}</h1>
            <p className='text-muted-foreground'>
              Code: <span className='font-mono font-medium'>{promotion.code}</span>
            </p>
          </div>
        </div>
        
        {canUpdate && (
          <Button asChild>
            <Link href={`/admin/promotions/${promotion._id}/edit`}>
              <Edit className='h-4 w-4 mr-2' />
              Edit Promotion
            </Link>
          </Button>
        )}
      </div>

      {/* Status and Basic Info */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Status</CardTitle>
            {getPromotionIcon(promotion.type)}
          </CardHeader>
          <CardContent>
            <Badge 
              variant={isPromotionActive() ? 'default' : 'secondary'}
              className='text-sm'
            >
              {isPromotionActive() ? 'Active' : 'Inactive'}
            </Badge>
            <p className='text-xs text-muted-foreground mt-1'>
              {promotion.type.replace('_', ' ').toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Discount Value</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{getPromotionValue()}</div>
            <p className='text-xs text-muted-foreground'>
              Min. order: ${promotion.minOrderValue}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Usage</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{promotion.usedCount}</div>
            <p className='text-xs text-muted-foreground'>
              {promotion.usageLimit > 0 
                ? `of ${promotion.usageLimit} limit`
                : 'Unlimited'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Unique Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{usageStats.uniqueUserCount}</div>
            <p className='text-xs text-muted-foreground'>
              Total customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Promotion Details */}
        <Card>
          <CardHeader>
            <CardTitle>Promotion Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {promotion.description && (
              <div>
                <h4 className='font-medium mb-2'>Description</h4>
                <p className='text-sm text-muted-foreground'>{promotion.description}</p>
              </div>
            )}

            <Separator />

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h4 className='font-medium mb-2'>Validity Period</h4>
                <div className='space-y-1 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    <span>Start: {formatDateTime(promotion.startDate).dateTime}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    <span>End: {formatDateTime(promotion.endDate).dateTime}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className='font-medium mb-2'>Usage Limits</h4>
                <div className='space-y-1 text-sm'>
                  <div>Total: {promotion.usageLimit || 'Unlimited'}</div>
                  <div>Per User: {promotion.userUsageLimit || 'Unlimited'}</div>
                  <div>Min Order: ${promotion.minOrderValue}</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className='font-medium mb-2'>Application Scope</h4>
              <div className='flex items-center gap-2 text-sm'>
                {promotion.appliesTo === 'all' && (
                  <>
                    <Package className='h-4 w-4' />
                    <span>All Products</span>
                  </>
                )}
                {promotion.appliesTo === 'products' && (
                  <>
                    <Package className='h-4 w-4' />
                    <span>{promotion.applicableProducts?.length || 0} Specific Products</span>
                  </>
                )}
                {promotion.appliesTo === 'categories' && (
                  <>
                    <Layers className='h-4 w-4' />
                    <span>{promotion.applicableCategories?.length || 0} Categories</span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>Created by:</span>
                <div className='font-medium'>{promotion.createdBy?.name || 'Unknown'}</div>
              </div>
              <div>
                <span className='text-muted-foreground'>Created:</span>
                <div className='font-medium'>{formatDateTime(promotion.createdAt).dateTime}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  ${usageStats.totalDiscountGiven.toFixed(2)}
                </div>
                <div className='text-sm text-muted-foreground'>Total Discount Given</div>
              </div>
              
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>
                  ${usageStats.averageDiscount.toFixed(2)}
                </div>
                <div className='text-sm text-muted-foreground'>Average Discount</div>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Total Uses:</span>
                <span className='font-medium'>{usageStats.totalUsage}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Unique Customers:</span>
                <span className='font-medium'>{usageStats.uniqueUserCount}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Avg. Uses per Customer:</span>
                <span className='font-medium'>
                  {usageStats.uniqueUserCount > 0 
                    ? (usageStats.totalUsage / usageStats.uniqueUserCount).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
            </div>

            {promotion.usageLimit > 0 && (
              <>
                <Separator />
                <div>
                  <div className='flex justify-between text-sm mb-2'>
                    <span>Usage Progress</span>
                    <span>{promotion.usedCount} / {promotion.usageLimit}</span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div 
                      className='bg-primary h-2 rounded-full transition-all'
                      style={{ 
                        width: `${Math.min((promotion.usedCount / promotion.usageLimit) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Applicable Products/Categories */}
      {(promotion.appliesTo === 'products' || promotion.appliesTo === 'categories') && (
        <Card>
          <CardHeader>
            <CardTitle>
              {promotion.appliesTo === 'products' ? 'Applicable Products' : 'Applicable Categories'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {promotion.appliesTo === 'products' && promotion.applicableProducts && (
              <div className='text-sm text-muted-foreground'>
                {promotion.applicableProducts.length} products selected
              </div>
            )}

            {promotion.appliesTo === 'categories' && promotion.applicableCategories && (
              <div className='text-sm text-muted-foreground'>
                {promotion.applicableCategories.length} categories selected
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
