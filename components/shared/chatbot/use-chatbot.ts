import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'

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
  keywords: string[]
  order: number
}

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  message: string
  timestamp: Date
}

export function useChatbot() {
  const currentLocale = useLocale()
  const locale = (currentLocale === 'kh' ? 'kh' : 'en') as 'en' | 'kh'
  const [isOpen, setIsOpen] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Fetch all FAQs on mount
  useEffect(() => {
    const fetchFAQs = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/chatbot/faqs?active=true')
        const data = await response.json()
        
        if (data.success) {
          setFaqs(data.faqs)
          setFilteredFaqs(data.faqs)
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(data.faqs.map((faq: FAQ) => faq.category))
          ).sort()
          setCategories(uniqueCategories as string[])
        }
      } catch (error) {
        console.error('Failed to fetch FAQs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchFAQs()
    }
  }, [isOpen])

  // Search FAQs
  const searchFAQs = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        // Reset to all FAQs or filtered by category
        if (selectedCategory) {
          setFilteredFaqs(faqs.filter(faq => faq.category === selectedCategory))
        } else {
          setFilteredFaqs(faqs)
        }
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch('/api/chatbot/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, locale }),
        })
        const data = await response.json()
        
        if (data.success) {
          setFilteredFaqs(data.faqs)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsSearching(false)
      }
    },
    [faqs, selectedCategory, locale]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFAQs(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchFAQs])

  // Filter by category
  useEffect(() => {
    if (selectedCategory) {
      if (searchQuery.trim()) {
        // If searching, filter search results by category
        searchFAQs(searchQuery)
      } else {
        // Otherwise, filter all FAQs by category
        setFilteredFaqs(faqs.filter(faq => faq.category === selectedCategory))
      }
    } else {
      if (!searchQuery.trim()) {
        setFilteredFaqs(faqs)
      }
    }
  }, [selectedCategory, faqs, searchQuery, searchFAQs])

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setShowSuggestions(true)
  }, [])

  const handleSelectFAQ = useCallback((faq: FAQ) => {
    // Add user question to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: faq.question[locale],
      timestamp: new Date(),
    }

    // Add bot answer to chat
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      message: faq.answer[locale],
      timestamp: new Date(),
    }

    setChatHistory(prev => [...prev, userMessage, botMessage])
    setSearchQuery('')
    setFilteredFaqs([])
    setShowSuggestions(false)
  }, [locale])

  const resetChat = useCallback(() => {
    setChatHistory([])
    setSearchQuery('')
    setFilteredFaqs([])
    setShowSuggestions(true)
  }, [])

  return {
    isOpen,
    toggleChat,
    closeChat,
    faqs: filteredFaqs,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    clearSearch,
    isLoading,
    isSearching,
    locale,
    chatHistory,
    handleSelectFAQ,
    resetChat,
    showSuggestions,
  }
}
