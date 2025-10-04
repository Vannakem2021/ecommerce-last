'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  order: number
}

interface FAQListProps {
  faqs: FAQ[]
  locale: 'en' | 'kh'
  isLoading?: boolean
}

export function FAQList({ faqs, locale, isLoading }: FAQListProps) {
  const t = useTranslations('chatbot')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (faqs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{t('noResults')}</p>
          <p className="text-xs text-muted-foreground">{t('tryDifferentQuery')}</p>
        </div>
      </div>
    )
  }

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-6 pb-4">
        {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {categoryFaqs.length} {categoryFaqs.length === 1 ? t('question') : t('questions')}
              </span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {categoryFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="text-sm font-medium">
                      {faq.question[locale] || faq.question.en}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap pt-2">
                      {faq.answer[locale] || faq.answer.en}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
