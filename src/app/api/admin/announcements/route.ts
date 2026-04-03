import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('sort_order', { ascending: true }) // Order by manual sort first
      .order('created_at', { ascending: true }) // Fallback to oldest first

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { subject, message, sort_order } = await request.json()
    
    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'Subject and message are required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert([{ subject, message, sort_order: sort_order || 0 }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Handle single announcement edit
    if (body.action === 'edit') {
      const { id, subject, message } = body
      if (!id || !subject || !message) throw new Error('Missing required fields.')

      const { data, error } = await supabaseAdmin
        .from('announcements')
        .update({ subject, message })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    // Handle bulk reordering
    if (body.action === 'reorder') {
      const { items } = body // Array of { id, sort_order }
      
      // Update all items concurrently
      const promises = items.map((item: any) => 
        supabaseAdmin.from('announcements').update({ sort_order: item.sort_order }).eq('id', item.id)
      )
      
      await Promise.all(promises)
      return NextResponse.json({ success: true })
    }

    throw new Error('Invalid action')
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: 'ID required.' }, { status: 400 })

    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}