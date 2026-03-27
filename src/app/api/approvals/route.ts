import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
        const { error: updateError } = await supabase
          .from('attendees')
          .update(approvedFields)
          .eq('id', attendeeId)

        if (updateError) throw new Error("Failed to update database")

        // 2. Ticket Tailor Sync Logic
        // We need to fetch the original attendee data to prevent blanking out the name/email 
        // if they were not part of the approved fields.
        const { data: attendee } = await supabase
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

      // 3. Update the status of all grouped requests in the staging table
      // If we approved anything, mark it as 'approved', otherwise 'rejected'
      const statusToApply = hasApprovedFields ? 'approved' : 'rejected';
      
      const { error: statusError } = await supabase
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