'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { IProduct } from '@/lib/db/models/product.model'
import { createManualOrder } from '@/lib/actions/order.actions'
import { Plus, Minus, X } from 'lucide-react'
import Image from 'next/image'

// Simple schema for manual order creation
const ManualOrderSchema = z.object({
  // Customer Info
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  customerPhone: z.string().min(1, 'Phone number is required'),

  // Shipping Address
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),

  // Payment
  paymentMethod: z.string().min(1, 'Payment method is required'),
  isPaid: z.boolean().default(false),

  // Notes
  notes: z.string().optional(),
})

type ManualOrderForm = z.infer<typeof ManualOrderSchema>

interface OrderItem {
  product: IProduct
  quantity: number
}

interface Props {
  products: IProduct[]
}

export default function OrderCreateForm({ products }: Props) {
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<ManualOrderForm>({
    resolver: zodResolver(ManualOrderSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      fullName: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      paymentMethod: 'cash',
      isPaid: false,
      notes: '',
    },
  })

  const addProduct = (productId: string) => {
    const product = products.find(p => p._id === productId)
    if (!product) return

    const existingItem = selectedItems.find(item => item.product._id === productId)
    if (existingItem) {
      // Increase quantity
      updateQuantity(productId, existingItem.quantity + 1)
    } else {
      // Add new item
      setSelectedItems([...selectedItems, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
      return
    }

    const product = products.find(p => p._id === productId)
    if (product && newQuantity > product.countInStock) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${product.countInStock} items available`,
        variant: 'destructive',
      })
      return
    }

    setSelectedItems(items =>
      items.map(item =>
        item.product._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const removeItem = (productId: string) => {
    setSelectedItems(items => items.filter(item => item.product._id !== productId))
  }

  const calculateTotals = () => {
    const itemsPrice = selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const shippingPrice = itemsPrice >= 100 ? 0 : 5 // Free shipping over $100
    const taxPrice = itemsPrice * 0.1 // 10% tax
    const totalPrice = itemsPrice + shippingPrice + taxPrice

    return { itemsPrice, shippingPrice, taxPrice, totalPrice }
  }

  const onSubmit = async (data: ManualOrderForm) => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No Products Selected',
        description: 'Please add at least one product to the order',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculateTotals()

      const orderData = {
        customerInfo: {
          name: data.customerName,
          email: data.customerEmail || '',
          phone: data.customerPhone,
        },
        items: selectedItems.map(item => ({
          product: item.product._id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images[0] || '/images/placeholder.jpg',
          category: typeof item.product.category === 'object' ? (item.product.category as unknown as { name: string }).name : item.product.category,
          price: item.product.price,
          quantity: item.quantity,
          countInStock: item.product.countInStock,
        })),
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          country: 'Cambodia',
        },
        paymentMethod: data.paymentMethod,
        isPaid: data.isPaid,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        notes: data.notes,
      }

      const result = await createManualOrder(orderData)

      if (result.success) {
        toast({
          title: 'Order Created',
          description: 'Order has been created successfully',
        })

        // Reset form and items
        form.reset()
        setSelectedItems([])
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create order',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculateTotals()

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                {...form.register('customerName')}
                placeholder="Enter customer name"
              />
              {form.formState.errors.customerName && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.customerName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                {...form.register('customerEmail')}
                placeholder="customer@example.com (optional)"
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                {...form.register('customerPhone')}
                placeholder="Enter phone number"
              />
              {form.formState.errors.customerPhone && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.customerPhone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                {...form.register('fullName')}
                placeholder="Recipient full name"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="Recipient phone"
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                {...form.register('address')}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  {...form.register('postalCode')}
                  placeholder="Postal code"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Add Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={addProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product to add" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      <Badge variant="outline">${product.price}</Badge>
                      <Badge variant={product.countInStock > 0 ? "default" : "destructive"}>
                        Stock: {product.countInStock}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Products:</h4>
                {selectedItems.map((item) => (
                  <div key={item.product._id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Image
                      src={item.product.images[0] || '/images/placeholder.jpg'}
                      alt={item.product.name}
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">${item.product.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.product._id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select onValueChange={(value) => form.setValue('paymentMethod', value)} defaultValue="cash">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash on Delivery</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="aba-payway">ABA PayWay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPaid"
                {...form.register('isPaid')}
                className="w-4 h-4"
              />
              <Label htmlFor="isPaid">Order is already paid</Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Additional notes or special instructions"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Items ({selectedItems.length}):</span>
              <span>${itemsPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${shippingPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%):</span>
              <span>${taxPrice.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>

            <Button
              type="submit"
              className="w-full mt-4"
              disabled={isLoading || selectedItems.length === 0}
            >
              {isLoading ? 'Creating Order...' : 'Create Order'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}