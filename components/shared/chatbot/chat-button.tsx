'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface ChatButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  const t = useTranslations('chatbot')

  if (isOpen) return null

  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-36 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 p-0"
      aria-label={t('openChat')}
    >
      <MessageCircle className="h-5 w-5" />
    </Button>
  )
}
