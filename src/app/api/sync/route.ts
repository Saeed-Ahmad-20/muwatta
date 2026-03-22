import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY;
    if (!apiKey) throw new Error("Missing Ticket Tailor API Key");

    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');

    const response = await fetch('https://api.tickettailor.com/v1/issued_tickets', {
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ticket Tailor API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from Ticket Tailor' }, { status: response.status });
    }

    const data = await response.json();
    const tickets = data.data || data; 

    if (!Array.isArray(tickets)) {
        return NextResponse.json({ error: 'Unexpected API response format' }, { status: 500 });
    }

    const attendeesToUpsert = tickets.map((ticket: any) => ({
      ticket_id: ticket.id,
      first_name: ticket.first_name || ticket.full_name?.split(' ')[0] || '',
      last_name: ticket.last_name || ticket.full_name?.split(' ').slice(1).join(' ') || '',
      email: ticket.email || '',
    }));

    const { error } = await supabaseAdmin
      .from('attendees')
      .upsert(attendeesToUpsert, { onConflict: 'ticket_id', ignoreDuplicates: true });

    if (error) {
      console.error('Supabase Upsert Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: attendeesToUpsert.length });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}