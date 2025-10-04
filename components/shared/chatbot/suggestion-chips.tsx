'use client'

import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

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
}

interface SuggestionChipsProps {
  faqs: FAQ[]
  locale: 'en' | 'kh'
  onSelect: (faq: FAQ) => void
}

export function SuggestionChips({ faqs, locale, onSelect }: SuggestionChipsProps) {
  if (faqs.length === 0) return null

  return (
    <div className="space-y-2 mb-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MessageSquare className="h-3 w-3" />
        Did you mean:
      </p>
      <div className="flex flex-wrap gap-2">
        {faqs.slice(0, 5).map((faq) => (
          <button
            key={faq.id}
            onClick={() => onSelect(faq)}
            className="group"
          >
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-left max-w-full"
            >
              <span className="truncate block max-w-[250px]">
                {faq.question[locale]}
              </span>
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}
