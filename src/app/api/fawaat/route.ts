import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Helper function to validate ID & Postcode securely and fetch mobile number
async function validateAttendee(attendee_id: number, postcode: string) {
  const { data: attendee, error } = await supabaseAdmin
    .from('attendees')
    .select('id, attendee_name, postal_code, email, mobile_number')
    .eq('id', attendee_id)
    .single()

  if (error || !attendee) throw new Error('Attendee ID not found.')
  
  const dbPostcode = (attendee.postal_code || '').replace(/\s+/g, '').toLowerCase()
  const inputPostcode = (postcode || '').replace(/\s+/g, '').toLowerCase()
  
  if (dbPostcode !== inputPostcode) throw new Error('Postcode does not match our records.')
  
  return attendee
}

export async function GET() {
  try {
    // Fetch all groups with their members (but NO contact details for public view)
    const { data: groups, error } = await supabaseAdmin
      .from('fawaat_groups')
      .select(`
        id, start_hadith, end_hadith, created_at, owner_id,
        fawaat_members ( attendee_id, role, attendees ( attendee_name ) )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Format data for the frontend
    const formattedGroups = groups.map((g: any) => ({
      id: g.id,
      owner_id: g.owner_id,
      start_hadith: g.start_hadith,
      end_hadith: g.end_hadith,
      created_at: g.created_at,
      members: g.fawaat_members.map((m: any) => ({
        attendee_id: m.attendee_id,
        role: m.role,
        name: m.attendees?.attendee_name
      }))
    }))

    return NextResponse.json({ success: true, data: formattedGroups })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, attendee_id, postcode } = body

    if (!action || !attendee_id || !postcode) {
      return NextResponse.json({ success: false, error: 'Missing required credentials.' }, { status: 400 })
    }

    // 1. Authenticate the user for ALL actions
    const attendee = await validateAttendee(attendee_id, postcode)

    // 2. Route the requested action
    if (action === 'login') {
      return NextResponse.json({ success: true, attendee })
    }

    if (action === 'create_group') {
      const { start_hadith, end_hadith, whatsapp_number } = body
      
      // Create Group
      const { data: group, error: groupErr } = await supabaseAdmin
        .from('fawaat_groups')
        .insert([{ owner_id: attendee.id, start_hadith, end_hadith }])
        .select()
        .single()
        
      if (groupErr) throw groupErr

      // Add Owner as Member using the provided editable whatsapp number
      await supabaseAdmin.from('fawaat_members').insert([{
        group_id: group.id,
        attendee_id: attendee.id,
        role: 'needs_catchup',
        whatsapp_number: whatsapp_number
      }])

      return NextResponse.json({ success: true })
    }

    if (action === 'join_group') {
      const { group_id, role, whatsapp_number } = body
      
      // Use the provided editable whatsapp number
      const { error } = await supabaseAdmin.from('fawaat_members').insert([{
        group_id, attendee_id: attendee.id, role, whatsapp_number: whatsapp_number
      }])
      
      if (error) throw new Error('You are already in this group.')
      return NextResponse.json({ success: true })
    }

    if (action === 'delete_group') {
      const { group_id } = body
      // Ensure only the owner can delete
      const { data: group } = await supabaseAdmin.from('fawaat_groups').select('owner_id').eq('id', group_id).single()
      if (group?.owner_id !== attendee.id) throw new Error('Unauthorized to delete.')

      await supabaseAdmin.from('fawaat_groups').delete().eq('id', group_id)
      return NextResponse.json({ success: true })
    }

    if (action === 'get_contacts') {
      const { group_id } = body
      // Ensure the requester is actually in the group
      const { data: isMember } = await supabaseAdmin.from('fawaat_members').select('id').eq('group_id', group_id).eq('attendee_id', attendee.id).single()
      if (!isMember) throw new Error('You must join the group to view contacts.')

      const { data: contacts, error } = await supabaseAdmin
        .from('fawaat_members')
        .select('role, whatsapp_number, attendees(attendee_name, email)')
        .eq('group_id', group_id)

      if (error) throw error

      const formattedContacts = contacts.map((c: any) => ({
        name: c.attendees?.attendee_name,
        email: c.attendees?.email,
        role: c.role,
        whatsapp: c.whatsapp_number
      }))

      return NextResponse.json({ success: true, data: formattedContacts })
    }

    throw new Error('Invalid action')
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}