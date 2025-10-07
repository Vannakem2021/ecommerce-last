/* eslint-disable @next/next/no-img-element */
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { UploadButton } from '@/lib/uploadthing'
import { ISettingInput } from '@/types'
import { TrashIcon } from 'lucide-react'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'

export default function SiteInfoForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { watch, control } = form

  const siteLogo = watch('site.logo')
  return (
    <div id={id} className='space-y-8'>
      {/* BASIC DETAILS */}
      <div className='space-y-4'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Basic Details</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={control}
            name='site.name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter your site name' className='rounded-sm' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='site.url'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site URL</FormLabel>
                <FormControl>
                  <Input placeholder='https://example.com' className='rounded-sm' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className='border-t' />

      {/* BRANDING */}
      <div className='space-y-4'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Branding</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-4'>
            <FormField
              control={control}
              name='site.logo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter image url' className='rounded-sm' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {siteLogo && (
              <div className='flex items-center gap-3'>
                <img src={siteLogo} alt='logo' width={48} height={48} className='rounded-sm' />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => form.setValue('site.logo', '')}
                >
                  <TrashIcon className='w-4 h-4 mr-2' />
                  Remove
                </Button>
              </div>
            )}
            
            {!siteLogo && (
              <UploadButton
                className='!items-start'
                endpoint='imageUploader'
                onClientUploadComplete={(res) => {
                  form.setValue('site.logo', res[0].url)
                }}
                onUploadError={(error: Error) => {
                  toast({
                    variant: 'destructive',
                    description: `ERROR! ${error.message}`,
                  })
                }}
              />
            )}
          </div>

          <FormField
            control={control}
            name='site.description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Enter a brief description of your site'
                    className='resize-none rounded-sm'
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className='border-t' />

      {/* CONTACT */}
      <div className='space-y-4'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Contact</h3>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={control}
              name='site.phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder='+1 (555) 123-4567' className='rounded-sm' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name='site.email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='contact@example.com' className='rounded-sm' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name='site.address'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder='123 Main St, City, Country' className='rounded-sm' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className='border-t' />

      {/* LEGAL */}
      <div className='space-y-4'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Legal</h3>
        <FormField
          control={control}
          name='site.copyright'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Copyright</FormLabel>
              <FormControl>
                <Input placeholder='© 2024 Your Company. All rights reserved.' className='rounded-sm' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
