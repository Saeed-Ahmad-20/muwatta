import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 🔒 HELPER: Fetch ALL rows with count
// verification and deterministic ordering.
// ==========================================
async function fetchAllRows(table: string, selectColumns: string = '*') {
  const PAGE_SIZE = 1000
  let allRows: any[] = []
  let from = 0

  const { count, error: countError } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (countError) {
    throw new Error(`Failed to count rows in ${table}: ${countError.message}`)
  }

  const totalExpected = count || 0
  console.log(`[fetchAllRows] ${table}: expecting ${totalExpected} total rows`)

  if (totalExpected === 0) return allRows

  while (from < totalExpected) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(selectColumns)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to fetch from ${table} at offset ${from}: ${error.message}`)
    }

    if (!data || data.length === 0) {
      console.warn(`[fetchAllRows] ${table}: empty page at offset ${from}, stopping early`)
      break
    }

    allRows = allRows.concat(data)
    from += PAGE_SIZE
  }

  if (allRows.length !== totalExpected) {
    console.warn(
      `[fetchAllRows] ⚠️ ${table}: COUNT MISMATCH — ` +
      `expected ${totalExpected}, got ${allRows.length}`
    )
  } else {
    console.log(`[fetchAllRows] ✅ ${table}: fetched all ${allRows.length} rows`)
  }

  return allRows
}

// ==========================================
// 🔒 HELPER: Normalize event_date values
// ==========================================
function normalizeEventDate(dateValue: any): string {
  if (!dateValue) return ''
  return String(dateValue).substring(0, 10)
}

// ==========================================
// 🔒 HELPER: Create fresh split counters
// ==========================================
function createEmptySplits() {
  return { 'Male': 0, 'Female': 0, 'Mother & Baby': 0, 'Other': 0 }
}

// ==========================================
// 📖 GET — Fetch stats for admin dashboard
// ==========================================
export async function GET() {
  try {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.has('admin_session')

    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

    const [attendees, rawAttendanceRecords, rawAttendanceRequests] = await Promise.all([
      fetchAllRows('attendees', 'id, admission_type, country, city, checked_in_at'),
      fetchAllRows('attendance_records', 'id, attendee_id, event_date, session_type'),
      fetchAllRows('attendance_requests', 'id, attendee_id, event_date, session_type'),
    ])

    const attendanceRecords = rawAttendanceRecords.map(r => ({
      ...r,
      event_date: normalizeEventDate(r.event_date),
    }))

    const attendanceRequests = rawAttendanceRequests.map(r => ({
      ...r,
      event_date: normalizeEventDate(r.event_date),
    }))

    if (rawAttendanceRecords.length > 0) {
      console.log(`[Stats Debug] Raw event_date sample: "${rawAttendanceRecords[0].event_date}"`)
      console.log(`[Stats Debug] Normalized sample:     "${attendanceRecords[0].event_date}"`)
    }

    console.log(
      `[Admin Stats] Processing ${attendees.length} attendees, ` +
      `${attendanceRecords.length} confirmed records, ` +
      `${attendanceRequests.length} pending requests`
    )

    const totalAttendees = attendees.length
    const arrivedAttendees = attendees.filter(a => a.checked_in_at).length

    const uniqueCountries = new Set<string>()
    const uniqueCities = new Set<string>()
    const overallSplits = createEmptySplits()
    const attendeeMap = new Map<number, string>()

    const countryBreakdown: Record<string, number> = {}
    const cityBreakdown: Record<string, number> = {}
    const countryCityBreakdown: Record<string, Record<string, number>> = {}

    attendees.forEach(a => {
      let cleanCountry = 'Unknown'

      if (a.country && a.country.trim() !== '') {
        cleanCountry = a.country.trim()

        if (cleanCountry.toLowerCase() === 'israel') {
          cleanCountry = 'Palestine'
        }

        uniqueCountries.add(cleanCountry.toLowerCase())
        countryBreakdown[cleanCountry] = (countryBreakdown[cleanCountry] || 0) + 1
      }

      if (a.city && a.city.trim() !== '') {
        const cleanCity = a.city.trim()
        uniqueCities.add(cleanCity.toLowerCase())
        cityBreakdown[cleanCity] = (cityBreakdown[cleanCity] || 0) + 1

        if (!countryCityBreakdown[cleanCountry]) {
          countryCityBreakdown[cleanCountry] = {}
        }
        countryCityBreakdown[cleanCountry][cleanCity] =
          (countryCityBreakdown[cleanCountry][cleanCity] || 0) + 1
      }

      let type = a.admission_type ? a.admission_type.toLowerCase() : ''
      let bucket = 'Other'
      if (type.includes('mother') || type.includes('baby')) bucket = 'Mother & Baby'
      else if (type.includes('female') || type.includes('sister')) bucket = 'Female'
      else if (type.includes('male') || type.includes('brother')) bucket = 'Male'

      overallSplits[bucket as keyof typeof overallSplits]++
      attendeeMap.set(a.id, bucket)
    })

    const dates = ['2026-04-04', '2026-04-05', '2026-04-06', '2026-04-07']

    // ==========================================
    // CONFIRMED attendance stats
    // Per-date AND per-session splits
    // ==========================================
    const confirmedStats: Record<string, any> = {}

    dates.forEach(date => {
      confirmedStats[date] = {
        am: 0,
        pm: 0,
        // Per-session splits: who attended AM, who attended PM
        amSplits: createEmptySplits(),
        pmSplits: createEmptySplits(),
        // Per-date splits: unique attendees across both sessions
        daySplits: createEmptySplits(),
        _dayUniqueIds: new Set(),
      }
    })

    let confirmedMatchCount = 0

    attendanceRecords.forEach(record => {
      if (confirmedStats[record.event_date]) {
        confirmedMatchCount++
        const bucket = attendeeMap.get(record.attendee_id) || 'Other'

        if (record.session_type === 'am') {
          confirmedStats[record.event_date].am++
          confirmedStats[record.event_date].amSplits[bucket]++
        }

        if (record.session_type === 'pm') {
          confirmedStats[record.event_date].pm++
          confirmedStats[record.event_date].pmSplits[bucket]++
        }

        if (!confirmedStats[record.event_date]._dayUniqueIds.has(record.attendee_id)) {
          confirmedStats[record.event_date]._dayUniqueIds.add(record.attendee_id)
          confirmedStats[record.event_date].daySplits[bucket]++
        }
      }
    })

    // ==========================================
    // PENDING attendance stats
    // Per-date AND per-session splits
    // ==========================================
    const pendingStats: Record<string, any> = {}

    dates.forEach(date => {
      pendingStats[date] = {
        am: 0,
        pm: 0,
        amSplits: createEmptySplits(),
        pmSplits: createEmptySplits(),
        _dayUniqueIds: new Set(),
      }
    })

    let pendingMatchCount = 0

    attendanceRequests.forEach(record => {
      if (pendingStats[record.event_date]) {
        pendingMatchCount++
        const bucket = attendeeMap.get(record.attendee_id) || 'Other'

        if (record.session_type === 'am') {
          pendingStats[record.event_date].am++
          pendingStats[record.event_date].amSplits[bucket]++
        }

        if (record.session_type === 'pm') {
          pendingStats[record.event_date].pm++
          pendingStats[record.event_date].pmSplits[bucket]++
        }

        pendingStats[record.event_date]._dayUniqueIds.add(record.attendee_id)
      }
    })

    // ==========================================
    // 🔍 Debug logging
    // ==========================================
    console.log(`[Stats Debug] Confirmed records matched: ${confirmedMatchCount}/${attendanceRecords.length}`)
    console.log(`[Stats Debug] Pending records matched: ${pendingMatchCount}/${attendanceRequests.length}`)

    dates.forEach(date => {
      const cs = confirmedStats[date]
      const ps = pendingStats[date]
      console.log(
        `[Stats Debug] ${date}: ` +
        `Confirmed AM=${cs.am} (M:${cs.amSplits.Male} F:${cs.amSplits.Female} MB:${cs.amSplits['Mother & Baby']} O:${cs.amSplits.Other}) ` +
        `PM=${cs.pm} (M:${cs.pmSplits.Male} F:${cs.pmSplits.Female} MB:${cs.pmSplits['Mother & Baby']} O:${cs.pmSplits.Other}) | ` +
        `Pending AM=${ps.am} PM=${ps.pm}`
      )
    })

    // ==========================================
    // Build final stats object
    // ==========================================
    const finalStats: Record<string, any> = {}
    dates.forEach(date => {
      finalStats[date] = {
        am: confirmedStats[date].am,
        pm: confirmedStats[date].pm,
        amSplits: confirmedStats[date].amSplits,
        pmSplits: confirmedStats[date].pmSplits,
        daySplits: confirmedStats[date].daySplits,
        totalUnique: confirmedStats[date]._dayUniqueIds.size,
        pending: {
          am: pendingStats[date].am,
          pm: pendingStats[date].pm,
          amSplits: pendingStats[date].amSplits,
          pmSplits: pendingStats[date].pmSplits,
          totalUnique: pendingStats[date]._dayUniqueIds.size,
        },
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalAttendees,
        arrivedAttendees,
        countriesCount: uniqueCountries.size || 1,
        citiesCount: uniqueCities.size,
        overallSplits,
        countryBreakdown,
        cityBreakdown,
        countryCityBreakdown,
        attendanceBreakdown: finalStats,
      },
    })
  } catch (error: any) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}