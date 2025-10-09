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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toSlug } from '@/lib/utils'
import { IProductInput } from '@/types'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X, Upload, Package, DollarSign, Image as ImageIcon, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { UploadButton } from '@/lib/uploadthing'

// Configuration Manager Component
interface ConfigurationManagerProps {
  value: {
    sku: string
    name: string
    price: number
    isDefault: boolean
    attributes: Record<string, string | undefined>
  }[]
  onChange: (value: any[]) => void
  baseSku: string
}

const ConfigurationManager = ({ value = [], onChange, baseSku }: ConfigurationManagerProps) => {
  const { toast } = useToast()
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    storage: '',
    ram: '',
    color: '',
    name: '',
    price: '',
    isDefault: false
  })

  const resetForm = () => {
    setFormData({
      storage: '',
      ram: '',
      color: '',
      name: '',
      price: '',
      isDefault: false
    })
    setEditingIndex(null)
  }

  // Auto-generate name from selections
  const generateName = (storage: string, ram: string, color: string) => {
    // Memory configuration: "6GB | 128GB"
    const memoryParts = []
    if (ram) memoryParts.push(ram)
    if (storage) memoryParts.push(storage)
    const memoryConfig = memoryParts.join(' | ')
    
    // Add color if present: "6GB | 128GB - Black"
    if (color && memoryConfig) {
      return `${memoryConfig} - ${color}`
    }
    
    return memoryConfig || color || ''
  }

  // Update name when selections change
  const handleAttributeChange = (field: 'storage' | 'ram' | 'color', value: string) => {
    const updated = { ...formData, [field]: value }
    const autoName = generateName(updated.storage, updated.ram, updated.color)
    setFormData({ ...updated, name: autoName })
  }

  const handleAdd = () => {
    // Validation
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', description: 'Variant name is required' })
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ variant: 'destructive', description: 'Valid price is required' })
      return
    }

    // Auto-generate SKU as BASESKU-001, BASESKU-002, etc.
    const nextNumber = String(value.length + 1).padStart(3, '0')
    const autoSku = `${baseSku}-${nextNumber}`.toUpperCase()
    
    const newConfig = {
      sku: autoSku,
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      isDefault: formData.isDefault,
      attributes: {
        storage: formData.storage || undefined,
        ram: formData.ram || undefined,
        color: formData.color || undefined,
      }
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...value]
      updated[editingIndex] = { ...updated[editingIndex], ...newConfig, sku: updated[editingIndex].sku }
      onChange(updated)
      toast({ description: 'Variant updated' })
    } else {
      // Add new
      // If this is the first config, make it default
      if (value.length === 0) {
        newConfig.isDefault = true
      }
      // If setting as default, unset others
      if (newConfig.isDefault) {
        const updated = value.map(c => ({ ...c, isDefault: false }))
        onChange([...updated, newConfig])
      } else {
        onChange([...value, newConfig])
      }
      toast({ description: 'Variant added' })
    }

    resetForm()
  }

  const handleEdit = (index: number) => {
    const config = value[index]
    setFormData({
      storage: config.attributes?.storage || '',
      ram: config.attributes?.ram || '',
      color: config.attributes?.color || '',
      name: config.name,
      price: config.price.toString(),
      isDefault: config.isDefault
    })
    setEditingIndex(index)
  }

  const handleRemove = (index: number) => {
    const config = value[index]
    if (config.isDefault && value.length > 1) {
      toast({ 
        variant: 'destructive', 
        description: 'Cannot remove default variant. Set another as default first.' 
      })
      return
    }
    
    const updated = value.filter((_, i) => i !== index)
    // If we removed the default and there are others, make first one default
    if (config.isDefault && updated.length > 0) {
      updated[0].isDefault = true
    }
    onChange(updated)
    toast({ description: 'Variant removed' })
  }

  const handleSetDefault = (index: number) => {
    const updated = value.map((c, i) => ({
      ...c,
      isDefault: i === index
    }))
    onChange(updated)
    toast({ description: 'Default variant updated' })
  }

  return (
    <div className="space-y-4">
      {/* Configuration List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((config, index) => (
            <Card key={config.sku} className="hover:border-primary/50 transition-colors overflow-hidden">
              <CardContent className="p-2">
                {/* Single Row: Name, Price, Actions */}
                <div className="flex items-center gap-3 text-xs">
                  {/* Name with Default Badge */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-medium truncate" title={config.name}>{config.name}</span>
                    {config.isDefault && (
                      <Badge variant="default" className="text-[10px] h-4 px-1.5 flex-shrink-0">Default</Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="font-bold text-sm flex-shrink-0">${config.price}</div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!config.isDefault && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(index)}
                        className="h-6 text-[10px] px-2"
                      >
                        Default
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(index)}
                      className="h-6 text-[10px] px-2"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Summary Footer */}
          <div className="flex items-center justify-between p-2 bg-muted/20 rounded text-[10px]">
            <span className="font-medium">
              {value.length} variant{value.length !== 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground">
              SKU: {baseSku}-###
            </span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs font-semibold mb-3">
            {editingIndex !== null ? 'Edit Variant' : 'Add Variant'}
          </div>

          <div className="space-y-3">
            {/* Row 1: Attributes */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-medium block mb-1">RAM</label>
                <Select value={formData.ram || undefined} onValueChange={(val) => handleAttributeChange('ram', val)}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="RAM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4GB">4GB</SelectItem>
                    <SelectItem value="6GB">6GB</SelectItem>
                    <SelectItem value="8GB">8GB</SelectItem>
                    <SelectItem value="12GB">12GB</SelectItem>
                    <SelectItem value="16GB">16GB</SelectItem>
                    <SelectItem value="32GB">32GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-medium block mb-1">Storage</label>
                <Select value={formData.storage || undefined} onValueChange={(val) => handleAttributeChange('storage', val)}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="64GB">64GB</SelectItem>
                    <SelectItem value="128GB">128GB</SelectItem>
                    <SelectItem value="256GB">256GB</SelectItem>
                    <SelectItem value="512GB">512GB</SelectItem>
                    <SelectItem value="1TB">1TB</SelectItem>
                    <SelectItem value="2TB">2TB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-medium block mb-1">Color</label>
                <Select value={formData.color || undefined} onValueChange={(val) => handleAttributeChange('color', val)}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Black">Black</SelectItem>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="Green">Green</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto-generated Name Display */}
            {formData.name && (
              <div className="text-xs text-muted-foreground px-1">
                → Name: <span className="font-medium text-foreground">{formData.name}</span>
              </div>
            )}

            {/* Row 2: Price & Default */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium block mb-1">Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="text-xs h-8 pl-7"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-3.5 w-3.5"
                  />
                  <span>Default</span>
                </label>
              </div>
            </div>
          </div>

          {/* Add/Update Button */}
          <Button
            type="button"
            onClick={handleAdd}
            className="w-full h-8 text-xs mt-3"
            size="sm"
          >
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Total: {value.length} variant{value.length !== 1 ? 's' : ''} • 
          SKU: Auto-generated ({baseSku}-001, {baseSku}-002, ...)
        </div>
      )}
    </div>
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
  listPrice: undefined,
  countInStock: 0,
  numReviews: 0,
  avgRating: 0,
  numSales: 0,
  isPublished: false,
  sizes: [],
  colors: [],
  ratingDistribution: [],
  reviews: [],
  saleStartDate: undefined,
  saleEndDate: undefined,
  secondHand: false,
  condition: undefined,
  productType: 'simple' as 'simple' | 'variant',
  configurations: [],
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
            colors: product.colors || [],
            sizes: product.sizes || [],
            productType: product.productType || 'simple',
            configurations: product.configurations || [],
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
    const productType = watchedFields.productType || 'simple'
    
    // Required fields based on product type
    const requiredFields = ['name', 'category', 'brand', 'images', 'description', 'sku']
    
    // For simple products, add price and stock
    if (productType === 'simple') {
      requiredFields.push('price', 'countInStock')
    }
    
    // For variant products, configurations must exist
    if (productType === 'variant') {
      requiredFields.push('configurations')
    }
    
    const fieldStatus: Record<string, boolean> = {}
    
    const completedFields = requiredFields.filter(field => {
      const value = watchedFields[field as keyof typeof watchedFields]
      let isComplete = false
      
      if (field === 'images') {
        isComplete = Array.isArray(value) && value.length > 0
      } else if (field === 'configurations') {
        isComplete = Array.isArray(value) && value.length > 0
      } else if (field === 'price' || field === 'countInStock') {
        // Allow 0 as valid value, just check it's defined
        isComplete = value !== '' && value !== undefined && value !== null
      } else {
        isComplete = value !== '' && value !== undefined && value !== null
      }
      
      fieldStatus[field] = isComplete
      return isComplete
    })
    
    return {
      percentage: Math.round((completedFields.length / requiredFields.length) * 100),
      fieldStatus,
      totalFields: requiredFields.length,
      completedCount: completedFields.length
    }
  }

  const progressData = calculateProgress()
  const progress = progressData.percentage

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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Primary Information (3/5 width) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Basic Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>

                <div className="space-y-4">
                  {/* Product Type Selector */}
                  <FormField
                    control={form.control}
                    name='productType'
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-medium">Product Type *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div>
                              <RadioGroupItem
                                value="simple"
                                id="simple"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="simple"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Package className="mb-3 h-6 w-6" />
                                <div className="text-center">
                                  <p className="font-semibold">Simple Product</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Single item with one price and stock
                                  </p>
                                </div>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem
                                value="variant"
                                id="variant"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="variant"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <Settings className="mb-3 h-6 w-6" />
                                <div className="text-center">
                                  <p className="font-semibold">Product with Variants</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Multiple options (e.g., sizes, colors, storage)
                                  </p>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Choose how this product will be sold
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
            
            {/* Pricing & Inventory - Only for Simple Products */}
            {form.watch('productType') === 'simple' && (
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
            )}

          </div>

          {/* Right Column - Media & Settings (2/5 width - larger) */}
          <div className="lg:col-span-2 space-y-6">

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
                          <UploadButton
                            endpoint="imageUploader"
                            onClientUploadComplete={(res) => {
                              if (res && res.length > 0) {
                                const currentImages = form.getValues('images') || []
                                form.setValue('images', [...currentImages, res[0].url])
                                toast({
                                  description: 'Image uploaded successfully',
                                })
                              }
                            }}
                            onUploadError={(error: Error) => {
                              toast({
                                variant: 'destructive',
                                description: `Upload failed: ${error.message}`,
                              })
                            }}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG, GIF up to 4MB
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

            {/* Product Variants - Only for Variant Products */}
            {form.watch('productType') === 'variant' && (
              <Card>
                <CardContent className="p-6">
                  <div 
                    className="flex items-center gap-2 mb-4 cursor-pointer select-none"
                    onClick={() => setVariantsCollapsed(!variantsCollapsed)}
                  >
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Product Variants</h3>
                    <Badge variant="destructive" className="ml-auto">Required</Badge>
                    {variantsCollapsed ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {!variantsCollapsed && (
                    <div className="space-y-3">
                      <div className="rounded border p-2 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <p className="text-[10px] font-medium text-blue-900 dark:text-blue-100">
                          💡 Each variant has its own price. Stock is tracked at product level.
                        </p>
                      </div>
                      
                      {/* Configuration Manager */}
                      <FormField
                        control={form.control}
                        name='configurations'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ConfigurationManager
                                value={field.value || []}
                                onChange={field.onChange}
                                baseSku={form.watch('sku') || 'PROD'}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {!variantsCollapsed && (
                    <FormDescription className="mt-4 text-xs">
                      Define at least one variant with its own price. Manage stock at product level.
                    </FormDescription>
                  )}
                </CardContent>
              </Card>
            )}

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
