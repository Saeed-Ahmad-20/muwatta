import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    // 1. SECURITY GATEWAY
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.has('admin_session')
    
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // 2. HANDLE ADDING A RECORD
    if (action === 'add') {
      const { attendee_id, attendee_name, event_date, session_type } = body
      
      if (!attendee_id || !event_date || !session_type) {
        return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 })
      }

      const { data, error } = await supabaseAdmin
        .from('attendance_records')
        .upsert({
          attendee_id,
          attendee_name,
          event_date,
          session_type
        }, { onConflict: 'attendee_id, event_date, session_type', ignoreDuplicates: true })
        .select()
        .single() // Return the newly created record to instantly update the UI

      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, record: data })
    }

    // 3. HANDLE REMOVING A RECORD
    if (action === 'remove') {
      const { recordId } = body
      
      if (!recordId) {
        return NextResponse.json({ success: false, error: 'Missing record ID.' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('attendance_records')
        .delete()
        .eq('id', recordId)

      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified.' }, { status: 400 })

  } catch (error: any) {
    console.error('Direct Attendance API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}