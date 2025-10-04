import { NextRequest, NextResponse } from 'next/server'
import { getFAQCategories } from '@/lib/actions/chatbot-faq.actions'

// GET /api/chatbot/categories - Get all unique categories
export async function GET(request: NextRequest) {
  try {
    const result = await getFAQCategories()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('GET /api/chatbot/categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
