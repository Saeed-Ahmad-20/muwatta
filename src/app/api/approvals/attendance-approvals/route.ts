import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 CONCURRENCY LIMITER (unchanged)
// ==========================================
const MAX_CONCURRENT = 10
const MAX_QUEUE_SIZE = 100
const QUEUE_TIMEOUT_MS = 15000

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

// GET — unchanged
export async function GET() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has('admin_session')

  if (!isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
  }

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
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 })
  }

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

// POST — now supports bulk via `requestIds` array
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has('admin_session')

  if (!isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
  }

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
    return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action } = body

    // ── Normalise to an array (supports legacy `requestId` too) ──
    let ids: number[] = []

    if (Array.isArray(body.requestIds) && body.requestIds.length > 0) {
      ids = body.requestIds
    } else if (body.requestId) {
      ids = [body.requestId]
    }

    if (ids.length === 0 || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    // ── REJECT (bulk) ────────────────────────────────────
    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('attendance_requests')
        .delete()
        .in('id', ids)

      if (error) throw new Error('Failed to reject requests: ' + error.message)

      return NextResponse.json({ success: true })
    }

    // ── APPROVE (bulk) ───────────────────────────────────
    if (action === 'approve') {
      // 1. Fetch every request in one query
      const { data: reqRows, error: fetchError } = await supabaseAdmin
        .from('attendance_requests')
        .select('*')
        .in('id', ids)

      if (fetchError) throw new Error('Could not fetch requests: ' + fetchError.message)
      if (!reqRows || reqRows.length === 0) throw new Error('No matching requests found')

      // 2. Bulk upsert into attendance_records
      const records = reqRows.map(r => ({
        attendee_id: r.attendee_id,
        attendee_name: r.attendee_name,
        event_date: r.event_date,
        session_type: r.session_type
      }))

      const { error: insertError } = await supabaseAdmin
        .from('attendance_records')
        .upsert(records, { onConflict: 'attendee_id, event_date, session_type', ignoreDuplicates: true })

      if (insertError) throw new Error('Failed to insert attendance records: ' + insertError.message)

      // 3. Bulk delete the approved requests
      const { error: deleteError } = await supabaseAdmin
        .from('attendance_requests')
        .delete()
        .in('id', ids)

      if (deleteError) throw new Error('Records inserted but failed to clean up requests: ' + deleteError.message)

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