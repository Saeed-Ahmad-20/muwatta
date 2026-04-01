import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { attendee_name, city, country, arabic_name, admission_type } = body

    // Basic validation
    if (!attendee_name || !admission_type) {
      return NextResponse.json({ success: false, error: 'Full Name and Admission Type are required.' }, { status: 400 })
    }

    // Generate a unique dummy ticket ID for manual entries
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const timeSuffix = Date.now().toString().slice(-6)
    const manualTicketId = `MANUAL-${timeSuffix}-${randomSuffix}`

    // 1. Prepare the record for the main attendees table (No ID provided)
    const record = {
      tt_ticket_id: manualTicketId,
      attendee_name: attendee_name.trim(),
      city: city?.trim() || null,
      country: country?.trim() || null,
      arabic_name: arabic_name?.trim() || null,
      admission_type: admission_type.trim(),
    }

    // ==========================================
    // 2. Insert into the main 'attendees' table
    // ==========================================
    const { data: mainData, error: mainError } = await supabaseAdmin
      .from('attendees')
      .insert(record)
      .select('*') // <-- Pulls back the row, including your DB-generated ID
      .single()

    if (mainError || !mainData) {
      console.error("Supabase Main Insert Error:", mainError)
      throw new Error("Failed to add attendee to the main database.")
    }

    // ==========================================
    // 3. Insert into the extra 'manual_attendees' table
    // ==========================================
    const backupRecord = {
      id: mainData.id, 
      tt_ticket_id: mainData.tt_ticket_id,
      attendee_name: mainData.attendee_name,
      arabic_name: mainData.arabic_name,
      city: mainData.city,
      country: mainData.country,
      admission_type: mainData.admission_type,
    }

    const { error: manualError } = await supabaseAdmin
      .from('manual_attendees')
      .insert(backupRecord)

    if (manualError) {
      console.error("Supabase Backup Insert Error:", manualError)
    }

    return NextResponse.json({ success: true, attendee: mainData })

  } catch (err: any) {
    console.error('Manual Registration API Error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}