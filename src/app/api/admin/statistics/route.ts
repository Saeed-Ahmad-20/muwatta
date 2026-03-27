import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.has('admin_session')
    
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 401 })
    }

    const [
      { data: attendees },
      { data: attendanceRecords }
    ] = await Promise.all([
      supabaseAdmin.from('attendees').select('id, admission_type, country, city, checked_in_at'),
      supabaseAdmin.from('attendance_records').select('attendee_id, event_date, session_type')
    ])

    const totalAttendees = attendees?.length || 0
    const arrivedAttendees = attendees?.filter(a => a.checked_in_at).length || 0

    const uniqueCountries = new Set<string>()
    const uniqueCities = new Set<string>()
    const overallSplits = { 'Male': 0, 'Female': 0, 'Mother & Baby': 0, 'Other': 0 }
    const attendeeMap = new Map()
    
    const countryBreakdown: Record<string, number> = {}
    const cityBreakdown: Record<string, number> = {}
    const countryCityBreakdown: Record<string, Record<string, number>> = {}

    attendees?.forEach(a => {
      let cleanCountry = 'Unknown'
      
      if (a.country && a.country.trim() !== '') {
        cleanCountry = a.country.trim()
        
        // INTERCEPT & RENAME: Change Israel to Palestine
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
        countryCityBreakdown[cleanCountry][cleanCity] = (countryCityBreakdown[cleanCountry][cleanCity] || 0) + 1
      }

      let type = a.admission_type ? a.admission_type.toLowerCase() : ''
      let bucket = 'Other'
      if (type.includes('mother') || type.includes('baby')) bucket = 'Mother & Baby'
      else if (type.includes('female') || type.includes('sister')) bucket = 'Female'
      else if (type.includes('male') || type.includes('brother')) bucket = 'Male'

      overallSplits[bucket as keyof typeof overallSplits]++
      attendeeMap.set(a.id, bucket)
    })

    const attendanceStats: Record<string, any> = {}
    const dates = ['2026-04-04', '2026-04-05', '2026-04-06', '2026-04-07']
    
    dates.forEach(date => {
      attendanceStats[date] = { 
        am: 0, 
        pm: 0, 
        splits: { 'Male': 0, 'Female': 0, 'Mother & Baby': 0, 'Other': 0 }, 
        _uniqueIds: new Set() 
      }
    })

    if (attendanceRecords) {
      attendanceRecords.forEach(record => {
        if (attendanceStats[record.event_date]) {
          if (record.session_type === 'am') attendanceStats[record.event_date].am++
          if (record.session_type === 'pm') attendanceStats[record.event_date].pm++
          
          if (!attendanceStats[record.event_date]._uniqueIds.has(record.attendee_id)) {
            attendanceStats[record.event_date]._uniqueIds.add(record.attendee_id)
            const typeBucket = attendeeMap.get(record.attendee_id) || 'Other'
            attendanceStats[record.event_date].splits[typeBucket]++
          }
        }
      })
    }

    const finalStats: Record<string, any> = {}
    dates.forEach(date => {
      finalStats[date] = {
        am: attendanceStats[date].am,
        pm: attendanceStats[date].pm,
        splits: attendanceStats[date].splits,
        totalUnique: attendanceStats[date]._uniqueIds.size
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
        attendanceBreakdown: finalStats
      }
    })

  } catch (error: any) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}