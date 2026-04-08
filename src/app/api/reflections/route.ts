import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// Validation constants
// ==========================================
const MAX_NAME_LENGTH = 100
const MAX_LOCATION_LENGTH = 150
const MAX_MESSAGE_LENGTH = 3000
// ==========================================

interface ReflectionRequestBody {
  name?: string
  location?: string
  message?: string
  is_anonymous?: boolean
}

function sanitize(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
}

function validateReflection(body: ReflectionRequestBody): string | null {
  if (!body || typeof body !== 'object') {
    return 'Invalid request body.'
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
    return 'Message is required.'
  }

  if (body.message.trim().length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`
  }

  if (body.is_anonymous !== undefined && typeof body.is_anonymous !== 'boolean') {
    return 'is_anonymous must be a boolean.'
  }

  // Only validate name/location if not anonymous
  if (!body.is_anonymous) {
    if (body.name !== undefined && body.name !== null) {
      if (typeof body.name !== 'string') {
        return 'Name must be a string.'
      }
      if (body.name.trim().length > MAX_NAME_LENGTH) {
        return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
      }
    }

    if (body.location !== undefined && body.location !== null) {
      if (typeof body.location !== 'string') {
        return 'Location must be a string.'
      }
      if (body.location.trim().length > MAX_LOCATION_LENGTH) {
        return `Location must be ${MAX_LOCATION_LENGTH} characters or fewer.`
      }
    }
  }

  return null
}

// ==========================================
// PUBLIC GET: Fetch ONLY approved reflections
// ==========================================
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reflections')
      .select('id, name, location, message, is_anonymous, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Reflections GET] Supabase error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Failed to load reflections. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Reflections GET] Unexpected error:', message)

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

// ==========================================
// PUBLIC POST: Submit a new reflection
//              (defaults to unapproved)
// ==========================================
export async function POST(request: Request) {
  try {
    let body: ReflectionRequestBody

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body.' },
        { status: 400 }
      )
    }

    const validationError = validateReflection(body)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      )
    }

    const isAnonymous = body.is_anonymous === true
    const sanitizedMessage = sanitize(body.message!)
    const sanitizedName = !isAnonymous && body.name ? sanitize(body.name) : null
    const sanitizedLocation = !isAnonymous && body.location ? sanitize(body.location) : null

    // Final guard after sanitization
    if (!sanitizedMessage) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('reflections')
      .insert([{
        name: sanitizedName,
        location: sanitizedLocation,
        message: sanitizedMessage,
        is_anonymous: isAnonymous,
        is_approved: false,
      }])

    if (error) {
      console.error('[Reflections POST] Supabase error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Failed to submit reflection. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Reflections POST] Unexpected error:', message)

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}