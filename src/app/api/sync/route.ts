import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// HELPER: Normalize UK Country Variations
// ==========================================
function normalizeCountry(countryName: string | null | undefined): string | null {
  if (!countryName) return null;
  
  const normalized = countryName.trim().toLowerCase();
  
  const ukVariations = [
    'uk', 
    'u.k', 
    'u.k.', 
    'united kingdom', 
    'great britain', 
    'gb',
    'the uk'
  ];

  if (ukVariations.includes(normalized)) {
    return 'England';
  }

  // Capitalize the first letter of each word just to keep data clean
  return countryName.trim().replace(/\b\w/g, c => c.toUpperCase()); 
}

export async function POST() {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY?.trim()
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Ticket Tailor API key missing.' }, { status: 500 })
    }

    const authHeader = `Basic ${btoa(`${apiKey}:`)}`
    
    // ==========================================
    // 1. FETCH TICKETS ONLY FOR ev_7520320
    //
    // ⚠️ IMPORTANT: We ONLY fetch "valid" tickets.
    //    Cancelled/voided tickets are never fetched.
    //    This is intentional — we never want to 
    //    modify or delete records that already exist
    //    in our database, regardless of what happens
    //    on Ticket Tailor's side.
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
    //
    // ⚠️ PROTECTION LAYER 1: Delta Check
    //    Any ticket ID that already exists in the 
    //    database is completely skipped here. This
    //    means even if a ticket's name, email, or
    //    any other field was changed on Ticket Tailor,
    //    the existing DB record is NEVER overwritten.
    //    Our database is the source of truth once a 
    //    record is created.
    // ==========================================
    const recordsToInsert: any[] = []

    for (const ticket of uniqueTickets) {
      const ticketCode = ticket.barcode || ticket.id
      
      // Already in DB? Skip entirely — do NOT update.
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
        
        // APPLIED NORMALIZATION HERE
        country: normalizeCountry(getAnswer('country')),
        
        emergency_contact_name: getAnswer('emergency contact name'),
        emergency_contact_number: getAnswer('emergency contact number'),
        medical_conditions: getAnswer('medical condition'),
        position: getAnswer('imam or teacher'),
        arabic_name: getAnswer('name in arabic'),
      }) 
    }

    // ==========================================
    // 4. SAFE INSERT — INSERT-ONLY, NEVER UPDATE/DELETE
    //
    // ⚠️ PROTECTION LAYER 2: Database-Level Safety
    //    ignoreDuplicates: true means if a tt_ticket_id
    //    already exists, the row is silently skipped.
    //    No fields are overwritten. No rows are deleted.
    //
    // ⚠️ PROTECTION LAYER 3: No Deletion Logic
    //    This sync NEVER compares "what's in DB but not
    //    in Ticket Tailor" — so cancelled, refunded, or
    //    voided tickets that were previously synced will
    //    remain in the database permanently and untouched.
    //    
    //    DO NOT add a cleanup/deletion step here.
    //    Existing records are sacred — they may have
    //    check-ins, attendance logs, and admin edits
    //    attached to them.
    // ==========================================
    let successCount = 0
    let skipCount = 0
    let failCount = 0
    let firstError: any = null
    const CHUNK_SIZE = 50

    for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
      const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE)
      await Promise.all(chunk.map(async (record) => {
        const { data, error } = await supabaseAdmin
          .from('attendees')
          .upsert(record, { 
            onConflict: 'tt_ticket_id',
            ignoreDuplicates: true
          })
          .select('id')

        if (error) {
          failCount++
          if (!firstError) firstError = error
        } else if (!data || data.length === 0) {
          skipCount++
        } else {
          successCount++
        }
      }))
    }

    if (failCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Added ${successCount} new records. Skipped ${skipCount} duplicates. Failed on ${failCount}. Error: ${firstError?.message || 'Unknown'}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      count: successCount,
      skipped: skipCount
    })

  } catch (error: any) {
    console.error('Sync Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 