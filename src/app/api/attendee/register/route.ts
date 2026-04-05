import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 CONCURRENCY LIMITER (Server-Side Queue)
// ==========================================
const MAX_CONCURRENT = 10
const MAX_QUEUE_SIZE = 500
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
// 🔒 SERVER-SIDE DATE HELPER
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
// 🔒 SHARED: Fetch full attendance from DB
// ==========================================
const EVENT_DATE_IDS = ['2026-04-04', '2026-04-05', '2026-04-06', '2026-04-07']

async function fetchAttendanceFromDB(attendeeId: number) {
  const { data: confirmed, error: confirmedError } = await supabaseAdmin
    .from('attendance_records')
    .select('event_date, session_type')
    .eq('attendee_id', attendeeId)
    .in('event_date', EVENT_DATE_IDS)

  if (confirmedError) {
    console.error('Error fetching confirmed records:', confirmedError)
    return null
  }

  const { data: pending, error: pendingError } = await supabaseAdmin
    .from('attendance_requests')
    .select('event_date, session_type')
    .eq('attendee_id', attendeeId)
    .in('event_date', EVENT_DATE_IDS)

  if (pendingError) {
    console.error('Error fetching pending requests:', pendingError)
    return null
  }

  const records: Record<string, { am: 'confirmed' | 'pending' | false; pm: 'confirmed' | 'pending' | false }> = {}

  for (const dateId of EVENT_DATE_IDS) {
    records[dateId] = { am: false, pm: false }
  }

  if (confirmed) {
    for (const row of confirmed) {
      if (records[row.event_date]) {
        records[row.event_date][row.session_type as 'am' | 'pm'] = 'confirmed'
      }
    }
  }

  if (pending) {
    for (const row of pending) {
      if (records[row.event_date]) {
        const session = row.session_type as 'am' | 'pm'
        if (records[row.event_date][session] === false) {
          records[row.event_date][session] = 'pending'
        }
      }
    }
  }

  return records
}

// ==========================================
// 🔒 SHARED: Verify attendee identity
// ==========================================
async function verifyAttendee(idNumber: string, postcode: string) {
  const { data: attendee, error: dbError } = await supabaseAdmin
    .from('attendees')
    .select('*')
    .eq('id', parseInt(idNumber))
    .single()

  if (dbError || !attendee) {
    return { error: "We couldn't find an attendee with that ID Number.", status: 404 }
  }

  const dbPostcode = (attendee.postal_code || '').replace(/\s+/g, '').toLowerCase()
  const inputPostcode = postcode.replace(/\s+/g, '').toLowerCase()

  if (dbPostcode !== inputPostcode) {
    return { error: "The postcode provided does not match our records for this ID Number.", status: 401 }
  }

  return { attendee }
}

// ==========================================
// 📖 GET — Fetch fresh attendance records
// ==========================================
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const idNumber = searchParams.get('idNumber')
    const postcode = searchParams.get('postcode')

    if (!idNumber || !postcode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: idNumber and postcode.' },
        { status: 400 }
      )
    }

    const result = await verifyAttendee(idNumber, postcode)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      )
    }

    const records = await fetchAttendanceFromDB(result.attendee.id)

    if (!records) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch attendance records.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, records })

  } catch (error: any) {
    console.error('Attendance GET Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  } finally {
    releaseSlot()
  }
}

// ==========================================
// ✏️ POST — Register attendance
// ==========================================
export async function POST(request: Request) {
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
    const { idNumber, postcode, selectedDate, selectedSessions } = await request.json()

    if (!idNumber || !postcode || !selectedDate || (!selectedSessions.am && !selectedSessions.pm)) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 })
    }

    // 🔒 SERVER decides if this is retroactive
    const serverToday = getServerTodayString()
    const isRetroactive = selectedDate < serverToday

    // 🔒 Reject future dates
    if (selectedDate > serverToday) {
      return NextResponse.json({ success: false, error: 'You cannot log attendance for a future date.' }, { status: 400 })
    }

    // Verify identity using shared helper
    const identity = await verifyAttendee(idNumber, postcode)

    if (identity.error) {
      return NextResponse.json(
        { success: false, error: identity.error },
        { status: identity.status }
      )
    }

    const attendee = identity.attendee

    // Security Gate: Check-In Check
    if (!attendee.checked_in_at) {
      return NextResponse.json({ success: false, error: "Access Denied: You must complete your Initial Arrival check-in at the 'Check-In' tab before you can log daily sessions." }, { status: 403 })
    }

    // 🔒 Route to the correct table
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

    // 🔒 Fetch fresh records from DB AFTER insert
    const attendanceRecords = await fetchAttendanceFromDB(attendee.id)

    return NextResponse.json({
      success: true,
      attendee,
      newAm, newPm, dupAm, dupPm,
      isRetroactive,
      attendanceRecords,
    })

  } catch (error: any) {
    console.error('Register API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  } finally {
    releaseSlot()
  }
}