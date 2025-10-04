import { NextRequest, NextResponse } from 'next/server'
import { getFAQs, createFAQ } from '@/lib/actions/chatbot-faq.actions'

// GET /api/chatbot/faqs - Get all FAQs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const locale = searchParams.get('locale') || undefined
    const category = searchParams.get('category') || undefined
    const activeOnly = searchParams.get('active') !== 'false'

    const result = await getFAQs({
      locale: locale as 'en' | 'kh' | undefined,
      category,
      activeOnly,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('GET /api/chatbot/faqs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chatbot/faqs - Create new FAQ (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await createFAQ(body)

    if (!result.success) {
      const status = result.error?.includes('Unauthorized') ? 401 
        : result.error?.includes('Forbidden') ? 403
        : result.error?.includes('required') ? 400
        : 500

      return NextResponse.json(
        { error: result.error },
        { status }
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/chatbot/faqs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
