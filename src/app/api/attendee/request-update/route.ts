import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
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
  }
}