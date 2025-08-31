'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Loader2 } from 'lucide-react'
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
  PromotionInputSchema, 
  PromotionUpdateSchema 
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
    resolver:
      type === 'Update'
        ? zodResolver(PromotionUpdateSchema)
        : zodResolver(PromotionInputSchema),
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

  const onSubmit = (data: IPromotionInput) => {
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
      <div className='flex items-center justify-between'>
        <h1 className='h1-bold'>
          {type} Promotion
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
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
              <CardTitle>Discount Configuration</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            min={watchedType === 'percentage' ? 1 : 0}
                            max={watchedType === 'percentage' ? 100 : undefined}
                            step={watchedType === 'percentage' ? 1 : 0.01}
                            placeholder={watchedType === 'percentage' ? '20' : '10.00'}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
              <CardTitle>Validity Period</CardTitle>
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
              <CardTitle>Usage Limits</CardTitle>
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
              <CardTitle>Application Scope</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
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
                        <SelectItem value='all'>All Products</SelectItem>
                        <SelectItem value='products'>Specific Products</SelectItem>
                        <SelectItem value='categories'>Specific Categories</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedAppliesTo === 'products' && (
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

          {/* Submit Button */}
          <div className='flex justify-end space-x-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {type} Promotion
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
