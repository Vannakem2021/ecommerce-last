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
import { Form } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { IProduct } from '@/lib/db/models/product.model'
import { createManualOrder } from '@/lib/actions/order.actions'
import { Plus, Minus, X, Calendar, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { CambodiaAddressForm } from '@/components/shared/address/cambodia-address-form'
import { CambodiaAddressSchema } from '@/lib/validator'
import { formatDateTime, calculateFutureDate } from '@/lib/utils'
import useSettingStore from '@/hooks/use-setting-store'

// Schema for manual order creation with Cambodia address
const ManualOrderSchema = z.object({
  // Customer Info
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  customerPhone: z.string().min(1, 'Phone number is required'),

  // Shipping Address (Cambodia format)
  shippingAddress: CambodiaAddressSchema,

  // Delivery
  useCustomDelivery: z.boolean().default(false),
  deliveryDateIndex: z.number().optional(),
  customDeliveryDate: z.string().optional(),
  customShippingPrice: z.number().optional(),

  // Payment
  paymentMethod: z.string().min(1, 'Payment method is required'),
  isPaid: z.boolean().default(false),

  // Notes
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate delivery based on custom delivery flag
  if (data.useCustomDelivery) {
    if (!data.customDeliveryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom delivery date is required',
        path: ['customDeliveryDate'],
      })
    }
    if (data.customShippingPrice === undefined || data.customShippingPrice < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom shipping price is required and must be 0 or greater',
        path: ['customShippingPrice'],
      })
    }
  } else {
    if (data.deliveryDateIndex === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a delivery date',
        path: ['deliveryDateIndex'],
      })
    }
  }
})

type ManualOrderForm = z.infer<typeof ManualOrderSchema>

interface OrderItem {
  product: IProduct
  quantity: number
  color?: string
  size?: string
}

interface Props {
  products: IProduct[]
}

