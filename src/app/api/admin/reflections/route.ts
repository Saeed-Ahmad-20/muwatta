import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ADMIN GET: Fetch ALL reflections
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reflections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ADMIN PATCH: Approve or un-approve a reflection
export async function PATCH(request: Request) {
  try {
    const { id, is_approved } = await request.json()

    const { data, error } = await supabaseAdmin
      .from('reflections')
      .update({ is_approved })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ADMIN DELETE: Permanently delete a reflection
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    const { error } = await supabaseAdmin
      .from('reflections')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}