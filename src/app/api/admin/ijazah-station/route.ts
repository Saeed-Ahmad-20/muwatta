import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 HELPER: Fetch ALL ijazah rows
// ==========================================
async function fetchAllIjazahRows() {
  const PAGE_SIZE = 1000
  let allRows: any[] = []
  let from = 0

  const { count, error: countError } = await supabaseAdmin
    .from('ijazah_collection')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    throw new Error(`Failed to count ijazah rows: ${countError.message}`)
  }

  const totalExpected = count || 0
  if (totalExpected === 0) return allRows

  while (from < totalExpected) {
    const { data, error } = await supabaseAdmin
      .from('ijazah_collection')
      .select('*')
      .order('ID', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to fetch ijazah rows at offset ${from}: ${error.message}`)
    }

    if (!data || data.length === 0) break
    allRows = allRows.concat(data)
    from += PAGE_SIZE
  }

  console.log(`[Ijazah] Fetched ${allRows.length}/${totalExpected} rows`)
  return allRows
}

// ==========================================
// 📖 GET — Fetch all records + stats
// ==========================================
export async function GET() {
  try {
    const cookieStore = await cookies()
    if (!cookieStore.has('admin_session')) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

    const records = await fetchAllIjazahRows()

    const total = records.length
    const collected = records.filter((r: any) => r.received).length
    const stationSet = new Set(records.map((r: any) => r.collection_station).filter(Boolean))
    const stationsAssigned = stationSet.size > 0

    const stationStats: Record<string, { total: number; collected: number; remaining: number }> = {}
    records.forEach((r: any) => {
      const station = r.collection_station
      if (station) {
        if (!stationStats[station]) {
          stationStats[station] = { total: 0, collected: 0, remaining: 0 }
        }
        stationStats[station].total++
        if (r.received) {
          stationStats[station].collected++
        } else {
          stationStats[station].remaining++
        }
      }
    })

    return NextResponse.json({
      success: true,
      records: records ?? [],
      stats: {
        total,
        collected,
        remaining: total - collected,
        stationsAssigned,
        stationCount: stationSet.size,
        stationStats,
      },
    })
  } catch (error: any) {
    console.error('Ijazah GET Error:', error)
    return NextResponse.json({ success: false, error: error.message, records: [], stats: null }, { status: 500 })
  }
}

// ==========================================
// ✏️ POST — Actions
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    if (!cookieStore.has('admin_session')) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // ==========================================
    // ACTION: mark-received
    // ==========================================
    if (action === 'mark-received') {
      const { searchValue } = body

      if (!searchValue || String(searchValue).trim() === '') {
        return NextResponse.json({ success: false, error: 'Please enter an ID number or name.' }, { status: 400 })
      }

      const trimmed = String(searchValue).trim()
      let record: any = null

      const parsedId = parseInt(trimmed)
      if (!isNaN(parsedId)) {
        const { data, error } = await supabaseAdmin
          .from('ijazah_collection')
          .select('*')
          .eq('ID', parsedId)
          .single()

        if (!error && data) {
          record = data
        }
      }

      if (!record) {
        const { data, error } = await supabaseAdmin
          .from('ijazah_collection')
          .select('*')
          .ilike('english_name', trimmed)

        if (!error && data && data.length === 1) {
          record = data[0]
        } else if (!error && data && data.length > 1) {
          return NextResponse.json({
            success: false,
            error: `Multiple records found for "${trimmed}". Please use the ID number instead.`,
            matches: data.map((r: any) => ({ ID: r.ID, english_name: r.english_name, arabic_name: r.arabic_name })),
          }, { status: 400 })
        }
      }

      if (!record) {
        return NextResponse.json({ success: false, error: `No record found for "${trimmed}".` }, { status: 404 })
      }

      if (record.received) {
        return NextResponse.json({
          success: false,
          error: `Ijazah for #${record.ID} (${record.english_name}) has already been marked as collected.`,
          record,
          alreadyCollected: true,
        }, { status: 400 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('ijazah_collection')
        .update({ received: true })
        .eq('ID', record.ID)

      if (updateError) {
        throw new Error(`Failed to update record: ${updateError.message}`)
      }

      const updatedRecord = { ...record, received: true }
      console.log(`[Ijazah] Marked as received: #${record.ID} (${record.english_name})`)

      return NextResponse.json({
        success: true,
        message: `Ijazah collected for #${record.ID} — ${record.english_name}`,
        record: updatedRecord,
      })
    }

    // ==========================================
    // ACTION: mark-unreceived (undo)
    // ==========================================
    if (action === 'mark-unreceived') {
      const { id } = body

      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing ID.' }, { status: 400 })
      }

      const { data: record, error: fetchError } = await supabaseAdmin
        .from('ijazah_collection')
        .select('*')
        .eq('ID', parseInt(id))
        .single()

      if (fetchError || !record) {
        return NextResponse.json({ success: false, error: `No record found for ID #${id}.` }, { status: 404 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('ijazah_collection')
        .update({ received: false })
        .eq('ID', record.ID)

      if (updateError) {
        throw new Error(`Failed to undo: ${updateError.message}`)
      }

      console.log(`[Ijazah] Unmarked received: #${record.ID} (${record.english_name})`)

      return NextResponse.json({
        success: true,
        message: `Undo successful — #${record.ID} marked as not collected.`,
        record: { ...record, received: false },
      })
    }

    // ==========================================
    // ACTION: assign-stations
    // ==========================================
    if (action === 'assign-stations') {
      const { stationCount } = body

      if (!stationCount || stationCount < 1 || stationCount > 26) {
        return NextResponse.json({ success: false, error: 'Please choose between 1 and 26 stations.' }, { status: 400 })
      }

      const allRecords = await fetchAllIjazahRows()

      if (allRecords.length === 0) {
        return NextResponse.json({ success: false, error: 'No ijazah records found to assign.' }, { status: 400 })
      }

      // Separate ready and not-ready
      const readyRecords = allRecords.filter((r: any) => r.received)
      const notReadyRecords = allRecords.filter((r: any) => !r.received)

      // Generate station labels: A, B, C, ... Z
      const stationLabels = Array.from({ length: stationCount }, (_, i) =>
        `Station ${String.fromCharCode(65 + i)}`
      )

      const lastStationLabel = stationLabels[stationCount - 1]

      // Build assignments
      const updates: { id: number; station: string }[] = []

      if (stationCount === 1) {
        // Only 1 station — everything goes to Station A
        allRecords.forEach((record: any) => {
          updates.push({ id: record.ID, station: stationLabels[0] })
        })
      } else {
        // Multiple stations:
        // Ready ijazahs → distributed across stations 1 to N-1
        // Not-ready ijazahs → all go to station N (last)
        const distributionStations = stationLabels.slice(0, stationCount - 1)
        const perStation = readyRecords.length > 0
          ? Math.ceil(readyRecords.length / distributionStations.length)
          : 0

        readyRecords.forEach((record: any, index: number) => {
          const stationIndex = Math.min(
            Math.floor(index / perStation),
            distributionStations.length - 1
          )
          updates.push({ id: record.ID, station: distributionStations[stationIndex] })
        })

        notReadyRecords.forEach((record: any) => {
          updates.push({ id: record.ID, station: lastStationLabel })
        })
      }

      // Execute updates in batches
      const BATCH_SIZE = 500
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE)

        const stationGroups: Record<string, number[]> = {}
        batch.forEach(u => {
          if (!stationGroups[u.station]) stationGroups[u.station] = []
          stationGroups[u.station].push(u.id)
        })

        const promises = Object.entries(stationGroups).map(([station, ids]) =>
          supabaseAdmin
            .from('ijazah_collection')
            .update({ collection_station: station })
            .in('ID', ids)
        )

        const results = await Promise.all(promises)
        results.forEach((result) => {
          if (result.error) {
            console.error(`[Ijazah] Station assign batch error:`, result.error)
          }
        })
      }

      // Build summary
      const stationSummary: Record<string, { from: number | null; to: number | null; count: number; type: string }> = {}

      // Initialize all stations so they appear even if empty
      stationLabels.forEach((label, idx) => {
        const isLast = idx === stationCount - 1 && stationCount > 1
        stationSummary[label] = { from: null, to: null, count: 0, type: isLast ? 'not-ready' : 'ready' }
      })

      updates.forEach(u => {
        if (!stationSummary[u.station]) {
          stationSummary[u.station] = { from: null, to: null, count: 0, type: 'ready' }
        }
        if (stationSummary[u.station].from === null || u.id < stationSummary[u.station].from!) {
          stationSummary[u.station].from = u.id
        }
        if (stationSummary[u.station].to === null || u.id > stationSummary[u.station].to!) {
          stationSummary[u.station].to = u.id
        }
        stationSummary[u.station].count++
      })

      console.log(
        `[Ijazah] Assigned ${allRecords.length} records across ${stationCount} stations ` +
        `(${readyRecords.length} ready → ${stationCount > 1 ? stationCount - 1 : 1} station(s), ` +
        `${notReadyRecords.length} not-ready → ${lastStationLabel})`
      )

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${allRecords.length} ijazahs across ${stationCount} station${stationCount > 1 ? 's' : ''}.`,
        stationSummary,
        totalRecords: allRecords.length,
        readyCount: readyRecords.length,
        notReadyCount: notReadyRecords.length,
        lastStation: stationCount > 1 ? lastStationLabel : null,
      })
    }

    // ==========================================
    // ACTION: clear-stations
    // ==========================================
    if (action === 'clear-stations') {
      const { error: clearError } = await supabaseAdmin
        .from('ijazah_collection')
        .update({ collection_station: null })
        .not('collection_station', 'is', null)

      if (clearError) {
        throw new Error(`Failed to clear stations: ${clearError.message}`)
      }

      console.log('[Ijazah] Cleared all station assignments')

      return NextResponse.json({
        success: true,
        message: 'All station assignments have been cleared.',
      })
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })

  } catch (error: any) {
    console.error('Ijazah POST Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}