import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 CONCURRENCY LIMITER (Server-Side Queue)
//    Free Supabase plan — keep concurrent DB
//    operations low to avoid connection limits.
// ==========================================
const MAX_CONCURRENT = 10       // Max simultaneous DB operations (free plan)
const MAX_QUEUE_SIZE = 100      // Max waiting requests before rejecting
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

// Fetch the pending attendance requests
export async function GET() {
  // 1. Auth check runs before the queue (no point queuing unauthorized requests)
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has('admin_session')

  if (!isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
  }

  // 2. Wait for a slot in the queue
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

  // 3. Process the request (guaranteed to have a slot)
  try {
    const { data, error } = await supabaseAdmin
      .from('attendance_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Fetch Attendance Approvals Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    releaseSlot()
  }
}

// Process the approvals/rejections
export async function POST(request: Request) {
  // 1. Auth check runs before the queue
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has('admin_session')

  if (!isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
  }

  // 2. Wait for a slot in the queue
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

  // 3. Process the request (guaranteed to have a slot)
  try {
    const { requestId, action } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    if (action === 'reject') {
      await supabaseAdmin.from('attendance_requests').delete().eq('id', requestId)
      return NextResponse.json({ success: true })
    }

    if (action === 'approve') {
      const { data: reqData, error: reqError } = await supabaseAdmin
        .from('attendance_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (reqError || !reqData) throw new Error("Could not find request")

      // 3. Upsert all records in a single database call (Bulk Insert)
      const { error: insertError } = await supabaseAdmin
        .from('attendance_records')
        .upsert({
          attendee_id: reqData.attendee_id,
          attendee_name: reqData.attendee_name,
          event_date: reqData.event_date,
          session_type: reqData.session_type
        }, { onConflict: 'attendee_id, event_date, session_type', ignoreDuplicates: true })

      if (insertError) throw new Error("Failed to insert attendance record: " + insertError.message)

      await supabaseAdmin.from('attendance_requests').delete().eq('id', requestId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Attendance Approvals Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    releaseSlot()
  }
}