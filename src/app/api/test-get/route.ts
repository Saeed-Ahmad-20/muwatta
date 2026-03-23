import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Ticket Tailor API Key" }, { status: 500 });
    }

    const eventId = 'ev_7520320';
    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
    
    // We limit to 5 just to see the data structure
    const url = `https://api.tickettailor.com/v1/issued_tickets?event_id=${eventId}&status=valid&limit=12`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Failed to fetch', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    
    // Return the raw data directly to the browser
    return NextResponse.json(data);

  } catch (error) {
    console.error('Test GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}