'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { createBrand, updateBrand } from '@/lib/actions/brand.actions'
import { IBrand } from '@/lib/db/models/brand.model'
import { BrandInputSchema, BrandUpdateSchema } from '@/lib/validator'
import { IBrandInput } from '@/types'
import { UploadButton } from '@/lib/uploadthing'
import { TagIcon, ImageIcon, ToggleLeftIcon, Upload, X } from 'lucide-react'

const brandDefaultValues: IBrandInput = {
  name: '',
  logo: '',
  active: true,
}

const BrandForm = ({
  type,
  brand,
  brandId,
}: {
  type: 'Create' | 'Update'
  brand?: IBrand
  brandId?: string
}) => {
  const router = useRouter()

  const form = useForm<IBrandInput>({
    resolver:
      type === 'Update'
        ? zodResolver(BrandUpdateSchema)
        : zodResolver(BrandInputSchema),
    defaultValues:
      brand && type === 'Update' ? brand : brandDefaultValues,
  })

  const { toast } = useToast()
  async function onSubmit(values: IBrandInput) {
    if (type === 'Create') {
      const res = await createBrand(values)
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push(`/admin/brands`)
      }
    }
    if (type === 'Update') {
      if (!brandId) {
        router.push(`/admin/brands`)
        return
      }
      const res = await updateBrand({ ...values, _id: brandId })
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push(`/admin/brands`)
      }
    }
  }

  const logo = form.watch('logo')

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          method='post'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950">
                  <TagIcon className="h-4 w-4 text-emerald-600" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Brand Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter brand name (e.g., Nike, Apple, Samsung)'
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose a clear, recognizable name for your brand
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Brand Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                </div>
                Brand Logo
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='logo'
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Logo Image</FormLabel>
                    <FormControl>
                      <div className='space-y-4'>
                        {logo ? (
                          <div className='flex items-start gap-4 p-4 border rounded-lg bg-muted/30'>
                            <div className='relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-background'>
                              <Image
                                src={logo}
                                alt='Brand logo preview'
                                fill
                                className='object-contain p-2'
                              />
                            </div>
                            <div className='flex-1 space-y-2'>
                              <div className='text-sm font-medium'>Logo uploaded successfully</div>
                              <div className='text-xs text-muted-foreground'>Your brand logo is ready to use</div>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => form.setValue('logo', '')}
                                className='mt-2'
                              >
                                <X className='h-3.5 w-3.5 mr-1' />
                                Remove Logo
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-6'>
                            <div className='text-center space-y-4'>
                              <div className='mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center'>
                                <Upload className='h-5 w-5 text-muted-foreground' />
                              </div>
                              <div>
                                <div className='text-sm font-medium mb-1'>Upload brand logo</div>
                                <div className='text-xs text-muted-foreground mb-4'>
                                  Recommended: 200x200px, PNG or JPG format, max 2MB
                                </div>
                                <UploadButton
                                  endpoint='imageUploader'
                                  onClientUploadComplete={(res) => {
                                    form.setValue('logo', res[0].url)
                                    toast({
                                      description: 'Logo uploaded successfully!',
                                    })
                                  }}
                                  onUploadError={() => {
                                    toast({
                                      variant: 'destructive',
                                      description: 'Failed to upload logo. Please try again.',
                                    })
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a high-quality logo to represent your brand (optional but recommended)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Brand Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950">
                  <ToggleLeftIcon className="h-4 w-4 text-amber-600" />
                </div>
                Brand Settings
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='active'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Active Status</FormLabel>
                      <FormDescription>
                        When enabled, this brand will be visible to customers and available for products
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

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className='flex items-center gap-3'>
                <Button
                  type='submit'
                  size='lg'
                  disabled={form.formState.isSubmitting}
                  className="min-w-[140px]"
                >
                  {form.formState.isSubmitting ?
                    (type === 'Create' ? 'Creating...' : 'Updating...') :
                    `${type} Brand`
                  }
                </Button>
                <Button
                  type='button'
                  size='lg'
                  variant='outline'
                  onClick={() => router.push('/admin/brands')}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}

export default BrandForm
