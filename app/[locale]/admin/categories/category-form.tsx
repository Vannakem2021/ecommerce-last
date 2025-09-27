'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { createCategory, updateCategory } from '@/lib/actions/category.actions'
import { ICategory } from '@/lib/db/models/category.model'
import { CategoryInputSchema, CategoryUpdateSchema } from '@/lib/validator'
import { ICategoryInput } from '@/types'
import { FolderIcon, InfoIcon, ToggleLeftIcon } from 'lucide-react'
const categoryDefaultValues: ICategoryInput = {
  name: '',
  description: '',
  active: true,
}

const CategoryForm = ({
  type,
  category,
  categoryId,
}: {
  type: 'Create' | 'Update'
  category?: ICategory
  categoryId?: string
}) => {
  const router = useRouter()

  const form = useForm<ICategoryInput>({
    resolver:
      type === 'Update'
        ? zodResolver(CategoryUpdateSchema)
        : zodResolver(CategoryInputSchema),
    defaultValues:
      category && type === 'Update' ? category : categoryDefaultValues,
  })

  const { toast } = useToast()
  async function onSubmit(values: ICategoryInput) {
    if (type === 'Create') {
      const res = await createCategory(values)
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push(`/admin/categories`)
      }
    }
    if (type === 'Update') {
      if (!categoryId) {
        router.push(`/admin/categories`)
        return
      }
      const res = await updateCategory({ ...values, _id: categoryId })
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push(`/admin/categories`)
      }
    }
  }

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
                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                  <FolderIcon className="h-4 w-4 text-blue-600" />
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
                    <FormLabel className="text-sm font-medium">Category Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter category name (e.g., Electronics, Clothing)'
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose a clear, descriptive name for your category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Enter category description...'
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a brief description to help customers understand this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950">
                  <ToggleLeftIcon className="h-4 w-4 text-amber-600" />
                </div>
                Category Settings
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
                        When enabled, this category will be visible to customers and available for products
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
                    `${type} Category`
                  }
                </Button>
                <Button
                  type='button'
                  size='lg'
                  variant='outline'
                  onClick={() => router.push('/admin/categories')}
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

export default CategoryForm
