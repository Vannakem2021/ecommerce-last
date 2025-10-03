'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createProduct, updateProduct } from '@/lib/actions/product.actions'
import { getAllActiveBrands } from '@/lib/actions/brand.actions'
import { getAllActiveCategories } from '@/lib/actions/category.actions'
import { IProduct } from '@/lib/db/models/product.model'
import { IBrand } from '@/lib/db/models/brand.model'
import { ICategory } from '@/lib/db/models/category.model'
import { ProductInputSchema, ProductUpdateSchema } from '@/lib/validator'
import { Checkbox } from '@/components/ui/checkbox'
import { toSlug } from '@/lib/utils'
import { IProductInput } from '@/types'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X, Upload, Package, DollarSign, Image as ImageIcon, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

// Reusable Tag Input Component (simple strings)
const TagInput = ({ 
  value = [], 
  onChange, 
  placeholder 
}: { 
  value?: string[]
  onChange: (value: string[]) => void
  placeholder: string 
}) => {
  const [inputValue, setInputValue] = useState('')
  
  const handleAdd = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue])
      setInputValue('')
    }
  }

  const handleRemove = (item: string) => {
    onChange(value.filter((v) => v !== item))
  }

  return (
    <>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((val) => (
            <Badge key={val} variant="secondary" className="text-xs">
              {val}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 ml-1"
                onClick={() => handleRemove(val)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { 
            if (e.key === 'Enter') { 
              e.preventDefault()
              handleAdd()
            } 
          }}
          className="text-sm"
        />
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleAdd} 
          disabled={!inputValue.trim()}
        >
          Add
        </Button>
      </div>
    </>
  )
}

// Predefined values for quick-fill
const STORAGE_PRESETS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB']
const RAM_PRESETS = ['4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB']

// Smart price suggestions based on common patterns
const STORAGE_PRICE_MAP: Record<string, number> = {
  '64GB': 0,
  '128GB': 50,
  '256GB': 100,
  '512GB': 200,
  '1TB': 400,
  '2TB': 800,
}

const RAM_PRICE_MAP: Record<string, number> = {
  '4GB': 0,
  '6GB': 25,
  '8GB': 50,
  '12GB': 100,
  '16GB': 150,
  '32GB': 300,
  '64GB': 600,
}

