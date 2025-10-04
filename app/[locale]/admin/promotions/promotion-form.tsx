'use client'

import { useTransition, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Tag, Percent, Clock, Users, Target, Sparkles, DollarSign, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  maxDiscountAmount: 0,
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
              ? promotion.applicableProducts.map((p: string | { _id: string }) => typeof p === 'string' ? p : p._id)
              : [],
            applicableCategories: Array.isArray(promotion.applicableCategories)
              ? promotion.applicableCategories.map((c: string | { _id: string }) => typeof c === 'string' ? c : c._id)
              : [],
          }
        : promotionDefaultValues,
  })

  const watchedType = form.watch('type')
  const watchedAppliesTo = form.watch('appliesTo')
  const watchedValue = form.watch('value')
  const watchedMinOrderValue = form.watch('minOrderValue')
  const watchedMaxDiscountAmount = form.watch('maxDiscountAmount')
  const watchedCode = form.watch('code')

  // Code availability check
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)

  // Generate random code
  const generateCode = () => {
    const patterns = [
      () => `SAVE${Math.floor(Math.random() * 100)}`,
      () => `${['SUMMER', 'WINTER', 'SPRING', 'FALL'][Math.floor(Math.random() * 4)]}${new Date().getFullYear() % 100}`,
      () => `NEW${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      () => `DEAL${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      () => `OFF${Math.floor(Math.random() * 50) + 10}`,
    ]
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]
    const code = pattern()
    form.setValue('code', code, { shouldValidate: true })
  }

  // Check code availability (debounced)
  useEffect(() => {
    if (!watchedCode || watchedCode.length < 3) {
      setCodeAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingCode(true)
      try {
        // TODO: Add actual API call to check code availability
        // For now, just simulate check
        await new Promise(resolve => setTimeout(resolve, 300))
        setCodeAvailable(true)
      } catch {
        setCodeAvailable(false)
      } finally {
        setCheckingCode(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [watchedCode])

  // Calculate discount preview
  const calculatePreview = () => {
    const sampleAmount = 100 // Sample order amount
    let discount = 0

    if (watchedType === 'percentage') {
      discount = (sampleAmount * watchedValue) / 100
    } else if (watchedType === 'fixed') {
      discount = watchedValue
    } else if (watchedType === 'free_shipping') {
      return { original: sampleAmount, discount: 0, final: sampleAmount, freeShipping: true }
    }

    // Apply max discount cap if set
    if (watchedMaxDiscountAmount > 0 && discount > watchedMaxDiscountAmount) {
      discount = watchedMaxDiscountAmount
    }

    return {
      original: sampleAmount,
      discount,
      final: Math.max(0, sampleAmount - discount),
      freeShipping: false
    }
  }

  // Keep value aligned with type-specific rules via effects to avoid render-set loops
  useEffect(() => {
    if (watchedType === 'free_shipping') {
      form.setValue('value', 0, { shouldValidate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedType])
  useEffect(() => {
    if (watchedType === 'percentage' && typeof watchedValue === 'number') {
      const clamped = Math.max(1, Math.min(100, Math.round(watchedValue)))
      if (clamped !== watchedValue) {
        form.setValue('value', clamped, { shouldValidate: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedType, watchedValue])

  const onSubmit = (data: IPromotionInput) => {
    // Client-side business checks for better UX before server
    let hasClientError = false
    if (!(data.endDate > data.startDate)) {
      form.setError('endDate', { message: 'End date must be after start date' })
      hasClientError = true
    } else if (data.endDate.getTime() - data.startDate.getTime() < 60_000) {
      form.setError('endDate', { message: 'Promotion period must be at least 1 minute long' })
      hasClientError = true
    }

    if (data.type === 'percentage' && (data.value < 1 || data.value > 100)) {
      form.setError('value', { message: 'Percentage must be between 1 and 100' })
      hasClientError = true
    }
    if (data.type === 'fixed' && data.value <= 0) {
      form.setError('value', { message: 'Fixed amount must be greater than 0' })
      hasClientError = true
    }
    if (data.type === 'free_shipping' && data.value !== 0) {
      form.setValue('value', 0)
    }
    if (data.appliesTo === 'products' && (!data.applicableProducts || data.applicableProducts.length === 0)) {
      form.setError('applicableProducts', { message: 'Select at least one product' })
      hasClientError = true
    }
    if (data.appliesTo === 'categories' && (!data.applicableCategories || data.applicableCategories.length === 0)) {
      form.setError('applicableCategories', { message: 'Select at least one category' })
      hasClientError = true
    }
    if (data.type === 'fixed' && data.minOrderValue > 0 && data.minOrderValue < data.value) {
      form.setError('minOrderValue', { message: 'Minimum order must be ≥ discount amount' })
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
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder='SAVE20'
                            {...field}
                            className='font-mono uppercase'
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={generateCode}
                          className="shrink-0"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                      <FormDescription className="flex items-center gap-2">
                        {checkingCode && (
                          <span className="text-xs text-muted-foreground">Checking...</span>
                        )}
                        {!checkingCode && codeAvailable === true && watchedCode && watchedCode.length >= 3 && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Code available
                          </span>
                        )}
                        {!checkingCode && codeAvailable === false && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Code already exists
                          </span>
                        )}
                        <span className={codeAvailable !== null ? "text-muted-foreground" : ""}>
                          {codeAvailable === null ? "Unique code customers will use (automatically converted to uppercase)" : ""}
                        </span>
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
                          {watchedType === 'percentage' ? 'Percentage (1-100)' : 'Amount'}
                        </FormLabel>
                        <FormControl>
                          {watchedType === 'fixed' ? (
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type='number'
                                min={0.01}
                                step={0.01}
                                placeholder='10.00'
                                className="pl-9"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const num = Number(e.target.value)
                                  if (Number.isNaN(num)) return field.onChange(0)
                                  field.onChange(num)
                                }}
                              />
                            </div>
                          ) : (
                            <Input
                              type='number'
                              min={1}
                              max={100}
                              step={1}
                              placeholder='20'
                              value={field.value || ''}
                              onChange={(e) => {
                                const num = Number(e.target.value)
                                if (Number.isNaN(num)) return field.onChange(0)
                                field.onChange(num)
                              }}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Max Discount Cap - Only for percentage and free shipping */}
              {(watchedType === 'percentage' || watchedType === 'free_shipping') && (
                <FormField
                  control={form.control}
                  name='maxDiscountAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Discount Cap (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type='number'
                            min={0}
                            step={0.01}
                            placeholder='0.00'
                            className="pl-9"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Cap the maximum discount at this amount (0 = no cap). Prevents excessive discounts on expensive orders.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Live Preview */}
              {watchedValue > 0 && watchedType !== 'free_shipping' && (
                <Card className="bg-muted/30 border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Discount Preview (on $100 order)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Original:</span>
                      <span className="font-medium">${calculatePreview().original.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">Discount:</span>
                      <span className="text-green-600 font-bold">-${calculatePreview().discount.toFixed(2)}</span>
                    </div>
                    {watchedMaxDiscountAmount > 0 && calculatePreview().discount >= watchedMaxDiscountAmount && (
                      <div className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 dark:bg-amber-950 p-2 rounded">
                        ⚠️ Capped at ${watchedMaxDiscountAmount.toFixed(2)}
                      </div>
                    )}
                    <div className="flex justify-between text-base pt-2 border-t">
                      <span className="font-semibold">Final Price:</span>
                      <span className="font-bold text-primary">${calculatePreview().final.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {watchedType === 'free_shipping' && (
                <Card className="bg-muted/30 border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Free shipping will be applied at checkout</span>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                Advanced Usage Limits (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span className="text-sm font-medium">Configure Limits</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
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
                </CollapsibleContent>
              </Collapsible>
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
