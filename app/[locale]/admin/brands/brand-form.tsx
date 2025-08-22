'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { createBrand, updateBrand } from '@/lib/actions/brand.actions'
import { IBrand } from '@/lib/db/models/brand.model'
import { BrandInputSchema, BrandUpdateSchema } from '@/lib/validator'
import { IBrandInput } from '@/types'
import { UploadButton } from '@/lib/uploadthing'

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
    <Form {...form}>
      <form
        method='post'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        <Card>
          <CardContent className='space-y-4 pt-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter brand name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='logo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Logo</FormLabel>
                  <FormControl>
                    <div className='space-y-4'>
                      {logo && (
                        <div className='flex items-center space-x-4'>
                          <Image
                            src={logo}
                            alt='Brand logo'
                            width={100}
                            height={100}
                            className='rounded-md object-contain border'
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => form.setValue('logo', '')}
                          >
                            Remove Logo
                          </Button>
                        </div>
                      )}
                      <UploadButton
                        endpoint='imageUploader'
                        onClientUploadComplete={(res) => {
                          form.setValue('logo', res[0].url)
                        }}
                        onUploadError={(error: Error) => {
                          console.error('Upload error:', error)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='active'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Active</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className='flex gap-2'>
              <Button
                type='submit'
                size='lg'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Submitting...' : `${type} Brand`}
              </Button>
              <Button
                type='button'
                size='lg'
                variant='outline'
                onClick={() => router.push('/admin/brands')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}

export default BrandForm
