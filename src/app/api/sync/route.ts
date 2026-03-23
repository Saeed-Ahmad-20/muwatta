import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const getAnswer = (questions: any[], questionNameMatch: string) => {
  if (!questions) return null;
  const question = questions.find((q: any) => 
    q.question && q.question.toLowerCase().includes(questionNameMatch.toLowerCase())
  );
  return question ? question.answer : null;
};

export async function POST() {
  try {
    const apiKey = process.env.TICKET_TAILOR_API_KEY;
    if (!apiKey) throw new Error("Missing Ticket Tailor API Key");

    const eventId = 'ev_7520320';
    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
    
    let allTickets: any[] = [];
    let hasMore = true;
    let startingAfter = '';

    while (hasMore) {
      let url = `https://api.tickettailor.com/v1/issued_tickets?event_id=${eventId}&status=valid&limit=100`;
      
      if (startingAfter) {
        url += `&starting_after=${startingAfter}`;
      }

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'Authorization': authHeader }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Ticket Tailor API failed: ${JSON.stringify(err)}`);
      }
      
      const data = await response.json();
      const ticketsBatch = data.data || data; 

      if (Array.isArray(ticketsBatch) && ticketsBatch.length > 0) {
        allTickets = allTickets.concat(ticketsBatch);
        startingAfter = ticketsBatch[ticketsBatch.length - 1].id;
      }
      if (!Array.isArray(ticketsBatch) || ticketsBatch.length < 100) hasMore = false;
    }

    const attendeesToInsert = allTickets.map((ticket: any) => {
      const qs = ticket.custom_questions || [];

      return {
        admission_type: ticket.description || '', 
        description: ticket.description || '',
        attendee_name: ticket.full_name || '',
        email: ticket.email || '',
        mobile_number: getAnswer(qs, 'mobile number') || '',
        address_line: getAnswer(qs, 'first line of home address') || '',
        city: getAnswer(qs, 'city') || '',
        postal_code: getAnswer(qs, 'postal code') || '',
        country: getAnswer(qs, 'country') || '',
        emergency_contact_name: getAnswer(qs, 'emergency contact name') || '',
        emergency_contact_number: getAnswer(qs, 'emergency contact number') || '',
        medical_conditions: getAnswer(qs, 'medical conditions') || 'None',
        position: getAnswer(qs, 'imam or teacher') || '',
        arabic_name: getAnswer(qs, 'name in arabic') || '',
      };
    });

    if (attendeesToInsert.length > 0) {
      // 1. Wipe the table and reset the custom sequences
      const { error: wipeError } = await supabaseAdmin.rpc('wipe_and_reset_attendees');
      if (wipeError) {
        console.error('Failed to wipe database:', wipeError);
        return NextResponse.json({ error: `Wipe Error: ${wipeError.message}` }, { status: 500 });
      }

      // 2. Insert the fresh data
      const { error: insertError } = await supabaseAdmin
        .from('attendees')
        .insert(attendeesToInsert);

      if (insertError) {
        console.error('Supabase Insert Error:', insertError);
        return NextResponse.json({ error: `Insert Error: ${insertError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: attendeesToInsert.length });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}