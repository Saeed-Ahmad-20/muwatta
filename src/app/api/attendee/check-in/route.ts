import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { ticketCode } = await request.json()

    if (!ticketCode) {
      return NextResponse.json({ success: false, error: 'Ticket Code is required.' }, { status: 400 })
    }

    // 1. Find the attendee by Ticket Code using Admin key
    const { data: attendee, error: fetchError } = await supabaseAdmin
      .from('attendees')
      .select('id, attendee_name, arabic_name, tt_ticket_id, checked_in_at')
      .eq('tt_ticket_id', ticketCode.trim())
      .single()

    if (fetchError || !attendee) {
      return NextResponse.json({ 
        success: false, 
        error: "Ticket Code not found. Please check your ticket and try again." 
      }, { status: 404 })
    }

    // 2. Check if they already did this
    if (attendee.checked_in_at) {
      return NextResponse.json({ 
        success: true, 
        attendee, 
        alreadyCheckedIn: true 
      })
    }

    // 3. Log their official arrival time
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('attendees')
      .update({ checked_in_at: now })
      .eq('id', attendee.id)

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        error: "Connection error. Please try again." 
      }, { status: 500 })
    }

    const updatedAttendee = { ...attendee, checked_in_at: now }

    return NextResponse.json({ 
      success: true, 
      attendee: updatedAttendee, 
      alreadyCheckedIn: false 
    })

  } catch (error: any) {
    console.error('Check-in API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}