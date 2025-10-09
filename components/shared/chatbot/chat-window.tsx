'use client'

import { X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatSearch } from './chat-search'
import { ChatMessage } from './chat-message'
import { SuggestionChips } from './suggestion-chips'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useRef } from 'react'

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

interface Message {
  id: string
  type: 'user' | 'bot'
  message: string
  timestamp: Date
}

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  faqs: FAQ[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onClearSearch: () => void
  isSearching: boolean
  locale: 'en' | 'kh'
  chatHistory: Message[]
  onSelectFAQ: (faq: FAQ) => void
  onResetChat: () => void
  showSuggestions: boolean
}

export function ChatWindow({
  isOpen,
  onClose,
  faqs,
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching,
  locale,
  chatHistory,
  onSelectFAQ,
  onResetChat,
  showSuggestions,
}: ChatWindowProps) {
  const t = useTranslations('chatbot')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  if (!isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md animate-in slide-in-from-bottom-8 duration-300">
      <Card className="shadow-2xl border-2 h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <CardTitle className="text-lg font-semibold">
            {t('title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetChat}
                className="h-8 w-8 p-0"
                aria-label="Reset chat"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label={t('closeChat')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-0 p-0 overflow-hidden">
          {/* Chat Messages Area */}
          <ScrollArea className="flex-1 px-4 pt-4">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2 max-w-sm">
                  <p className="text-sm text-muted-foreground">
                    👋 {locale === 'en' ? 'Hi! How can I help you today?' : 'សួស្តី! តើខ្ញុំអាចជួយអ្នកយ៉ាងដូចម្តេចថ្ងៃនេះ?'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'en' ? 'Type your question below or try:' : 'វាយសំណួររបស់អ្នកខាងក្រោម ឬសាកល្បង:'}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>• {locale === 'en' ? '"shipping"' : '"ការដឹកជញ្ជូន"'}</div>
                    <div>• {locale === 'en' ? '"return"' : '"ការត្រឡប់"'}</div>
                    <div>• {locale === 'en' ? '"payment"' : '"ការបង់ប្រាក់"'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {chatHistory.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg.message}
                    isBot={msg.type === 'bot'}
                    timestamp={msg.timestamp}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </ScrollArea>

          {/* Suggestions Area */}
          {showSuggestions && searchQuery.length > 0 && (
            <div className="px-4 py-3 border-t bg-muted/30">
              {isSearching ? (
                <p className="text-xs text-muted-foreground">Searching...</p>
              ) : (
                <SuggestionChips
                  faqs={faqs}
                  locale={locale}
                  onSelect={onSelectFAQ as any}
                />
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-background">
            <ChatSearch
              value={searchQuery}
              onChange={onSearchChange}
              onClear={onClearSearch}
              isSearching={isSearching}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('footer')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
