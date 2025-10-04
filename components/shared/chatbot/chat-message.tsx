'use client'

import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: string
  isBot?: boolean
  timestamp?: Date
}

export function ChatMessage({ message, isBot = false, timestamp }: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex w-full mb-3',
        isBot ? 'justify-start' : 'justify-end'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 shadow-sm',
          isBot
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        {timestamp && (
          <p className="text-xs opacity-70 mt-1">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
