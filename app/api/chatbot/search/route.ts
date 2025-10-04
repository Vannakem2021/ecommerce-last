import { NextRequest, NextResponse } from 'next/server'
import { searchFAQs } from '@/lib/actions/chatbot-faq.actions'

// POST /api/chatbot/search - Search FAQs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, locale = 'en' } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const result = await searchFAQs(query, locale)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('POST /api/chatbot/search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/chatbot/search - Search FAQs (alternative with query params)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || searchParams.get('query')
    const locale = (searchParams.get('locale') || 'en') as 'en' | 'kh'

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const result = await searchFAQs(query, locale)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('GET /api/chatbot/search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
