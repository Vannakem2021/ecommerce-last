'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createFAQ, updateFAQ } from '@/lib/actions/chatbot-faq.actions'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const faqFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  questionEn: z.string().min(1, 'English question is required'),
  questionKh: z.string().min(1, 'Khmer question is required'),
  answerEn: z.string().min(1, 'English answer is required'),
  answerKh: z.string().min(1, 'Khmer answer is required'),
  keywords: z.string(),
  order: z.number().min(0),
  active: z.boolean(),
})

type FAQFormValues = z.infer<typeof faqFormSchema>

interface FAQ {
  id: string
  category: string
  question: {
    en: string
    kh: string
  }
  answer: {
    en: string
    kh: string
  }
  keywords?: string[]
  order: number
  active: boolean
}

interface FAQFormProps {
  faq?: FAQ
}

export function FAQForm({ faq }: FAQFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FAQFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      category: faq?.category || '',
      questionEn: faq?.question.en || '',
      questionKh: faq?.question.kh || '',
      answerEn: faq?.answer.en || '',
      answerKh: faq?.answer.kh || '',
      keywords: faq?.keywords?.join(', ') || '',
      order: faq?.order ?? 0,
      active: faq?.active ?? true,
    },
  })

  const onSubmit = async (values: FAQFormValues) => {
    setIsSubmitting(true)
    try {
      const data = {
        category: values.category,
        question: {
          en: values.questionEn,
          kh: values.questionKh,
        },
        answer: {
          en: values.answerEn,
          kh: values.answerKh,
        },
        keywords: values.keywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0),
        order: values.order,
        active: values.active,
      }

      let result
      if (faq) {
        result = await updateFAQ(faq.id, data)
      } else {
        result = await createFAQ(data)
      }

      if (result.success) {
        toast.success(faq ? 'FAQ updated successfully' : 'FAQ created successfully')
        router.push('/admin/chatbot')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save FAQ')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/chatbot">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to list
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Shipping, Returns, Products" {...field} />
                  </FormControl>
                  <FormDescription>
                    Group related questions together
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Display order (0 = first)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Show this FAQ in the chatbot
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="delivery, tracking, order (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Help users find this FAQ through search
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>English Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="questionEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question (English) *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How long does shipping take?"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answerEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer (English) *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Standard shipping takes 3-5 business days..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Khmer Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="questionKh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question (Khmer) *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ការដឹកជញ្ជូនត្រូវការពេលប៉ុន្មាន?"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answerKh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer (Khmer) *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ការដឹកជញ្ជូនស្តង់ដារត្រូវការពី 3-5 ថ្ងៃធ្វើការ..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : faq ? 'Update FAQ' : 'Create FAQ'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/chatbot">Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  )
}
