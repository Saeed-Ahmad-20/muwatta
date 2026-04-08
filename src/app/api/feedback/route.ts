import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// Validation constants
// ==========================================
const MAX_NAME_LENGTH = 100
const MAX_MESSAGE_LENGTH = 2000
// ==========================================

interface FeedbackRequestBody {
  name?: string
  message?: string
}

function sanitize(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
}

function validateFeedback(body: FeedbackRequestBody): string | null {
  if (!body || typeof body !== 'object') {
    return 'Invalid request body.'
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
    return 'Message is required.'
  }

  if (body.message.trim().length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`
  }

  if (body.name !== undefined && body.name !== null) {
    if (typeof body.name !== 'string') {
      return 'Name must be a string.'
    }
    if (body.name.trim().length > MAX_NAME_LENGTH) {
      return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
    }
  }

  return null
}

export async function POST(request: Request) {
  try {
    let body: FeedbackRequestBody

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body.' },
        { status: 400 }
      )
    }

    const validationError = validateFeedback(body)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      )
    }

    const sanitizedName = body.name ? sanitize(body.name) : null
    const sanitizedMessage = sanitize(body.message!)

    // Final guard after sanitization
    if (!sanitizedMessage) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('feedback')
      .insert([{
        name: sanitizedName || null,
        message: sanitizedMessage,
      }])

    if (error) {
      console.error('[Feedback POST] Supabase error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Failed to submit feedback. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Feedback POST] Unexpected error:', message)

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}