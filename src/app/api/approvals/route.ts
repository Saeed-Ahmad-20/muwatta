import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { requestId, action } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    if (action === 'reject') {
      // User rejected it, so we delete the request
      await supabase.from('attendee_update_requests').delete().eq('id', requestId)
      return NextResponse.json({ success: true })
    }

    if (action === 'approve') {
      // 1. Fetch the requested changes
      const { data: reqData, error: reqError } = await supabase
        .from('attendee_update_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (reqError || !reqData) throw new Error("Could not find request")

      // 2. Fetch the original attendee record
      const { data: attendee, error: attError } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', reqData.attendee_id)
        .single()

      if (attError || !attendee) throw new Error("Could not find attendee")

      // 3. Update the main Supabase table with the new details
      const updatePayload = {
        attendee_name: reqData.attendee_name,
        email: reqData.email,
        mobile_number: reqData.mobile_number,
        address_line: reqData.address_line,
        city: reqData.city,
        postal_code: reqData.postal_code,
        country: reqData.country,
        emergency_contact_name: reqData.emergency_contact_name,
        emergency_contact_number: reqData.emergency_contact_number,
        medical_conditions: reqData.medical_conditions,
        position: reqData.position,
        arabic_name: reqData.arabic_name
      }

      await supabase.from('attendees').update(updatePayload).eq('id', attendee.id)

      // 4. Update standard fields in Ticket Tailor (if we have their TT ID)
      if (attendee.tt_ticket_id) {
        const apiKey = process.env.TICKET_TAILOR_API_KEY
        try {
          await fetch(`https://api.tickettailor.com/v1/issued_tickets/${attendee.tt_ticket_id}`, {
            method: 'PUT',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
            },
            body: new URLSearchParams({
              name: reqData.attendee_name || '',
              email: reqData.email || ''
            })
          })
        } catch (e) {
          console.error("Ticket Tailor API Update Failed - but local DB was updated successfully", e)
        }
      }

      // 5. Delete the pending request from the queue
      await supabase.from('attendee_update_requests').delete().eq('id', requestId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Approvals Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}