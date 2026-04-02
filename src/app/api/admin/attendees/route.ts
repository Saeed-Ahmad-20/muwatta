import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // Using your specified import path

export async function GET() {
  try {
    // Run both queries at the same time for maximum speed
    const [attendeesResponse, recordsResponse] = await Promise.all([
      supabaseAdmin.from('attendees').select('*').order('id', { ascending: true }),
      supabaseAdmin.from('attendance_records').select('*')
    ])

    if (attendeesResponse.error) throw new Error(attendeesResponse.error.message)
    if (recordsResponse.error) throw new Error(recordsResponse.error.message)

    return NextResponse.json({ 
      success: true, 
      attendees: attendeesResponse.data || [],
      records: recordsResponse.data || []
    })

  } catch (error: any) {
    console.error('Fetch Admin Attendees Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}