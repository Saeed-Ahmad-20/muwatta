import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // <-- Now using the VIP admin key!

// NEW: Securely fetch the pending requests for the dashboard
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('detail_approval_requests')
      .select(`*, attendees (*)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Fetch Approvals Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// EXISTING: Process the approvals (Updated to use supabaseAdmin)
export async function POST(request: Request) {
  try {
    const { attendeeId, requestIds, approvedFields, action } = await request.json()

    if (!attendeeId || !requestIds || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    if (action === 'process') {
      const hasApprovedFields = Object.keys(approvedFields).length > 0;

      // 1. If fields were approved, update the main Supabase attendees table
      if (hasApprovedFields) {
        const { error: updateError } = await supabaseAdmin
          .from('attendees')
          .update(approvedFields)
          .eq('id', attendeeId)

        if (updateError) throw new Error("Failed to update database")

        // 2. Ticket Tailor Sync Logic
        const { data: attendee } = await supabaseAdmin
          .from('attendees')
          .select('tt_ticket_id, attendee_name, email')
          .eq('id', attendeeId)
          .single()

        if (attendee?.tt_ticket_id) {
          const apiKey = process.env.TICKET_TAILOR_API_KEY
          const updatedName = approvedFields.attendee_name || attendee.attendee_name || ''
          const updatedEmail = approvedFields.email || attendee.email || ''

          try {
            await fetch(`https://api.tickettailor.com/v1/issued_tickets/${attendee.tt_ticket_id}`, {
              method: 'PUT',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
              },
              body: new URLSearchParams({
                name: updatedName,
                email: updatedEmail
              })
            })
          } catch (e) {
            console.error("Ticket Tailor API Update Failed", e)
          }
        }
      }

      // 3. Update the status of all grouped requests
      const statusToApply = hasApprovedFields ? 'approved' : 'rejected';
      
      const { error: statusError } = await supabaseAdmin
        .from('detail_approval_requests')
        .update({ 
          status: statusToApply, 
          reviewed_at: new Date().toISOString() 
        })
        .in('id', requestIds)

      if (statusError) throw new Error("Failed to update request statuses")

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Approvals Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}