'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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

interface FAQAccordionProps {
  faqs: FAQ[]
  locale: 'en' | 'kh'
}

export function FAQAccordion({ faqs, locale }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  if (faqs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground text-center">
          {locale === 'en' 
            ? 'No FAQs found. Try a different search term.' 
            : 'រកមិនឃើញសំណួរ។ សូមព្យាយាមស្វែងរកផ្សេងទៀត។'}
        </p>
      </div>
    )
  }

  // Group FAQs by category
  const groupedFAQs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQ[]>)

  return (
    <div className="space-y-4">
      {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryFAQs.map((faq) => (
              <div
                key={faq.id}
                className="border rounded-lg overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-sm font-medium pr-2">
                    {faq.question[locale]}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 flex-shrink-0 transition-transform duration-200',
                      openId === faq.id && 'rotate-180'
                    )}
                  />
                </button>
                {openId === faq.id && (
                  <div className="px-3 pb-3 pt-1 border-t bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {faq.answer[locale]}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
