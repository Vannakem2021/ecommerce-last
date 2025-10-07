import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ISettingInput } from '@/types'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'

export default function CommonForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { control } = form

  return (
    <div id={id} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <FormField
        control={control}
        name='common.pageSize'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Page Size</FormLabel>
            <FormControl>
              <Input placeholder='Enter Page Size' className='rounded-sm' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name='common.freeShippingMinPrice'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Free Shipping Minimum Price</FormLabel>
            <FormControl>
              <Input
                placeholder='Enter Free Shipping Minimum Price'
                className='rounded-sm'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
