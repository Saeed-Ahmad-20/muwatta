import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { idNumber, postcode, selectedDate, selectedSessions, isRetroactive } = await request.json()

    if (!idNumber || !postcode || !selectedDate || (!selectedSessions.am && !selectedSessions.pm)) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 })
    }

    // 1. Verify Attendee Exists (Bypass RLS)
    const { data: attendee, error: dbError } = await supabaseAdmin
      .from('attendees')
      .select('*')
      .eq('id', parseInt(idNumber))
      .single()

    if (dbError || !attendee) {
      return NextResponse.json({ success: false, error: "We couldn't find an attendee with that ID Number." }, { status: 404 })
    }

    // 2. Security Check: Verify Postcode
    const dbPostcode = (attendee.postal_code || '').replace(/\s+/g, '').toLowerCase()
    const inputPostcode = postcode.replace(/\s+/g, '').toLowerCase()

    if (dbPostcode !== inputPostcode) {
      return NextResponse.json({ success: false, error: "The postcode provided does not match our records for this ID Number." }, { status: 401 })
    }

    // 3. Security Gate: Event Arrival Check
    if (!attendee.checked_in_at) {
      return NextResponse.json({ success: false, error: "Access Denied: You must complete your Initial Arrival check-in at the 'Event Arrival' tab before you can log daily sessions." }, { status: 403 })
    }

    const targetTable = isRetroactive ? 'attendance_requests' : 'attendance_records'

    // 4. Smart Duplicate Checker
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

    // 5. Save only the new records
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

    return NextResponse.json({ 
      success: true, 
      attendee,
      newAm, newPm, dupAm, dupPm
    })

  } catch (error: any) {
    console.error('Register API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}