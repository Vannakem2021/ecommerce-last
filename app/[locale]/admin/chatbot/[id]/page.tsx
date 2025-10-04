import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFAQById } from '@/lib/actions/chatbot-faq.actions'
import { FAQForm } from './faq-form'

export const metadata: Metadata = {
  title: 'Edit FAQ',
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditFAQPage({ params }: PageProps) {
  const { id } = await params

  if (id === 'new') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create FAQ</h1>
          <p className="text-muted-foreground mt-2">
            Add a new frequently asked question
          </p>
        </div>
        <FAQForm />
      </div>
    )
  }

  const result = await getFAQById(id)

  if (!result.success || !result.faq) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit FAQ</h1>
        <p className="text-muted-foreground mt-2">
          Update the frequently asked question
        </p>
      </div>
      <FAQForm faq={result.faq} />
    </div>
  )
}
