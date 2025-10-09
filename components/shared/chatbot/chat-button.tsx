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
      size="lg"
      className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
      aria-label={t('openChat')}
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  )
}
