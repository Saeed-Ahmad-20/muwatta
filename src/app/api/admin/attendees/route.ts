import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 HELPER: Fetch ALL rows from a table
// Supabase caps .select() at 1000 rows by default.
// This paginator fetches every row in batches.
// ==========================================
async function fetchAllRows(table: string, selectColumns: string = '*', orderBy?: string) {
  const PAGE_SIZE = 1000
  let allRows: any[] = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    let query = supabaseAdmin
      .from(table)
      .select(selectColumns)
      .range(from, from + PAGE_SIZE - 1)

    if (orderBy) {
      query = query.order(orderBy, { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch from ${table}: ${error.message}`)
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allRows = allRows.concat(data)
      from += PAGE_SIZE

      // If we got fewer rows than the page size, we've reached the end
      if (data.length < PAGE_SIZE) {
        hasMore = false
      }
    }
  }

  return allRows
}

// ==========================================
// 🔒 HELPER: Normalize event_date values
// Supabase may return timestamps like '2026-04-04T00:00:00+00:00'
// instead of plain '2026-04-04'. This strips the time portion
// so front-end string comparisons work correctly.
// ==========================================
function normalizeEventDates(rows: any[]): any[] {
  return rows.map(row => ({
    ...row,
    event_date: row.event_date
      ? row.event_date.substring(0, 10)  // '2026-04-04T00:00:00+00:00' → '2026-04-04'
      : row.event_date,
  }))
}

// ==========================================
// 📖 GET — Fetch all attendees, records, and requests
// ==========================================
export async function GET() {
  try {
    // Run all three queries at the same time for maximum speed
    const [attendees, rawRecords, rawRequests] = await Promise.all([
      fetchAllRows('attendees', '*', 'id'),
      fetchAllRows('attendance_records'),
      fetchAllRows('attendance_requests'),
    ])

    // Normalize date formats to ensure front-end matching works
    const records = normalizeEventDates(rawRecords)
    const requests = normalizeEventDates(rawRequests)

    console.log(
      `[Admin Attendees] Fetched ${attendees.length} attendees, ` +
      `${records.length} confirmed records, ` +
      `${requests.length} pending requests`
    )

    return NextResponse.json({
      success: true,
      attendees,
      records,
      requests,
    })

  } catch (error: any) {
    console.error('Fetch Admin Attendees Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}