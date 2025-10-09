import { Metadata } from 'next'
import { getFAQs, getFAQCategories } from '@/lib/actions/chatbot-faq.actions'
import { FAQListClient } from './faq-list-client'

export const metadata: Metadata = {
  title: 'Chatbot FAQs',
}

export default async function ChatbotPage() {
  const [faqsResult, categoriesResult] = await Promise.all([
    getFAQs({ activeOnly: false }),
    getFAQCategories(),
  ])

  const faqs = faqsResult.success ? faqsResult.faqs : []
  const categories = categoriesResult.success ? categoriesResult.categories : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbot FAQs</h1>
          <p className="text-muted-foreground mt-2">
            Manage frequently asked questions for the chatbot
          </p>
        </div>
      </div>

      <FAQListClient initialFaqs={faqs || []} categories={categories || []} />
    </div>
  )
}
