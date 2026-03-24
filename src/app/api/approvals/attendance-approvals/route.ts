import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { requestId, action } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    if (action === 'reject') {
      await supabase.from('attendance_requests').delete().eq('id', requestId)
      return NextResponse.json({ success: true })
    }

    if (action === 'approve') {
      const { data: reqData, error: reqError } = await supabase
        .from('attendance_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (reqError || !reqData) throw new Error("Could not find request")

      const { error: insertError } = await supabase
        .from('attendance_records')
        .upsert({
          attendee_id: reqData.attendee_id,
          attendee_name: reqData.attendee_name,
          event_date: reqData.event_date,
          session_type: reqData.session_type
        }, { onConflict: 'attendee_id, event_date, session_type', ignoreDuplicates: true })

      if (insertError) throw insertError

      await supabase.from('attendance_requests').delete().eq('id', requestId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Attendance Approvals Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}