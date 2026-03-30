import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ============================================
// 🔧 TESTING OVERRIDE - Remove for production!
// ============================================
const TESTING_MODE = true
// ============================================

// ==========================================
// 🔒 CONCURRENCY LIMITER (Server-Side Queue)
//    Protects the database from being overwhelmed
//    by 500+ simultaneous check-in requests. Only
//    N requests hit Supabase at a time — the rest
//    wait in line.
// ==========================================
const MAX_CONCURRENT = 10       // Max simultaneous DB operations
const MAX_QUEUE_SIZE = 500      // Max waiting requests before rejecting
const QUEUE_TIMEOUT_MS = 15000  // Max time a request waits in queue

let activeCount = 0
let queueSize = 0

function acquireSlot(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If there's room, go immediately
    if (activeCount < MAX_CONCURRENT) {
      activeCount++
      return resolve()
    }

    // If the queue is full, reject immediately
    if (queueSize >= MAX_QUEUE_SIZE) {
      return reject(new Error('SERVER_BUSY'))
    }

    queueSize++

    // Set a timeout so requests don't wait forever
    const timeout = setTimeout(() => {
      queueSize--
      reject(new Error('QUEUE_TIMEOUT'))
    }, QUEUE_TIMEOUT_MS)

    // Poll for an open slot
    const interval = setInterval(() => {
      if (activeCount < MAX_CONCURRENT) {
        clearInterval(interval)
        clearTimeout(timeout)
        queueSize--
        activeCount++
        resolve()
      }
    }, 50) // Check every 50ms
  })
}

function releaseSlot() {
  activeCount = Math.max(0, activeCount - 1)
}
// ==========================================

export async function POST(request: Request) {

  // 🔧 TESTING: Skip the time gate when testing
  if (!TESTING_MODE) {
    const unlockTime = new Date('2026-04-03T17:00:00+01:00').getTime()
    if (Date.now() < unlockTime) {
      return NextResponse.json({ success: false, error: 'Check-in is not open yet.' }, { status: 403 })
    }
  }

  // 1. Wait for a slot in the queue
  try {
    await acquireSlot()
  } catch (err: any) {
    if (err.message === 'SERVER_BUSY') {
      return NextResponse.json(
        { success: false, error: 'The server is experiencing very high traffic. Please wait a moment and try again.' },
        { status: 503 }
      )
    }
    if (err.message === 'QUEUE_TIMEOUT') {
      return NextResponse.json(
        { success: false, error: 'Your request timed out due to high traffic. Please try again.' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }

  // 2. Process the request (guaranteed to have a slot)
  try {
    const { ticketCode } = await request.json()

    if (!ticketCode) {
      return NextResponse.json({ success: false, error: 'Ticket Code is required.' }, { status: 400 })
    }

    // Find the attendee by Ticket Code using Admin key
    const { data: attendee, error: fetchError } = await supabaseAdmin
      .from('attendees')
      .select('id, attendee_name, arabic_name, tt_ticket_id, checked_in_at')
      .eq('tt_ticket_id', ticketCode.trim())
      .single()

    if (fetchError || !attendee) {
      return NextResponse.json({ 
        success: false, 
        error: "Ticket Code not found. Please check your ticket and try again." 
      }, { status: 404 })
    }

    // Check if they already did this
    if (attendee.checked_in_at) {
      return NextResponse.json({ 
        success: true, 
        attendee, 
        alreadyCheckedIn: true 
      })
    }

    // Log their official arrival time
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('attendees')
      .update({ checked_in_at: now })
      .eq('id', attendee.id)

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        error: "Connection error. Please try again." 
      }, { status: 500 })
    }

    const updatedAttendee = { ...attendee, checked_in_at: now }

    return NextResponse.json({ 
      success: true, 
      attendee: updatedAttendee, 
      alreadyCheckedIn: false 
    })

  } catch (error: any) {
    console.error('Check-in API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  } finally {
    // ⚠️ ALWAYS release the slot, even if the request errored
    releaseSlot()
  }
}