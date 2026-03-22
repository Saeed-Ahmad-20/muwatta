import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // This is the ticket_id
    const updates = await request.json();

    // 1. Update your local Supabase database
    const { data, error } = await supabaseAdmin
      .from('attendees')
      .update(updates)
      .eq('ticket_id', id)
      .select()
      .single();

    if (error) throw error;

    // 2. [FUTURE TODO] Send the amendment back to Ticket Tailor
    // const authHeader = 'Basic ' + Buffer.from(`${process.env.TICKET_TAILOR_API_KEY}:`).toString('base64');
    // await fetch(`https://api.tickettailor.com/v1/issued_tickets/${id}`, { 
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
    //   body: JSON.stringify(updates)
    // });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Amendment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}