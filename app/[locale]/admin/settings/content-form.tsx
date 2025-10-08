/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { UploadButton } from '@/lib/uploadthing'
import { ISettingInput } from '@/types'
import { TrashIcon, Image as ImageIcon, Languages } from 'lucide-react'
import React, { useEffect } from 'react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'

export default function ContentForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { control, watch, setValue } = form

  // Carousels
  const { fields: carouselFields, append: appendCarousel, remove: removeCarousel } = useFieldArray({
    control: form.control,
    name: 'carousels',
  })

  // Languages
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control: form.control,
    name: 'availableLanguages',
  })

  const availableLanguages = watch('availableLanguages')
  const defaultLanguage = watch('defaultLanguage')

  useEffect(() => {
    const validCodes = availableLanguages.map((lang) => lang.code)
    if (!validCodes.includes(defaultLanguage)) {
      setValue('defaultLanguage', '')
    }
  }, [JSON.stringify(availableLanguages)])

  return (
    <div id={id} className='space-y-6'>
      {/* Card Grid Layout */}
      <div className='grid grid-cols-1 gap-6'>
        
        {/* Card 1: Carousels - Full Width */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <ImageIcon className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Homepage Carousels</CardTitle>
            </div>
            <CardDescription className='text-xs'>Manage hero banners and promotional slides</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Carousels List */}
            <div className='space-y-3'>
              {carouselFields.map((field, index) => (
                <div key={field.id} className='border rounded-lg p-3 space-y-3 bg-muted/30'>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
                    <FormField
                      control={control}
                      name={`carousels.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel className='text-xs'>Title</FormLabel>}
                          <FormControl>
                            <Input {...field} placeholder='Flash Sale 50% Off' className='text-xs h-8' />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`carousels.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel className='text-xs'>Link URL</FormLabel>}
                          <FormControl>
                            <Input {...field} placeholder='/products/sale' className='text-xs h-8' />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`carousels.${index}.buttonCaption`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel className='text-xs'>Button Text</FormLabel>}
                          <FormControl>
                            <Input {...field} placeholder='Shop Now' className='text-xs h-8' />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                    <div className='flex items-end'>
                      <Button
                        type='button'
                        disabled={carouselFields.length === 1}
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={() => removeCarousel(index)}
                      >
                        <TrashIcon className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <FormField
                      control={control}
                      name={`carousels.${index}.image`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>Banner Image</FormLabel>
                          <FormControl>
                            <Input placeholder='Image URL' {...field} className='text-xs h-8' />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    {watch(`carousels.${index}.image`) && (
                      <div className='mt-2 flex items-center gap-3 p-2 bg-background rounded-lg border'>
                        <img
                          src={watch(`carousels.${index}.image`)}
                          alt='carousel preview'
                          className='w-32 h-12 object-cover rounded'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='text-xs h-7'
                          onClick={() => form.setValue(`carousels.${index}.image`, '')}
                        >
                          <TrashIcon className='w-3 h-3 mr-1' />
                          Remove
                        </Button>
                      </div>
                    )}

                    {!watch(`carousels.${index}.image`) && (
                      <div className='mt-2'>
                        <UploadButton
                          className='!items-start ut-button:h-8 ut-button:text-xs'
                          endpoint='imageUploader'
                          onClientUploadComplete={(res) => {
                            form.setValue(`carousels.${index}.image`, res[0].url)
                          }}
                          onUploadError={(error: Error) => {
                            toast({
                              variant: 'destructive',
                              description: `ERROR! ${error.message}`,
                            })
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-xs h-8'
                onClick={() =>
                  appendCarousel({ url: '', title: '', image: '', buttonCaption: '' })
                }
              >
                Add Carousel Slide
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Languages */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Languages className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Language Settings</CardTitle>
            </div>
            <CardDescription className='text-xs'>Configure available languages for your store</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Languages List */}
            <div className='space-y-2'>
              {languageFields.map((field, index) => (
                <div key={field.id} className='flex gap-2'>
                  <FormField
                    control={control}
                    name={`availableLanguages.${index}.name`}
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        {index === 0 && <FormLabel className='text-xs'>Language Name</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='English' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`availableLanguages.${index}.code`}
                    render={({ field }) => (
                      <FormItem className='w-32'>
                        {index === 0 && <FormLabel className='text-xs'>Code</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='en-US' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <div className='flex items-end'>
                    <Button
                      type='button'
                      disabled={languageFields.length === 1}
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => removeLanguage(index)}
                    >
                      <TrashIcon className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-xs h-8'
                onClick={() => appendLanguage({ name: '', code: '' })}
              >
                Add Language
              </Button>
            </div>

            {/* Default Language Selector */}
            <FormField
              control={control}
              name='defaultLanguage'
              render={({ field }) => (
                <FormItem className='max-w-md'>
                  <FormLabel className='text-xs'>Default Language</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='Select default language' />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages
                          .filter((x) => x.code)
                          .map((lang, index) => (
                            <SelectItem key={index} value={lang.code}>
                              {lang.name} ({lang.code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
