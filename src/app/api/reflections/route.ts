import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// PUBLIC GET: Fetch ONLY approved reflections
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reflections')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUBLIC POST: Submit a new reflection (Defaults to unapproved)
export async function POST(request: Request) {
  try {
    const { name, location, message, is_anonymous } = await request.json()

    if (!message || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Message is required.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('reflections')
      .insert([{
        name: is_anonymous ? null : name,
        location: is_anonymous ? null : location,
        message,
        is_anonymous,
        is_approved: false // Always false initially!
      }])

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}