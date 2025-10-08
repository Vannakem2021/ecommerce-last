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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { UploadButton } from '@/lib/uploadthing'
import { ISettingInput } from '@/types'
import { TrashIcon, FileText, Palette, Phone, Scale } from 'lucide-react'
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
    <div id={id} className='space-y-6'>
      {/* Card Grid Layout */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        
        {/* Card 1: Basic Details */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Basic Details</CardTitle>
            </div>
            <CardDescription className='text-xs'>Site name and URL configuration</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={control}
              name='site.name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Site Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter your site name' {...field} />
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
                  <FormLabel className='text-xs'>Site URL</FormLabel>
                  <FormControl>
                    <Input placeholder='https://example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Card 2: Branding */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Palette className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Branding</CardTitle>
            </div>
            <CardDescription className='text-xs'>Logo and site description</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={control}
              name='site.logo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Logo</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter image url' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {siteLogo && (
              <div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
                <img src={siteLogo} alt='logo' width={48} height={48} className='rounded-md border' />
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

            <FormField
              control={control}
              name='site.description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Brief description of your site'
                      className='resize-none'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Card 3: Contact */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Phone className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Contact Information</CardTitle>
            </div>
            <CardDescription className='text-xs'>How customers can reach you</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={control}
              name='site.phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder='+1 (555) 123-4567' {...field} />
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
                  <FormLabel className='text-xs'>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='contact@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name='site.address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Address</FormLabel>
                  <FormControl>
                    <Input placeholder='123 Main St, City, Country' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Card 4: Legal */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Scale className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Legal Information</CardTitle>
            </div>
            <CardDescription className='text-xs'>Copyright and legal details</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={control}
              name='site.copyright'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Copyright</FormLabel>
                  <FormControl>
                    <Input placeholder='© 2024 Your Company. All rights reserved.' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
