import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // 1. Check for the admin cookie
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.has('admin_session')
    
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

    // 2. Fetch the Ijazah list using the Admin key to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('attendees')
      .select('id, attendee_name, arabic_name, checked_in_at')
      .not('checked_in_at', 'is', null) // Only get people who actually arrived
      .order('id', { ascending: true })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data: data || [] })

  } catch (error: any) {
    console.error('Fetch Ijazah List Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}