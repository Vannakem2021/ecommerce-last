'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
import { createCategory, updateCategory } from '@/lib/actions/category.actions'
import { ICategory } from '@/lib/db/models/category.model'
import { CategoryInputSchema, CategoryUpdateSchema } from '@/lib/validator'
import { ICategoryInput } from '@/types'
const categoryDefaultValues: ICategoryInput = {
  name: '',
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
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter category name' {...field} />
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
                {form.formState.isSubmitting ? 'Submitting...' : `${type} Category`}
              </Button>
              <Button
                type='button'
                size='lg'
                variant='outline'
                onClick={() => router.push('/admin/categories')}
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

export default CategoryForm
