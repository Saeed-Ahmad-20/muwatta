import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// NEW: Securely fetch the pending attendance requests
export async function GET() {
  try {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.has('admin_session')
    
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

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
  }
}

// EXISTING: Process the approvals/rejections
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.has('admin_session')
    
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

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
  }
}