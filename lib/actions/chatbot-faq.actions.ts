'use server'

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import ChatbotFAQ, { IChatbotFAQ } from '@/lib/db/models/chatbot-faq.model'
import { revalidatePath } from 'next/cache'
import mongoose from 'mongoose'

// Get all active FAQs (public - no auth required)
export async function getFAQs(options?: {
  locale?: string
  category?: string
  activeOnly?: boolean
}) {
  try {
    await connectToDatabase()

    const query: any = {}
    
    if (options?.activeOnly !== false) {
      query.active = true
    }
    
    if (options?.category) {
      query.category = options.category
    }

    const faqs = await ChatbotFAQ.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean()

    return {
      success: true,
      faqs: faqs.map((faq) => ({
        id: faq._id.toString(),
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        order: faq.order,
        active: faq.active,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt,
      })),
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return { success: false, error: 'Failed to fetch FAQs' }
  }
}

// Get single FAQ by ID
export async function getFAQById(id: string) {
  try {
    await connectToDatabase()

    const faq = await ChatbotFAQ.findById(id).lean()

    if (!faq) {
      return { success: false, error: 'FAQ not found' }
    }

    return {
      success: true,
      faq: {
        id: faq._id.toString(),
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        order: faq.order,
        active: faq.active,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt,
      },
    }
  } catch (error) {
    console.error('Error fetching FAQ:', error)
    return { success: false, error: 'Failed to fetch FAQ' }
  }
}

// Create new FAQ (admin only)
export async function createFAQ(data: {
  category: string
  question: { en: string; kh: string }
  answer: { en: string; kh: string }
  keywords?: string[]
  order?: number
  active?: boolean
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Forbidden - Admin only' }
    }

    await connectToDatabase()

    // Validate required fields
    if (!data.category || !data.question?.en || !data.question?.kh || !data.answer?.en || !data.answer?.kh) {
      return { success: false, error: 'Missing required fields' }
    }

    const faq = await ChatbotFAQ.create({
      ...data,
      createdBy: new mongoose.Types.ObjectId(session.user.id),
    })

    revalidatePath('/admin/chatbot')
    revalidatePath('/api/chatbot/faqs')

    return {
      success: true,
      faq: {
        id: faq._id.toString(),
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        order: faq.order,
        active: faq.active,
      },
    }
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return { success: false, error: 'Failed to create FAQ' }
  }
}

// Update FAQ (admin only)
export async function updateFAQ(
  id: string,
  data: Partial<{
    category: string
    question: { en: string; kh: string }
    answer: { en: string; kh: string }
    keywords: string[]
    order: number
    active: boolean
  }>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Forbidden - Admin only' }
    }

    await connectToDatabase()

    const faq = await ChatbotFAQ.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )

    if (!faq) {
      return { success: false, error: 'FAQ not found' }
    }

    revalidatePath('/admin/chatbot')
    revalidatePath('/api/chatbot/faqs')

    return {
      success: true,
      faq: {
        id: faq._id.toString(),
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        order: faq.order,
        active: faq.active,
      },
    }
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return { success: false, error: 'Failed to update FAQ' }
  }
}

// Delete FAQ (admin only)
export async function deleteFAQ(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Forbidden - Admin only' }
    }

    await connectToDatabase()

    const faq = await ChatbotFAQ.findByIdAndDelete(id)

    if (!faq) {
      return { success: false, error: 'FAQ not found' }
    }

    revalidatePath('/admin/chatbot')
    revalidatePath('/api/chatbot/faqs')

    return { success: true, message: 'FAQ deleted successfully' }
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return { success: false, error: 'Failed to delete FAQ' }
  }
}

// Reorder FAQs (admin only)
export async function reorderFAQs(items: { id: string; order: number }[]) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Forbidden - Admin only' }
    }

    await connectToDatabase()

    // Update order for each FAQ
    const updatePromises = items.map((item) =>
      ChatbotFAQ.findByIdAndUpdate(item.id, { order: item.order })
    )

    await Promise.all(updatePromises)

    revalidatePath('/admin/chatbot')
    revalidatePath('/api/chatbot/faqs')

    return { success: true, message: 'FAQs reordered successfully' }
  } catch (error) {
    console.error('Error reordering FAQs:', error)
    return { success: false, error: 'Failed to reorder FAQs' }
  }
}

// Search FAQs by query (public)
export async function searchFAQs(query: string, locale: 'en' | 'kh' = 'en') {
  try {
    await connectToDatabase()

    if (!query || query.trim().length === 0) {
      return { success: true, faqs: [] }
    }

    const searchQuery = query.trim().toLowerCase()

    // Search in questions, answers, and keywords
    const faqs = await ChatbotFAQ.find({
      active: true,
      $or: [
        { [`question.${locale}`]: { $regex: searchQuery, $options: 'i' } },
        { [`answer.${locale}`]: { $regex: searchQuery, $options: 'i' } },
        { keywords: { $in: [new RegExp(searchQuery, 'i')] } },
      ],
    })
      .sort({ order: 1 })
      .limit(10)
      .lean()

    return {
      success: true,
      faqs: faqs.map((faq) => ({
        id: faq._id.toString(),
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        order: faq.order,
      })),
    }
  } catch (error) {
    console.error('Error searching FAQs:', error)
    return { success: false, error: 'Failed to search FAQs' }
  }
}

// Get unique categories (public)
export async function getFAQCategories() {
  try {
    await connectToDatabase()

    const categories = await ChatbotFAQ.distinct('category', { active: true })

    return {
      success: true,
      categories: categories.sort(),
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: 'Failed to fetch categories' }
  }
}

// Toggle FAQ active status (admin only)
export async function toggleFAQActive(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is admin
    if (session.user.role?.toLowerCase() !== 'admin') {
      return { success: false, error: 'Forbidden - Admin only' }
    }

    await connectToDatabase()

    const faq = await ChatbotFAQ.findById(id)

    if (!faq) {
      return { success: false, error: 'FAQ not found' }
    }

    faq.active = !faq.active
    await faq.save()

    revalidatePath('/admin/chatbot')
    revalidatePath('/api/chatbot/faqs')

    return {
      success: true,
      active: faq.active,
      message: `FAQ ${faq.active ? 'activated' : 'deactivated'} successfully`,
    }
  } catch (error) {
    console.error('Error toggling FAQ active status:', error)
    return { success: false, error: 'Failed to toggle FAQ status' }
  }
}
