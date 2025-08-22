'use client'

import { useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { setProductStock, adjustProductStock } from '@/lib/actions/inventory.actions'
import { IInventoryProduct } from '@/types'
import { Package, Plus, Minus } from 'lucide-react'

const setStockSchema = z.object({
  newQuantity: z.coerce.number().int().nonnegative('Quantity must be non-negative'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

const adjustStockSchema = z.object({
  adjustment: z.coerce.number().int(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

type SetStockForm = z.infer<typeof setStockSchema>
type AdjustStockForm = z.infer<typeof adjustStockSchema>

interface StockAdjustmentDialogProps {
  product: IInventoryProduct
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function StockAdjustmentDialog({
  product,
  open,
  onOpenChange,
}: StockAdjustmentDialogProps) {
  const [activeTab, setActiveTab] = useState('set')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const setStockForm = useForm<SetStockForm>({
    resolver: zodResolver(setStockSchema),
    defaultValues: {
      newQuantity: product.countInStock,
      reason: '',
      notes: '',
    },
  })

  const adjustStockForm = useForm<AdjustStockForm>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      adjustment: 0,
      reason: '',
      notes: '',
    },
  })

  const onSetStock = async (data: SetStockForm) => {
    startTransition(async () => {
      const result = await setProductStock({
        productId: product._id,
        newQuantity: data.newQuantity,
        reason: data.reason,
        notes: data.notes,
      })

      if (result.success) {
        toast({
          description: result.message,
        })
        onOpenChange(false)
        setStockForm.reset()
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    })
  }

  const onAdjustStock = async (data: AdjustStockForm) => {
    startTransition(async () => {
      const result = await adjustProductStock({
        productId: product._id,
        adjustment: data.adjustment,
        reason: data.reason,
        notes: data.notes,
      })

      if (result.success) {
        toast({
          description: result.message,
        })
        onOpenChange(false)
        adjustStockForm.reset()
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    })
  }

  const quickAdjustments = [
    { label: '+1', value: 1 },
    { label: '+5', value: 5 },
    { label: '+10', value: 10 },
    { label: '-1', value: -1 },
    { label: '-5', value: -5 },
    { label: '-10', value: -10 },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Stock Adjustment
          </DialogTitle>
          <DialogDescription>
            Adjust stock for {product.name}
          </DialogDescription>
        </DialogHeader>

        {/* Product Info */}
        <div className='bg-muted p-3 rounded-lg space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium'>SKU:</span>
            <Badge variant='outline'>{product.sku}</Badge>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium'>Current Stock:</span>
            <Badge variant='default'>{product.countInStock}</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='set'>Set Stock</TabsTrigger>
            <TabsTrigger value='adjust'>Adjust Stock</TabsTrigger>
          </TabsList>

          <TabsContent value='set' className='space-y-4'>
            <Form {...setStockForm}>
              <form onSubmit={setStockForm.handleSubmit(onSetStock)} className='space-y-4'>
                <FormField
                  control={setStockForm.control}
                  name='newQuantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          placeholder='Enter new stock quantity'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={setStockForm.control}
                  name='reason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., Stock count correction' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={setStockForm.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Additional notes...'
                          className='resize-none'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type='submit' className='w-full' disabled={isPending}>
                  {isPending ? 'Updating...' : 'Set Stock'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value='adjust' className='space-y-4'>
            <Form {...adjustStockForm}>
              <form onSubmit={adjustStockForm.handleSubmit(onAdjustStock)} className='space-y-4'>
                <FormField
                  control={adjustStockForm.control}
                  name='adjustment'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustment</FormLabel>
                      <FormControl>
                        <div className='space-y-2'>
                          <Input
                            type='number'
                            placeholder='Enter adjustment (+/-)'
                            {...field}
                          />
                          <div className='grid grid-cols-3 gap-2'>
                            {quickAdjustments.map((adj) => (
                              <Button
                                key={adj.value}
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => field.onChange(adj.value)}
                                className='text-xs'
                              >
                                {adj.value > 0 ? <Plus className='w-3 h-3 mr-1' /> : <Minus className='w-3 h-3 mr-1' />}
                                {Math.abs(adj.value)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adjustStockForm.control}
                  name='reason'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., Received shipment' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adjustStockForm.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Additional notes...'
                          className='resize-none'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type='submit' className='w-full' disabled={isPending}>
                  {isPending ? 'Updating...' : 'Adjust Stock'}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
