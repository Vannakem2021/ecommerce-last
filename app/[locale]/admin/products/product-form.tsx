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
import { UploadButton } from '@/lib/uploadthing'
import { ProductInputSchema, ProductUpdateSchema, ProductInputLegacySchema } from '@/lib/validator'
import { Checkbox } from '@/components/ui/checkbox'
import { toSlug } from '@/lib/utils'
import { IProductInput } from '@/types'
import { PRODUCT_TAGS } from '@/lib/constants'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X, Upload, Package, DollarSign, Image as ImageIcon, FileText, Tags, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

const productDefaultValues: IProductInput =
  process.env.NODE_ENV === 'development'
    ? {
        name: 'Sample Product',
        slug: 'sample-product',
        sku: 'SAMPLE-CATEGORY-001',
        category: '', // Will be set to ObjectId
        images: ['/images/ipad1.png'],
        brand: '', // Will be set to ObjectId
        description: 'This is a sample description of the product.',
        price: 99.99,
        listPrice: 0,
        countInStock: 15,
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
      }
    : {
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

  const form = useForm<IProductInput>({
    resolver:
      type === 'Update'
        ? zodResolver(ProductUpdateSchema)
        : zodResolver(ProductInputSchema),
    defaultValues:
      product && type === 'Update'
        ? {
            ...product,
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

        // Handle existing product data conversion from string to ObjectId
        if (product && type === 'Update') {
          const updates: Partial<IProductInput> = {}

          // Convert brand from string to ObjectId if needed
          if (typeof product.brand === 'string') {
            const brandDoc = brandsData.find(b => b.name === product.brand)
            if (brandDoc) {
              updates.brand = brandDoc._id
            }
          } else if (typeof product.brand === 'object' && product.brand._id) {
            // Handle populated brand object
            updates.brand = product.brand._id
          }

          // Convert category from string to ObjectId if needed
          if (typeof product.category === 'string') {
            const categoryDoc = categoriesData.find(c => c.name === product.category)
            if (categoryDoc) {
              updates.category = categoryDoc._id
            }
          } else if (typeof product.category === 'object' && product.category._id) {
            // Handle populated category object
            updates.category = product.category._id
          }

          // Update form values if any conversions were made
          if (Object.keys(updates).length > 0) {
            Object.entries(updates).forEach(([key, value]) => {
              form.setValue(key as keyof IProductInput, value)
            })
          }

          // Convert string dates to Date objects if needed
          if (product.saleStartDate && typeof product.saleStartDate === 'string') {
            form.setValue('saleStartDate', new Date(product.saleStartDate))
          }
          if (product.saleEndDate && typeof product.saleEndDate === 'string') {
            form.setValue('saleEndDate', new Date(product.saleEndDate))
          }
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          description: 'Failed to load brands and categories',
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
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

  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = ['name', 'category', 'brand', 'price', 'countInStock']
    const completedFields = requiredFields.filter(field => {
      const value = watchedFields[field as keyof typeof watchedFields]
      return value !== '' && value !== 0 && value !== undefined
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
                      name='slug'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">URL Slug</FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Input
                                placeholder='Enter product slug'
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
                                <img
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className='w-full h-24 object-cover rounded-lg border'
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

            {/* Product Tags */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tags className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Product Tags</h3>
                </div>

                <FormField
                  control={form.control}
                  name='tags'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Select Tags</FormLabel>
                      <FormDescription>
                        Choose tags that best describe your product
                      </FormDescription>
                      <div className='grid grid-cols-1 gap-3 mt-3'>
                        {PRODUCT_TAGS.map((tag) => (
                          <FormItem
                            key={tag}
                            className='flex flex-row items-center space-x-3 space-y-0 p-2 border rounded-lg hover:bg-muted/50 transition-colors'
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(tag) || false}
                                onCheckedChange={(checked) => {
                                  const currentTags = field.value || []
                                  if (checked) {
                                    field.onChange([...currentTags, tag])
                                  } else {
                                    field.onChange(currentTags.filter((t) => t !== tag))
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className='text-sm font-normal cursor-pointer flex-1'>
                              {tag}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                                    return date < new Date() || (startDate && date <= startDate)
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
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
        {/* Sticky Action Bar */}
        <Card className="sticky bottom-4 border-2 shadow-lg">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}

export default ProductForm
