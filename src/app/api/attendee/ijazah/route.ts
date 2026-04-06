import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idNumber = searchParams.get('idNumber')

    if (!idNumber || idNumber.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Please enter your ID number.' },
        { status: 400 }
      )
    }

    const parsedId = parseInt(idNumber.trim())

    if (isNaN(parsedId)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid numeric ID.' },
        { status: 400 }
      )
    }

    // Fetch the attendee's record
    const { data: record, error: dbError } = await supabaseAdmin
      .from('ijazah_collection')
      .select('ID, english_name, arabic_name, collection_station')
      .eq('ID', parsedId)
      .single()

    if (dbError || !record) {
      return NextResponse.json(
        { success: false, error: `No ijazah record found for ID #${parsedId}. Please check your ID number and try again.` },
        { status: 404 }
      )
    }

    // If this person has no station, find the last station so we can
    // direct them there for help (e.g. their ijazah isn't ready yet).
    // Only relevant when stations have actually been assigned to others.
    let lastStation: string | null = null

    if (!record.collection_station) {
      const { data: stations, error: stationsError } = await supabaseAdmin
        .from('ijazah_collection')
        .select('collection_station')
        .not('collection_station', 'is', null)
        .order('collection_station', { ascending: false })
        .limit(1)

      if (!stationsError && stations && stations.length > 0) {
        lastStation = stations[0].collection_station
      }
    }

    return NextResponse.json({
      success: true,
      record: {
        ID: record.ID,
        english_name: record.english_name,
        arabic_name: record.arabic_name,
        collection_station: record.collection_station,
      },
      lastStation,
    })

  } catch (error: any) {
    console.error('Ijazah Lookup Error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}