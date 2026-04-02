import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 CONCURRENCY LIMITER (Server-Side Queue)
//    Free Supabase plan — keep concurrent DB
//    operations low to avoid connection limits.
// ==========================================
const MAX_CONCURRENT = 10       // Max simultaneous DB operations (free plan)
const MAX_QUEUE_SIZE = 500      // Max waiting requests before rejecting
const QUEUE_TIMEOUT_MS = 15000  // Max time a request waits in queue

let activeCount = 0
let queueSize = 0

function acquireSlot(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (activeCount < MAX_CONCURRENT) {
      activeCount++
      return resolve()
    }

    if (queueSize >= MAX_QUEUE_SIZE) {
      return reject(new Error('SERVER_BUSY'))
    }

    queueSize++

    const timeout = setTimeout(() => {
      queueSize--
      reject(new Error('QUEUE_TIMEOUT'))
    }, QUEUE_TIMEOUT_MS)

    const interval = setInterval(() => {
      if (activeCount < MAX_CONCURRENT) {
        clearInterval(interval)
        clearTimeout(timeout)
        queueSize--
        activeCount++
        resolve()
      }
    }, 50)
  })
}

function releaseSlot() {
  activeCount = Math.max(0, activeCount - 1)
}
// ==========================================

export async function POST(request: Request) {
  // 1. Wait for a slot in the queue
  try {
    await acquireSlot()
  } catch (err: any) {
    if (err.message === 'SERVER_BUSY') {
      return NextResponse.json(
        { success: false, error: 'The server is experiencing very high traffic. Please wait a moment and try again.' },
        { status: 503 }
      )
    }
    if (err.message === 'QUEUE_TIMEOUT') {
      return NextResponse.json(
        { success: false, error: 'Your request timed out due to high traffic. Please try again.' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }

  // 2. Process the request (guaranteed to have a slot)
  try {
    const { attendee_id, attendee_name, tt_ticket_id, requested_changes } = await request.json()

    if (!attendee_id || !attendee_name || !requested_changes) {
      return NextResponse.json({ success: false, error: 'Missing required data.' }, { status: 400 })
    }

    // Insert securely into the staging table using the Admin key
    const { error: insertError } = await supabaseAdmin
      .from('detail_approval_requests')
      .insert({
        attendee_id,
        attendee_name,
        tt_ticket_id,
        requested_changes
      })

    if (insertError) {
      throw new Error(insertError.message)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Request Update API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  } finally {
    // ⚠️ ALWAYS release the slot, even if the request errored
    releaseSlot()
  }
}