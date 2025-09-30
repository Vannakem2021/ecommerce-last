'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useState } from 'react'

import MdEditor from 'react-markdown-editor-lite'
import ReactMarkdown from 'react-markdown'
import 'react-markdown-editor-lite/lib/index.css'
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
import { createWebPage, updateWebPage } from '@/lib/actions/web-page.actions'
import { IWebPage } from '@/lib/db/models/web-page.model'
import { WebPageInputSchema, WebPageUpdateSchema } from '@/lib/validator'
import { toSlug } from '@/lib/utils'
import {
  FileText,
  Globe,
  Eye,
  EyeOff,
  Type,
  Link as LinkIcon,
  Zap,
  Settings
} from 'lucide-react'

const webPageDefaultValues = {
  title: '',
  slug: '',
  content: '',
}

const WebPageForm = ({
  type,
  webPage,
  webPageId,
}: {
  type: 'Create' | 'Update'
  webPage?: IWebPage
  webPageId?: string
}) => {
  const router = useRouter()

  const form = useForm<z.infer<typeof WebPageInputSchema>>({
    resolver:
      type === 'Update'
        ? zodResolver(WebPageUpdateSchema)
        : zodResolver(WebPageInputSchema),
    defaultValues:
      webPage && type === 'Update' ? webPage : webPageDefaultValues,
  })

  const { toast } = useToast()
  async function onSubmit(values: z.infer<typeof WebPageInputSchema>) {
    if (type === 'Create') {
      const res = await createWebPage(values)
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push(`/admin/web-pages`)
      }
    }
    if (type === 'Update') {
      if (!webPageId) {
        router.push(`/admin/web-pages`)
        return
      }
      const res = await updateWebPage({ ...values, _id: webPageId })
      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        router.push(`/admin/web-pages`)
      }
    }
  }

  // Watch title to auto-generate slug
  const watchedTitle = form.watch('title')
  const watchedSlug = form.watch('slug')

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          method='post'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          {/* Page Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                  <Type className="h-4 w-4 text-blue-600" />
                </div>
                Page Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Page Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter page title (e.g., About Us)'
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The main title displayed on the page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">URL Slug *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder='Enter URL slug'
                            className="h-10 pr-20"
                            {...field}
                          />
                          <Button
                            type='button'
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              form.setValue('slug', toSlug(form.getValues('title')))
                            }}
                            className="absolute right-1 top-1 h-8 px-2 text-xs"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Generate
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL-friendly version of the title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* URL Preview */}
              {watchedSlug && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Page URL Preview
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1 font-mono">
                    https://yoursite.com/page/{watchedSlug}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-950">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                Page Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name='content'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Content *</FormLabel>
                    <FormDescription>
                      Write your page content using Markdown. The editor supports live preview.
                    </FormDescription>
                    <FormControl>
                      <div className="border rounded-lg overflow-hidden">
                        <MdEditor
                          {...field}
                          style={{ height: '500px' }}
                          renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                          onChange={({ text }) => form.setValue('content', text)}
                          placeholder="Start writing your page content..."
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Publishing Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950">
                  <Settings className="h-4 w-4 text-purple-600" />
                </div>
                Publishing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name='isPublished'
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Publish Page</FormLabel>
                      <FormDescription>
                        Make this page visible to website visitors
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

              {/* Publishing Status Notice */}
              <div className={`rounded-lg border p-4 ${
                form.watch('isPublished')
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                  : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
              }`}>
                <div className="flex items-start gap-3">
                  {form.watch('isPublished') ? (
                    <Eye className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${
                      form.watch('isPublished')
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-amber-900 dark:text-amber-100'
                    }`}>
                      {form.watch('isPublished') ? 'Page will be published' : 'Page will be saved as draft'}
                    </p>
                    <p className={`text-sm ${
                      form.watch('isPublished')
                        ? 'text-green-700 dark:text-green-200'
                        : 'text-amber-700 dark:text-amber-200'
                    }`}>
                      {form.watch('isPublished')
                        ? 'This page will be immediately visible to all website visitors.'
                        : 'This page will be saved but not visible to visitors until published.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      {type === 'Create' ? 'Creating page...' : 'Updating page...'}
                    </span>
                  ) : (
                    'Review all information before saving the page'
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.push('/admin/web-pages')}
                    disabled={form.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="min-w-[140px]"
                  >
                    {form.formState.isSubmitting ? (type === 'Create' ? 'Creating...' : 'Updating...') : `${type} Page`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}

export default WebPageForm
