import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 CONCURRENCY LIMITER (Server-Side Queue)
//    Protects the database from being overwhelmed
//    by 500+ simultaneous requests. Only N requests
//    hit Supabase at a time — the rest wait in line.
// ==========================================
const MAX_CONCURRENT = 10       // Max simultaneous DB operations
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
// 🔒 SERVER-SIDE DATE HELPER
//    Gets today's date in London timezone.
//    This is the source of truth — never
//    trust the client's date/time.
// ==========================================
function getServerTodayString(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(new Date())
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00'

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
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
    // ⚠️ isRetroactive is intentionally NOT destructured from the client
    const { idNumber, postcode, selectedDate, selectedSessions } = await request.json()

    if (!idNumber || !postcode || !selectedDate || (!selectedSessions.am && !selectedSessions.pm)) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 })
    }

    // 🔒 SERVER decides if this is retroactive — client cannot influence this
    const serverToday = getServerTodayString()
    const isRetroactive = selectedDate < serverToday

    // Verify Attendee Exists (Bypass RLS)
    const { data: attendee, error: dbError } = await supabaseAdmin
      .from('attendees')
      .select('*')
      .eq('id', parseInt(idNumber))
      .single()

    if (dbError || !attendee) {
      return NextResponse.json({ success: false, error: "We couldn't find an attendee with that ID Number." }, { status: 404 })
    }

    // Security Check: Verify Postcode
    const dbPostcode = (attendee.postal_code || '').replace(/\s+/g, '').toLowerCase()
    const inputPostcode = postcode.replace(/\s+/g, '').toLowerCase()

    if (dbPostcode !== inputPostcode) {
      return NextResponse.json({ success: false, error: "The postcode provided does not match our records for this ID Number." }, { status: 401 })
    }

    // Security Gate: Event Arrival Check
    if (!attendee.checked_in_at) {
      return NextResponse.json({ success: false, error: "Access Denied: You must complete your Initial Arrival check-in at the 'Event Arrival' tab before you can log daily sessions." }, { status: 403 })
    }

    // 🔒 Route to the correct table based on SERVER-calculated retroactive status
    const targetTable = isRetroactive ? 'attendance_requests' : 'attendance_records'

    // Smart Duplicate Checker
    const { data: existingRecords, error: existingError } = await supabaseAdmin
      .from(targetTable)
      .select('session_type')
      .eq('attendee_id', attendee.id)
      .eq('event_date', selectedDate)

    if (existingError) {
      return NextResponse.json({ success: false, error: "Could not verify your previous attendance logs." }, { status: 500 })
    }

    const alreadyLoggedAm = existingRecords?.some(r => r.session_type === 'am')
    const alreadyLoggedPm = existingRecords?.some(r => r.session_type === 'pm')

    const attemptAm = selectedSessions.am
    const attemptPm = selectedSessions.pm

    const dupAm = attemptAm && alreadyLoggedAm
    const dupPm = attemptPm && alreadyLoggedPm

    const newAm = attemptAm && !alreadyLoggedAm
    const newPm = attemptPm && !alreadyLoggedPm

    // Reject if trying to log something they already logged
    if (attemptAm && attemptPm && dupAm && dupPm) {
      return NextResponse.json({ success: false, error: "You have already logged your attendance for BOTH the AM and PM sessions on this date." }, { status: 400 })
    } else if (attemptAm && !attemptPm && dupAm) {
      return NextResponse.json({ success: false, error: "You have already logged your attendance for the AM session on this date." }, { status: 400 })
    } else if (!attemptAm && attemptPm && dupPm) {
      return NextResponse.json({ success: false, error: "You have already logged your attendance for the PM session on this date." }, { status: 400 })
    }

    // Save only the new records
    const recordsToInsert = []
    if (newAm) {
      recordsToInsert.push({ attendee_id: attendee.id, attendee_name: attendee.attendee_name, event_date: selectedDate, session_type: 'am' })
    }
    if (newPm) {
      recordsToInsert.push({ attendee_id: attendee.id, attendee_name: attendee.attendee_name, event_date: selectedDate, session_type: 'pm' })
    }

    const { error: insertError } = await supabaseAdmin
      .from(targetTable)
      .upsert(recordsToInsert, { onConflict: 'attendee_id, event_date, session_type', ignoreDuplicates: true })

    if (insertError) {
      return NextResponse.json({ success: false, error: "Failed to save attendance to the database. Please try again." }, { status: 500 })
    }

    // 🔒 Return the SERVER-calculated isRetroactive so the frontend shows the right UI
    return NextResponse.json({
      success: true,
      attendee,
      newAm, newPm, dupAm, dupPm,
      isRetroactive
    })

  } catch (error: any) {
    console.error('Register API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  } finally {
    releaseSlot()
  }
}