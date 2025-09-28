'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Loader2, Tag, Percent, DollarSign, Truck, Clock, Users, ShoppingCart, Target, Settings } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { 
  PromotionInputSchema
} from '@/lib/validator'
import { 
  createPromotion, 
  updatePromotion 
} from '@/lib/actions/promotion.actions'
import { IPromotionInput, IPromotionDetails } from '@/types'
import ProductSelector from './components/product-selector'
import CategorySelector from './components/category-selector'

const promotionDefaultValues: IPromotionInput = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: 0,
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  active: true,
  minOrderValue: 0,
  usageLimit: 0,
  userUsageLimit: 0,
  appliesTo: 'all',
  applicableProducts: [],
  applicableCategories: [],
}

interface PromotionFormProps {
  type: 'Create' | 'Update'
  promotion?: IPromotionDetails
  promotionId?: string
}

export default function PromotionForm({
  type,
  promotion,
  promotionId,
}: PromotionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const form = useForm<IPromotionInput>({
    resolver: zodResolver(PromotionInputSchema),
    defaultValues:
      promotion && type === 'Update'
        ? {
            ...promotion,
            startDate: new Date(promotion.startDate),
            endDate: new Date(promotion.endDate),
            // Transform populated objects back to IDs for form compatibility
            applicableProducts: Array.isArray(promotion.applicableProducts)
              ? promotion.applicableProducts.map((p: any) => typeof p === 'string' ? p : p._id)
              : [],
            applicableCategories: Array.isArray(promotion.applicableCategories)
              ? promotion.applicableCategories.map((c: any) => typeof c === 'string' ? c : c._id)
              : [],
          }
        : promotionDefaultValues,
  })

  const watchedType = form.watch('type')
  const watchedAppliesTo = form.watch('appliesTo')
  const watchedValue = form.watch('value')
  const watchedStart = form.watch('startDate')
  const watchedEnd = form.watch('endDate')

  // Keep value aligned with type-specific rules via effects to avoid render-set loops
  useEffect(() => {
    if (watchedType === 'free_shipping') {
      form.setValue('value', 0, { shouldValidate: true })
    }
  }, [watchedType])
  useEffect(() => {
    if (watchedType === 'percentage' && typeof watchedValue === 'number') {
      const clamped = Math.max(1, Math.min(100, Math.round(watchedValue)))
      if (clamped !== watchedValue) {
        form.setValue('value', clamped, { shouldValidate: true })
      }
    }
  }, [watchedType, watchedValue])

  const onSubmit = (data: IPromotionInput) => {
    // Client-side business checks for better UX before server
    let hasClientError = false
    if (!(data.endDate > data.startDate)) {
      form.setError('endDate' as any, { message: 'End date must be after start date' })
      hasClientError = true
    } else if (data.endDate.getTime() - data.startDate.getTime() < 60_000) {
      form.setError('endDate' as any, { message: 'Promotion period must be at least 1 minute long' })
      hasClientError = true
    }

    if (data.type === 'percentage' && (data.value < 1 || data.value > 100)) {
      form.setError('value' as any, { message: 'Percentage must be between 1 and 100' })
      hasClientError = true
    }
    if (data.type === 'fixed' && data.value <= 0) {
      form.setError('value' as any, { message: 'Fixed amount must be greater than 0' })
      hasClientError = true
    }
    if (data.type === 'free_shipping' && data.value !== 0) {
      form.setValue('value', 0)
    }
    if (data.appliesTo === 'products' && (!data.applicableProducts || data.applicableProducts.length === 0)) {
      form.setError('applicableProducts' as any, { message: 'Select at least one product' })
      hasClientError = true
    }
    if (data.appliesTo === 'categories' && (!data.applicableCategories || data.applicableCategories.length === 0)) {
      form.setError('applicableCategories' as any, { message: 'Select at least one category' })
      hasClientError = true
    }
    if (data.type === 'fixed' && data.minOrderValue > 0 && data.minOrderValue < data.value) {
      form.setError('minOrderValue' as any, { message: 'Minimum order must be ≥ discount amount' })
      hasClientError = true
    }
    if (hasClientError) return

    startTransition(async () => {
      const res =
        type === 'Update'
          ? await updatePromotion({ ...data, _id: promotionId! })
          : await createPromotion(data)

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push('/admin/promotions')
      }
    })
  }

  return (
    <div className='space-y-6'>
      {/* Professional Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950">
              <Tag className="h-4 w-4 text-purple-600" />
            </div>
            Promotion Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <h3 className='text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2'>
              Checkout-Level Promotions
            </h3>
            <p className='text-sm text-blue-800 dark:text-blue-200'>
              Promotions are discount codes that customers enter at checkout to receive discounts on their entire order or specific products/categories.
              These are different from product-level sales, which are time-limited price reductions managed in the product settings.
            </p>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                  <Tag className="h-4 w-4 text-blue-600" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotion Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='SAVE20'
                          {...field}
                          className='font-mono uppercase'
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique code customers will use (automatically converted to uppercase)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder='20% Off Summer Sale' {...field} />
                      </FormControl>
                      <FormDescription>
                        Internal name for this promotion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Special summer promotion for all products...'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='active'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>Active</FormLabel>
                      <FormDescription>
                        Enable or disable this promotion
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Discount Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-950">
                  <Percent className="h-4 w-4 text-green-600" />
                </div>
                Discount Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select discount type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='percentage'>Percentage Off</SelectItem>
                          <SelectItem value='fixed'>Fixed Amount Off</SelectItem>
                          <SelectItem value='free_shipping'>Free Shipping</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedType !== 'free_shipping' && (
                  <FormField
                    control={form.control}
                    name='value'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchedType === 'percentage' ? 'Percentage (1-100)' : 'Amount ($)'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={watchedType === 'percentage' ? 1 : 0.01}
                            max={watchedType === 'percentage' ? 100 : undefined}
                            step={watchedType === 'percentage' ? 1 : 0.01}
                            placeholder={watchedType === 'percentage' ? '20' : '10.00'}
                            {...field}
                            onChange={(e) => {
                              const num = Number(e.target.value)
                              if (Number.isNaN(num)) return field.onChange(0)
                              field.onChange(num)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='endDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < form.getValues('startDate')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Usage Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950">
                  <Users className="h-4 w-4 text-rose-600" />
                </div>
                Usage Limits
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <FormField
                  control={form.control}
                  name='minOrderValue'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Value ($)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          step={0.01}
                          placeholder='0.00'
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        0 = No minimum required
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='usageLimit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Usage Limit</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        0 = Unlimited usage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='userUsageLimit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per-User Limit</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        0 = No per-user limit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Application Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950">
                  <Target className="h-4 w-4 text-indigo-600" />
                </div>
                Application Scope
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md'>
                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                  <strong>Note:</strong> All promotions require customers to enter the coupon code at checkout to receive the discount.
                </p>
              </div>

              <FormField
                control={form.control}
                name='appliesTo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applies To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select application scope' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='all'>All Products - Applied to entire order when coupon is used</SelectItem>
                        <SelectItem value='products'>Specific Products - Applied only to selected products when coupon is used</SelectItem>
                        <SelectItem value='categories'>Specific Categories - Applied only to products in selected categories when coupon is used</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which products this promotion applies to when customers use the coupon code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedAppliesTo === 'products' && (
                <>
                  <div className='p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md'>
                    <p className='text-sm text-orange-800 dark:text-orange-200'>
                      <strong>Product-Specific Promotion:</strong> This promotion will only apply to the selected products when customers enter the coupon code at checkout.
                      Consider using product-level sales instead if you want automatic discounts without requiring coupon codes.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name='applicableProducts'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Products</FormLabel>
                        <FormControl>
                          <ProductSelector
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {watchedAppliesTo === 'categories' && (
                <FormField
                  control={form.control}
                  name='applicableCategories'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Categories</FormLabel>
                      <FormControl>
                        <CategorySelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      {type === 'Create' ? 'Creating promotion...' : 'Updating promotion...'}
                    </span>
                  ) : (
                    'Review all information before saving the promotion'
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.back()}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="min-w-[140px]"
                  >
                    {isPending ? (type === 'Create' ? 'Creating...' : 'Updating...') : `${type} Promotion`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
