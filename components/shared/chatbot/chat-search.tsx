'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface ChatSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  isSearching?: boolean
}

export function ChatSearch({ value, onChange, onClear, isSearching }: ChatSearchProps) {
  const t = useTranslations('chatbot')

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={t('searchPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          aria-label={t('clearSearch')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {isSearching && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
