import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { name, message } = await request.json()

    if (!message || message.trim() === '') {
      return NextResponse.json({ success: false, error: 'Message is required.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('feedback')
      .insert([{ name, message }])

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}