'use client'

import { useChatbot } from './use-chatbot'
import { ChatButton } from './chat-button'
import { ChatWindow } from './chat-window'

export function ChatbotWidget() {
  const {
    isOpen,
    toggleChat,
    closeChat,
    faqs,
    locale,
  } = useChatbot()

  return (
    <>
      <ChatButton onClick={toggleChat} isOpen={isOpen} />
      <ChatWindow
        isOpen={isOpen}
        onClose={closeChat}
        faqs={faqs}
        locale={locale}
      />
    </>
  )
}