// Product Selector with variant support
function ProductSelector({ 
  products, 
  onAddProduct 
}: { 
  products: IProduct[]
  onAddProduct: (productId: string, color?: string, size?: string) => void
}) {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')

  const selectedProduct = products.find(p => p._id === selectedProductId)

  const handleAddProduct = () => {
    if (!selectedProductId) return
    
    onAddProduct(selectedProductId, selectedColor || undefined, selectedSize || undefined)
    
    // Reset selections
    setSelectedProductId('')
    setSelectedColor('')
    setSelectedSize('')
  }

  const hasVariants = selectedProduct && (
    (selectedProduct.colors && selectedProduct.colors.length > 0) ||
    (selectedProduct.sizes && selectedProduct.sizes.length > 0)
  )

  return (
    <div className="space-y-3">
      {/* Product Selection */}
      <div>
        <Label>Select Product</Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a product" />
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
      </div>

      {/* Variant Selection */}
      {selectedProduct && hasVariants && (
        <div className="grid grid-cols-2 gap-3">
          {/* Color Selection */}
          {selectedProduct.colors && selectedProduct.colors.length > 0 && (
            <div>
              <Label>Color</Label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Size Selection */}
          {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
            <div>
              <Label>Size</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Add Button */}
      <Button
        type="button"
        onClick={handleAddProduct}
        disabled={!selectedProductId || (selectedProduct && selectedProduct.countInStock === 0)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add to Order
      </Button>
    </div>
  )
}

export default function OrderCreateForm({ products }: Props) {
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { setting } = useSettingStore()
  
  // Safely access settings with defaults
  const availableDeliveryDates = setting?.availableDeliveryDates || []
  const availablePaymentMethods = setting?.availablePaymentMethods || []

  const form = useForm<ManualOrderForm>({
    resolver: zodResolver(ManualOrderSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      shippingAddress: {
        fullName: '',
        phone: '',
        provinceId: undefined,
        districtId: undefined,
        communeCode: '',
        houseNumber: '',
        street: '',
        postalCode: '',
        provinceName: '',
        districtName: '',
        communeName: '',
      },
      useCustomDelivery: false,
      deliveryDateIndex: 0,
      customDeliveryDate: '',
      customShippingPrice: 0,
      paymentMethod: availablePaymentMethods[0]?.name || 'Cash On Delivery',
      isPaid: false,
      notes: '',
    },
  })

  const addProduct = (productId: string, color?: string, size?: string) => {
    const product = products.find(p => p._id === productId)
    if (!product) return

    // Check if item with same product, color, and size exists
    const existingItem = selectedItems.find(
      item => 
        item.product._id === productId && 
        item.color === color && 
        item.size === size
    )
    
    if (existingItem) {
      // Increase quantity
      const newQuantity = existingItem.quantity + 1
      if (newQuantity > product.countInStock) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${product.countInStock} items available`,
          variant: 'destructive',
        })
        return
      }
      setSelectedItems(items =>
        items.map(item =>
          item.product._id === productId && item.color === color && item.size === size
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    } else {
      // Add new item
      setSelectedItems([...selectedItems, { product, quantity: 1, color, size }])
    }
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index)
      return
    }

    const item = selectedItems[index]
    const product = item.product
    if (newQuantity > product.countInStock) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${product.countInStock} items available`,
        variant: 'destructive',
      })
      return
    }

    setSelectedItems(items =>
      items.map((item, idx) =>
        idx === index ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeItem = (index: number) => {
    setSelectedItems(items => items.filter((_, idx) => idx !== index))
  }

  const calculateTotals = () => {
    const itemsPrice = selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    
    const useCustomDelivery = form.watch('useCustomDelivery')
    let shippingPrice = 0
    
    if (useCustomDelivery) {
      // Use custom shipping price
      shippingPrice = form.watch('customShippingPrice') || 0
    } else {
      // Get shipping price from selected delivery date
      const deliveryDateIndex = form.watch('deliveryDateIndex') || 0
      const selectedDeliveryDate = availableDeliveryDates[deliveryDateIndex]
      shippingPrice = selectedDeliveryDate?.shippingPrice || 0
      
      // Check for free shipping
      const freeShippingMin = selectedDeliveryDate?.freeShippingMinPrice || 0
      if (freeShippingMin > 0 && itemsPrice >= freeShippingMin) {
        shippingPrice = 0
      }
    }
    
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

    if (!data.useCustomDelivery && availableDeliveryDates.length === 0) {
      toast({
        title: 'Configuration Error',
        description: 'No delivery dates configured. Please contact administrator.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculateTotals()
      
      // Calculate expected delivery date
      let expectedDeliveryDate: Date
      if (data.useCustomDelivery) {
        // Use custom delivery date
        expectedDeliveryDate = new Date(data.customDeliveryDate!)
      } else {
        // Use standard delivery date
        const selectedDeliveryDate = availableDeliveryDates[data.deliveryDateIndex!] || availableDeliveryDates[0]
        expectedDeliveryDate = calculateFutureDate(selectedDeliveryDate.daysToDeliver)
      }

      const orderData = {
        customerInfo: {
          name: data.customerName,
          email: data.customerEmail || '',
          phone: data.customerPhone,
        },
        items: selectedItems.map(item => ({
          product: item.product._id,
          clientId: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: item.product.name,
          slug: item.product.slug,
          sku: item.product.sku,
          image: item.product.images[0] || '/images/placeholder.jpg',
          category: typeof item.product.category === 'object' ? (item.product.category as unknown as { name: string }).name : item.product.category,
          price: item.product.price,
          quantity: item.quantity,
          countInStock: item.product.countInStock,
          color: item.color || '',
          size: item.size || '',
        })),
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
        isPaid: data.isPaid,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        expectedDeliveryDate,
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
  
  // Check if settings are properly configured
  const hasConfigurationIssues = availableDeliveryDates.length === 0 || availablePaymentMethods.length === 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Configuration Warning */}
      {hasConfigurationIssues && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            {availableDeliveryDates.length === 0 && (
              <div>• No delivery dates configured. Please add delivery dates in system settings.</div>
            )}
            {availablePaymentMethods.length === 0 && (
              <div>• No payment methods configured. Please add payment methods in system settings.</div>
            )}
          </AlertDescription>
        </Alert>
      )}

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
          <CardContent>
            <Form {...form}>
              <CambodiaAddressForm
                control={form.control}
                setValue={form.setValue}
                namePrefix="shippingAddress"
              />
            </Form>
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
            <ProductSelector 
              products={products}
              onAddProduct={addProduct}
            />

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Products:</h4>
                {selectedItems.map((item, index) => (
                  <div key={`${item.product._id}-${item.color}-${item.size}-${index}`} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Image
                      src={item.product.images[0] || '/images/placeholder.jpg'}
                      alt={item.product.name}
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>${item.product.price}</span>
                        {item.color && <Badge variant="secondary">{item.color}</Badge>}
                        {item.size && <Badge variant="secondary">{item.size}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
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

      {/* Delivery & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Delivery & Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custom Delivery Toggle */}
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
              <input
                type="checkbox"
                id="useCustomDelivery"
                {...form.register('useCustomDelivery')}
                className="w-4 h-4"
              />
              <Label htmlFor="useCustomDelivery" className="cursor-pointer">
                Use custom delivery date and price
              </Label>
            </div>

            {/* Conditional Rendering based on custom delivery */}
            {!form.watch('useCustomDelivery') ? (
              // Standard Delivery Date Selection
              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Select 
                  onValueChange={(value) => form.setValue('deliveryDateIndex', parseInt(value))} 
                  defaultValue="0"
                  disabled={availableDeliveryDates.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={availableDeliveryDates.length === 0 ? "No delivery dates available" : "Select delivery date"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDeliveryDates.length > 0 ? (
                      availableDeliveryDates.map((date, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{date.name}</span>
                            <Badge variant="outline">
                              {formatDateTime(calculateFutureDate(date.daysToDeliver)).dateOnly}
                            </Badge>
                            {date.shippingPrice > 0 && (
                              <Badge variant="secondary">${date.shippingPrice}</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="-1" disabled>
                        No delivery dates configured
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.deliveryDateIndex && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.deliveryDateIndex.message}
                  </p>
                )}
              </div>
            ) : (
              // Custom Delivery Fields
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div>
                  <Label htmlFor="customDeliveryDate">Custom Delivery Date *</Label>
                  <Input
                    id="customDeliveryDate"
                    type="date"
                    {...form.register('customDeliveryDate')}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                  {form.formState.errors.customDeliveryDate && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.customDeliveryDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customShippingPrice">Custom Shipping Price ($) *</Label>
                  <Input
                    id="customShippingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...form.register('customShippingPrice', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {form.formState.errors.customShippingPrice && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.customShippingPrice.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter 0 for free shipping or custom amount
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select 
                onValueChange={(value) => form.setValue('paymentMethod', value)} 
                defaultValue={availablePaymentMethods[0]?.name || 'Cash On Delivery'}
                disabled={availablePaymentMethods.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={availablePaymentMethods.length === 0 ? "No payment methods available" : "Select payment method"} />
                </SelectTrigger>
                <SelectContent>
                  {availablePaymentMethods.length > 0 ? (
                    availablePaymentMethods.map((method) => (
                      <SelectItem key={method.name} value={method.name}>
                        {method.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default" disabled>
                      No payment methods configured
                    </SelectItem>
                  )}
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