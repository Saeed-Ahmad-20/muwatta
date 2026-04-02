import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // ==========================================
    // SECURITY GATEWAY: Block public access
    // ==========================================
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.has('admin_session')
    
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

    const apiKey = process.env.TICKET_TAILOR_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Ticket Tailor API key missing from environment variables.' }, { status: 500 })
    }

    // Fetch all valid tickets from Ticket Tailor
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

    // Return the total count, plus exactly the top 15 raw results
    return NextResponse.json({ 
      success: true, 
      total_tickets_found: tickets.length,
      top_15_results: tickets.slice(0, 15)
    })

  } catch (error: any) {
    console.error('Debug Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}