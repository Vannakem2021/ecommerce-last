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
    searchQuery,
    setSearchQuery,
    clearSearch,
    isSearching,
    locale,
    chatHistory,
    handleSelectFAQ,
    resetChat,
    showSuggestions,
  } = useChatbot()

  return (
    <>
      <ChatButton onClick={toggleChat} isOpen={isOpen} />
      <ChatWindow
        isOpen={isOpen}
        onClose={closeChat}
        faqs={faqs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        isSearching={isSearching}
        locale={locale}
        chatHistory={chatHistory}
        onSelectFAQ={handleSelectFAQ}
        onResetChat={resetChat}
        showSuggestions={showSuggestions}
      />
    </>
  )
}
