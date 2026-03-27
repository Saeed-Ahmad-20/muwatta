import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST() {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY?.trim()
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Ticket Tailor API key missing.' }, { status: 500 })
    }

    const authHeader = `Basic ${btoa(`${apiKey}:`)}`
    
    // ==========================================
    // 1. FETCH TICKETS ONLY FOR ev_7520320
    // ==========================================
    let allTickets: any[] = []
    let startingAfter = ''
    let hasMoreTt = true

    while (hasMoreTt) {
      let url = 'https://api.tickettailor.com/v1/issued_tickets?event_id=ev_7520320&status=valid&limit=100'
      if (startingAfter) url += `&starting_after=${startingAfter}`

      const ttResponse = await fetch(url, {
        headers: { 'Accept': 'application/json', 'Authorization': authHeader }
      })

      if (!ttResponse.ok) {
        return NextResponse.json({ success: false, error: `TT API Error: ${ttResponse.status}` }, { status: ttResponse.status })
      }

      const ttData = await ttResponse.json()
      const ticketsChunk = ttData.data || []
      
      allTickets = allTickets.concat(ticketsChunk)

      if (ticketsChunk.length === 100) {
        startingAfter = ticketsChunk[ticketsChunk.length - 1].id
      } else {
        hasMoreTt = false 
      }
    }

    const uniqueTicketsMap = new Map()
    for (const t of allTickets) {
      const ticketCode = t.barcode || t.id 
      uniqueTicketsMap.set(ticketCode, t)
    }
    const uniqueTickets = Array.from(uniqueTicketsMap.values())


    // ==========================================
    // 2. FETCH ALL SUPABASE ATTENDEES (Using Admin Client)
    // ==========================================
    let allDbAttendees: any[] = []
    let hasMoreDb = true
    let rangeStart = 0

    while (hasMoreDb) {
      // Bypasses RLS to get the true list of tickets
      const { data, error } = await supabaseAdmin
        .from('attendees')
        .select('id, tt_ticket_id')
        .order('id', { ascending: true })
        .range(rangeStart, rangeStart + 999) 
        
      if (error) throw error

      allDbAttendees = allDbAttendees.concat(data || [])

      if (data && data.length === 1000) {
        rangeStart += 1000
      } else {
        hasMoreDb = false
      }
    }

    // Convert existing tickets into a lightning-fast Set
    const existingDbTickets = new Set(allDbAttendees.map(a => a.tt_ticket_id))

    // ==========================================
    // 3. ISOLATE ONLY BRAND NEW TICKETS
    // ==========================================
    const recordsToInsert: any[] = []

    for (const ticket of uniqueTickets) {
      const ticketCode = ticket.barcode || ticket.id
      
      // THE DELTA CHECK: If they are already in the DB, ignore them completely!
      if (existingDbTickets.has(ticketCode)) {
        continue;
      }

      const getAnswer = (keyword: string) => {
        const question = ticket.custom_questions?.find((q: any) => 
          q.question.toLowerCase().includes(keyword.toLowerCase())
        )
        return question ? question.answer : null
      }

      const customEmail = getAnswer('email')
      const email = customEmail ? customEmail.toLowerCase() : (ticket.email?.toLowerCase() || null)
      const attendeeName = ticket.full_name || ticket.first_name || ''

      recordsToInsert.push({
        tt_ticket_id: ticketCode, 
        attendee_name: attendeeName,
        email: email,
        admission_type: ticket.description || ticket.ticket_type || 'General',
        mobile_number: getAnswer('mobile number') || ticket.phone || null,
        address_line: getAnswer('first line of home'),
        city: getAnswer('city'),
        postal_code: getAnswer('postal code'),
        country: getAnswer('country'),
        emergency_contact_name: getAnswer('emergency contact name'),
        emergency_contact_number: getAnswer('emergency contact number'),
        medical_conditions: getAnswer('medical condition'),
        position: getAnswer('imam or teacher'),
        arabic_name: getAnswer('name in arabic'),
      }) 
    }

    // ==========================================
    // 4. PARALLEL INDIVIDUAL INSERT (Using Admin Client)
    // ==========================================
    let successCount = 0
    let failCount = 0
    let firstError: any = null
    const CHUNK_SIZE = 50

    for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
      const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE)
      await Promise.all(chunk.map(async (record) => {
        // Bypasses RLS to insert new records
        const { error } = await supabaseAdmin.from('attendees').insert(record)
        if (error) {
          failCount++; if (!firstError) firstError = error;
        } else { successCount++; }
      }))
    }

    if (failCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Added ${successCount} new records. Failed on ${failCount}. Error: ${firstError?.message || 'Unknown'}` 
      }, { status: 500 })
    }

    // This will now report 0 if no new tickets were sold!
    return NextResponse.json({ success: true, count: successCount })

  } catch (error: any) {
    console.error('Sync Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}