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

    const { id, updates } = await request.json()

    if (!id || !updates) {
      return NextResponse.json({ success: false, error: 'Missing attendee ID or update data.' }, { status: 400 })
    }

    // Prevent accidental ID or created_at overwrites
    delete updates.id
    delete updates.created_at

    // 2. UPDATE THE DATABASE DIRECTLY
    const { data, error } = await supabaseAdmin
      .from('attendees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Handle Unique Constraint errors (e.g., duplicate Ticket IDs)
      if (error.code === '23505') {
        throw new Error('That Ticket ID or Email is already in use by another attendee.')
      }
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true, attendee: data })

  } catch (error: any) {
    console.error('Update Attendee API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}