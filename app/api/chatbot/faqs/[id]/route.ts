import { NextRequest, NextResponse } from 'next/server'
import { 
  getFAQById, 
  updateFAQ, 
  deleteFAQ 
} from '@/lib/actions/chatbot-faq.actions'

// GET /api/chatbot/faqs/[id] - Get single FAQ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getFAQById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'FAQ not found' ? 404 : 500 }
      )
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('GET /api/chatbot/faqs/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/chatbot/faqs/[id] - Update FAQ (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const result = await updateFAQ(id, body)

    if (!result.success) {
      const status = result.error?.includes('Unauthorized') ? 401 
        : result.error?.includes('Forbidden') ? 403
        : result.error?.includes('not found') ? 404
        : 500

      return NextResponse.json(
        { error: result.error },
        { status }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    const { id } = await params
    console.error(`PATCH /api/chatbot/faqs/${id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/chatbot/faqs/[id] - Delete FAQ (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteFAQ(id)

    if (!result.success) {
      const status = result.error?.includes('Unauthorized') ? 401 
        : result.error?.includes('Forbidden') ? 403
        : result.error?.includes('not found') ? 404
        : 500

      return NextResponse.json(
        { error: result.error },
        { status }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    const { id } = await params
    console.error(`DELETE /api/chatbot/faqs/${id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
