import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // Make sure this matches your file name

export async function POST(request: Request) {
  try {
    const { attendeeName, postcode } = await request.json()

    if (!attendeeName || !postcode) {
      return NextResponse.json({ success: false, error: 'Name and postcode are required.' }, { status: 400 })
    }

    // 1. Fetch using the Admin client (bypasses RLS)
    const { data: attendees, error: dbError } = await supabaseAdmin
      .from('attendees')
      .select('*')
      .ilike('attendee_name', attendeeName.trim())

    if (dbError || !attendees || attendees.length === 0) {
      return NextResponse.json({ success: false, error: "We couldn't find an attendee registered with that exact name. Please check your spelling." }, { status: 404 })
    }

    // 2. Validate Postcode
    const inputPostcode = postcode.replace(/\s+/g, '').toLowerCase()
    const matchedAttendee = attendees.find((a: any) => {
      const dbPostcode = (a.postal_code || '').replace(/\s+/g, '').toLowerCase()
      return dbPostcode === inputPostcode
    })

    if (!matchedAttendee) {
      return NextResponse.json({ success: false, error: "The postcode provided does not match our records for this name." }, { status: 401 })
    }

    // 3. Arrival Check
    if (!matchedAttendee.checked_in_at) {
      return NextResponse.json({ success: false, error: "Access Denied: You must complete your Initial Arrival Registration via the 'Check In' tab before you can view your details." }, { status: 403 })
    }

    // 4. Fetch Attendance Records
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('attendance_records')
      .select('*')
      .eq('attendee_id', matchedAttendee.id)

    if (recordsError) {
      console.error("Could not fetch attendance records", recordsError)
    }

    // Hand the validated data back to the client
    return NextResponse.json({
      success: true,
      attendee: matchedAttendee,
      records: records || []
    })

  } catch (error: any) {
    console.error('Verify API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}