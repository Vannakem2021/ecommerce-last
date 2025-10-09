'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FAQAccordion } from './faq-accordion'
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

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  faqs: FAQ[]
  locale: 'en' | 'kh'
}

export function ChatWindow({
  isOpen,
  onClose,
  faqs,
  locale,
}: ChatWindowProps) {
  const t = useTranslations('chatbot')

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-full sm:max-w-sm animate-in slide-in-from-bottom-8 duration-300">
      <Card className="shadow-2xl border-2 h-[calc(100vh-8rem)] sm:h-[450px] max-h-[450px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle className="text-lg font-semibold">
            {locale === 'en' ? 'Frequently Asked Questions' : 'សំណួរដែលសួរញឹកញាប់'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label={t('closeChat')}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-0 p-0 overflow-hidden">
          {/* FAQ List Area */}
          <ScrollArea className="flex-1 px-4 pt-4 pb-4">
            <FAQAccordion faqs={faqs} locale={locale} />
          </ScrollArea>

          {/* Footer */}
          <div className="p-2 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {locale === 'en' 
                ? 'Click a question to see answer' 
                : 'ចុចសំណួរដើម្បីមើលចម្លើយ'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
