import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Ticket Tailor API key missing.' }, { status: 500 })
    }

    const ttResponse = await fetch('https://api.tickettailor.com/v1/issued_tickets?status=valid', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    })

    if (!ttResponse.ok) {
      return NextResponse.json({ success: false, error: `Ticket Tailor API responded with status: ${ttResponse.status}` }, { status: ttResponse.status })
    }

    const ttData = await ttResponse.json()
    const tickets = ttData.data || []

    const { data: existingAttendees, error: fetchError } = await supabase.from('attendees').select('*')
    if (fetchError) throw fetchError

    let processedCount = 0

    for (const ticket of tickets) {
      const getAnswer = (keyword: string) => {
        const question = ticket.custom_questions?.find((q: any) => 
          q.question.toLowerCase().includes(keyword.toLowerCase())
        )
        return question ? question.answer : ''
      }

      const email = ticket.email?.toLowerCase() || getAnswer('email')?.toLowerCase() || null
      const attendeeName = ticket.name || ''
      const admissionType = ticket.description || ticket.ticket_type || 'General'

      const recordData = {
        tt_ticket_id: ticket.id, // HIDDEN: Stored so we can PUT updates back to Ticket Tailor later
        attendee_name: attendeeName,
        email: email,
        admission_type: admissionType,
        description: '',
        mobile_number: getAnswer('mobile number'),
        address_line: getAnswer('first line of home'),
        city: getAnswer('city'),
        postal_code: getAnswer('postal code'),
        country: getAnswer('country'),
        emergency_contact_name: getAnswer('emergency contact name'),
        emergency_contact_number: getAnswer('emergency contact number'),
        medical_conditions: getAnswer('medical condition'),
        position: getAnswer('imam or teacher'),
        arabic_name: getAnswer('name in arabic'),
      }

      const existingPerson = existingAttendees?.find(a => 
        a.attendee_name === attendeeName && a.email === email
      )

      if (existingPerson) {
        await supabase.from('attendees').update(recordData).eq('id', existingPerson.id)
      } else {
        await supabase.from('attendees').insert([recordData])
      }
      
      processedCount++
    }

    return NextResponse.json({ 
      success: true, 
      count: processedCount
    })

  } catch (error: any) {
    console.error('Sync Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}