// Variant Input with Price Modifier Component
const VariantInput = ({ 
  value = [], 
  onChange, 
  placeholder,
  label
}: { 
  value?: { value: string; priceModifier: number }[]
  onChange: (value: { value: string; priceModifier: number }[]) => void
  placeholder: string
  label: string
}) => {
  const [variantValue, setVariantValue] = useState('')
  const [priceModifier, setPriceModifier] = useState('0')
  const { toast } = useToast()
  
  const handleAdd = () => {
    const trimmedValue = variantValue.trim()
    const price = parseFloat(priceModifier)
    
    if (trimmedValue && !value.some(v => v.value === trimmedValue)) {
      onChange([...value, { value: trimmedValue, priceModifier: isNaN(price) ? 0 : price }])
      setVariantValue('')
      setPriceModifier('0')
    }
  }

  const handleRemove = (item: string) => {
    onChange(value.filter((v) => v.value !== item))
  }

  // Quick-fill handler with smart price suggestion
  const handleQuickFill = (presetValue: string) => {
    if (value.some(v => v.value === presetValue)) {
      toast({
        variant: 'destructive',
        description: `${presetValue} already added`,
      })
      return
    }

    // Auto-fill value field
    setVariantValue(presetValue)
    
    // Smart price suggestion
    const priceMap = label === 'Storage' ? STORAGE_PRICE_MAP : RAM_PRICE_MAP
    const suggestedPrice = priceMap[presetValue] || 0
    setPriceModifier(suggestedPrice.toString())

    toast({
      description: `${presetValue} filled with suggested price +$${suggestedPrice}`,
    })
  }

  const presets = label === 'Storage' ? STORAGE_PRESETS : RAM_PRESETS

  return (
    <>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((variant) => (
            <Badge key={variant.value} variant="secondary" className="text-xs">
              {variant.value} | {variant.priceModifier >= 0 ? '+' : ''}${variant.priceModifier}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 ml-1"
                onClick={() => handleRemove(variant.value)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={variantValue}
          onChange={(e) => setVariantValue(e.target.value)}
          className="text-sm flex-1"
        />
        <Input
          type="number"
          placeholder="+$0"
          value={priceModifier}
          onChange={(e) => setPriceModifier(e.target.value)}
          className="text-sm w-20"
          step="0.01"
        />
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleAdd} 
          disabled={!variantValue.trim()}
        >
          Add
        </Button>
      </div>
      
      {/* Quick-fill buttons */}
      <div className="mt-2">
        <p className="text-xs text-muted-foreground mb-1.5">Quick fill:</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickFill(preset)}
              disabled={value.some(v => v.value === preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}

// Smart SKU Generator for Electronics
const generateSKU = (productName: string): string => {
  if (!productName) return ''
  
  // Remove special characters and extra spaces
  let cleaned = productName.toUpperCase().trim()
  
  // Common brand abbreviations for electronics
  const brandMap: Record<string, string> = {
    'IPHONE': 'IPHO',
    'IPAD': 'IPAD',
    'MACBOOK': 'MBPR',
    'AIRPODS': 'APOD',
    'APPLE WATCH': 'APWT',
    'SAMSUNG GALAXY': 'SAMS',
    'GALAXY': 'SAMS',
    'GOOGLE PIXEL': 'GPXL',
    'ONEPLUS': 'ONEP',
    'XIAOMI': 'XIAO',
    'HUAWEI': 'HUAW',
    'OPPO': 'OPPO',
    'SONY': 'SONY',
    'LG': 'LG',
    'DELL': 'DELL',
    'HP': 'HP',
    'LENOVO': 'LENO',
    'ASUS': 'ASUS',
    'ACER': 'ACER',
  }
  
  // Replace known brands with abbreviations
  for (const [brand, abbr] of Object.entries(brandMap)) {
    if (cleaned.includes(brand)) {
      cleaned = cleaned.replace(brand, abbr)
      break
    }
  }
  
  // Extract model numbers, storage, and important info
  const parts = cleaned.split(/\s+/)
  let sku = ''
  
  // Build SKU from significant parts
  for (const part of parts) {
    // Keep important identifiers
    if (
      /^[A-Z]{2,}$/.test(part) || // Brand abbreviations (already processed)
      /\d+/.test(part) || // Numbers (models, storage, etc)
      ['PRO', 'PLUS', 'ULTRA', 'MAX', 'MINI', 'AIR', 'SE'].includes(part) // Model variants
    ) {
      sku += part
    }
  }
  
  // Fallback: if SKU is too short, use initials
  if (sku.length < 4) {
    sku = parts
      .filter(p => p.length > 2)
      .map(p => p.substring(0, 3))
      .join('')
      .substring(0, 12)
  }
  
  // Limit length and ensure uppercase
  return sku.substring(0, 16).toUpperCase()
}

const productDefaultValues: IProductInput = {
  name: '',
  slug: '',
  sku: '',
  category: '',
  images: [],
  brand: '',
  description: '',
  price: 0,
  listPrice: 0,
  countInStock: 0,
  numReviews: 0,
  avgRating: 0,
  numSales: 0,
  isPublished: false,
  tags: [],
  sizes: [],
  colors: [],
  ratingDistribution: [],
  reviews: [],
  saleStartDate: undefined,
  saleEndDate: undefined,
  secondHand: false,
  condition: undefined,
  variants: {
    storage: [],
    ram: [],
    colors: []
  },
}

const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: 'Create' | 'Update'
  product?: IProduct
  productId?: string
}) => {
  const router = useRouter()
  const [brands, setBrands] = useState<IBrand[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [variantsCollapsed, setVariantsCollapsed] = useState(false)

  const form = useForm<IProductInput>({
    resolver:
      type === 'Update'
        ? zodResolver(ProductUpdateSchema)
        : zodResolver(ProductInputSchema),
    defaultValues:
      product && type === 'Update'
        ? {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            category: typeof product.category === 'object' ? (product.category as unknown as { _id: string })._id : product.category,
            countInStock: product.countInStock,
            price: product.price,
            description: product.description,
            sku: product.sku,
            images: product.images,
            brand: typeof product.brand === 'object' ? (product.brand as unknown as { _id: string })._id : product.brand,
            listPrice: product.listPrice,
            tags: product.tags || [],
            colors: product.colors || [],
            sizes: product.sizes || [],
            variants: product.variants || {
              storage: [],
              ram: [],
              colors: []
            },
            avgRating: product.avgRating || 0,
            numReviews: product.numReviews || 0,
            ratingDistribution: product.ratingDistribution || [],
            numSales: product.numSales || 0,
            reviews: product.reviews || [],
            isPublished: product.isPublished || false,
            secondHand: product.secondHand || false,
            condition: product.condition,
            saleStartDate: product.saleStartDate ? new Date(product.saleStartDate) : undefined,
            saleEndDate: product.saleEndDate ? new Date(product.saleEndDate) : undefined
          }
        : productDefaultValues,
  })

  const { toast } = useToast()

  // Load brands and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandsData, categoriesData] = await Promise.all([
          getAllActiveBrands(),
          getAllActiveCategories(),
        ])
        setBrands(brandsData)
        setCategories(categoriesData)

        // Dates are already handled in defaultValues, no additional conversion needed
      } catch {
        toast({
          variant: 'destructive',
          description: 'Failed to load brands and categories',
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  async function onSubmit(values: IProductInput) {
    if (type === 'Create') {
      const res = await createProduct(values)
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push(`/admin/products`)
      }
    }
    if (type === 'Update') {
      if (!productId) {
        router.push(`/admin/products`)
        return
      }
      const res = await updateProduct({ ...values, _id: productId })
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        router.push(`/admin/products`)
      }
    }
  }
  const images = form.watch('images')
  const watchedFields = form.watch()
  const productName = form.watch('name')

  // Auto-generate SKU from product name
  useEffect(() => {
    const currentSku = form.getValues('sku')
    
    // Only auto-generate if SKU is empty or unchanged from previous auto-generation
    if (productName && (!currentSku || currentSku === '')) {
      const generatedSku = generateSKU(productName)
      form.setValue('sku', generatedSku)
    }
  }, [productName, form])

  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = ['name', 'category', 'brand', 'price', 'countInStock', 'images', 'description', 'sku']
    const completedFields = requiredFields.filter(field => {
      const value = watchedFields[field as keyof typeof watchedFields]
      if (field === 'images') {
        return Array.isArray(value) && value.length > 0
      }
      return value !== '' && value !== 0 && value !== undefined && value !== null
    })
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const progress = calculateProgress()

  return (
    <Form {...form}>
      <form
        method='post'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6'
      >
        {/* Progress Indicator */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Form Progress</span>
              </div>
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {progress}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Complete all required fields to publish your product
            </p>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Primary Information */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Product Name *</FormLabel>
                          <FormControl>
                            <Input placeholder='Enter product name' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='sku'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">SKU * <span className="text-xs text-muted-foreground font-normal">(Auto-generated)</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder='Auto-generated from product name' 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              className="font-mono"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 Internal inventory code - automatically created from product name
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name='slug'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">URL Slug</FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                placeholder='seo-friendly-url-for-customers'
                                {...field}
                              />
                              <Button
                                type='button'
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  form.setValue('slug', toSlug(form.getValues('name')))
                                }}
                                className='absolute right-1 top-1 h-6 px-2 text-xs'
                              >
                                Generate
                              </Button>
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            🌐 SEO-friendly URL - example: yourstore.com/product/<span className="font-mono">{field.value || 'product-slug'}</span>
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name='category'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select a category' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category._id} value={category._id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='brand'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Brand *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select a brand' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brands.map((brand) => (
                                <SelectItem key={brand._id} value={brand._id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel className="text-sm font-medium">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Describe your product features, specifications, and benefits...'
                            className='resize-none min-h-[100px]'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Write a compelling description to help customers understand your product
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            {/* Pricing & Inventory */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name='price'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Regular Price *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder='0.00'
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='listPrice'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">List Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder='0.00'
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>MSRP or original price (optional)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='countInStock'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Stock Quantity *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type='number'
                              min="0"
                              placeholder='Enter stock quantity'
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Number of items available for sale</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Media & Settings */}
          <div className="space-y-6">

            {/* Product Images */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Product Images</h3>
                </div>

                <FormField
                  control={form.control}
                  name='images'
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Upload Images</FormLabel>

                      {/* Image Preview Grid */}
                      {images.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {images.map((image: string, index: number) => (
                            <div key={image} className="relative group">
                              {image.startsWith('blob:') ? (
                                <Image
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className='w-full h-24 object-cover rounded-lg border'
                                  width={100}
                                  height={100}
                                  unoptimized
                                />
                              ) : (
                                <Image
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className='w-full h-24 object-cover rounded-lg border'
                                  width={100}
                                  height={100}
                                />
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const newImages = images.filter((_, i) => i !== index)
                                  form.setValue('images', newImages)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              {index === 0 && (
                                <Badge className="absolute bottom-1 left-1 text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          {images.length === 0 ? 'Add your first product image' : 'Add more images'}
                        </p>
                        <FormControl>
                          <label className="relative cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  // Create a temporary URL for preview
                                  const objectUrl = URL.createObjectURL(file)
                                  const currentImages = form.getValues('images') || []
                                  form.setValue('images', [...currentImages, objectUrl])

                                  // Show success message
                                  toast({
                                    description: 'Image added successfully (preview only)',
                                  })

                                  // Clear the input so same file can be selected again
                                  e.target.value = ''
                                }
                              }}
                            />
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Choose File
                              </span>
                            </Button>
                          </label>
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>

                      <FormDescription>
                        Upload high-quality images. First image will be the primary image.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Product Variants - Electronics Attributes */}
            <Card>
              <CardContent className="p-6">
                <div 
                  className="flex items-center gap-2 mb-4 cursor-pointer select-none"
                  onClick={() => setVariantsCollapsed(!variantsCollapsed)}
                >
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Product Variants</h3>
                  <Badge variant="outline" className="ml-auto">Optional</Badge>
                  {variantsCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {!variantsCollapsed && (
                  <div className="space-y-4">
                  {/* Storage Options with Price Modifiers */}
                  <FormField
                    control={form.control}
                    name='variants.storage'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Storage</FormLabel>
                        <FormDescription className="text-xs">
                          Add price increment for each storage option
                        </FormDescription>
                        <FormControl>
                          <VariantInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="e.g., 128GB, 256GB, 512GB"
                            label="Storage"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* RAM Options with Price Modifiers */}
                  <FormField
                    control={form.control}
                    name='variants.ram'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">RAM</FormLabel>
                        <FormDescription className="text-xs">
                          Add price increment for each RAM option
                        </FormDescription>
                        <FormControl>
                          <VariantInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="e.g., 4GB, 8GB, 16GB, 32GB"
                            label="RAM"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Color Variants (no price impact) */}
                  <FormField
                    control={form.control}
                    name='variants.colors'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Color</FormLabel>
                        <FormDescription className="text-xs">
                          Color options (no price change)
                        </FormDescription>
                        <FormControl>
                          <TagInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="e.g., Black, Silver, Gold"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  </div>
                )}

                {!variantsCollapsed && (
                  <FormDescription className="mt-4 text-xs">
                    Add variant options for this product. Customers can select from these when ordering.
                  </FormDescription>
                )}
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Advanced Settings</h3>
                </div>

                <div className="space-y-4">
                  {/* Sale Configuration */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Sale Configuration</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <FormField
                        control={form.control}
                        name='saleStartDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Sale Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant='outline'
                                    className={cn(
                                      'w-full justify-start text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    <CalendarIcon className='mr-2 h-4 w-4' />
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a start date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                  mode='single'
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
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
                        name='saleEndDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Sale End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant='outline'
                                    className={cn(
                                      'w-full justify-start text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    <CalendarIcon className='mr-2 h-4 w-4' />
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick an end date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                  mode='single'
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => {
                                    const startDate = form.getValues('saleStartDate')
                                    return date < new Date() || (startDate ? date <= startDate : false)
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Publishing */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Publishing</h4>
                    <FormField
                      control={form.control}
                      name='isPublished'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className="space-y-0.5">
                            <FormLabel className='text-sm font-medium'>
                              Publish Product
                            </FormLabel>
                            <FormDescription>
                              Make this product visible to customers
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Second Hand Product */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Product Condition</h4>
                    <FormField
                      control={form.control}
                      name='secondHand'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className="space-y-0.5">
                            <FormLabel className='text-sm font-medium'>
                              Second Hand Product
                            </FormLabel>
                            <FormDescription>
                              Mark this product as second-hand/used
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch('secondHand') && (
                      <FormField
                        control={form.control}
                        name='condition'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select condition' />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='Like New'>Like New</SelectItem>
                                <SelectItem value='Good'>Good</SelectItem>
                                <SelectItem value='Fair'>Fair</SelectItem>
                                <SelectItem value='Poor'>Poor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Condition of the second-hand product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
        {/* Sticky Action Bar */}
        <Card className="sticky bottom-4 border-2 shadow-lg">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Show validation errors */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm font-semibold text-destructive mb-2">
                    ⚠️ Please fix the following errors:
                  </p>
                  <ul className="text-xs text-destructive space-y-1 list-disc list-inside">
                    {Object.entries(form.formState.errors).map(([key, error]) => (
                      <li key={key}>
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {error?.message as string}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {progress === 100 ? (
                      <span className="text-green-600 font-medium">✓ Ready to publish</span>
                    ) : (
                      <span>Complete required fields to continue</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={form.formState.isSubmitting}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type='submit'
                    disabled={form.formState.isSubmitting || progress < 100}
                    className="min-w-[120px]"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Package className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      `${type} Product`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}

export default ProductForm
