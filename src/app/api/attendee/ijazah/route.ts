import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ==========================================
// 📖 GET — Lookup ijazah station by ID
// ==========================================
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

    const { data: record, error: dbError } = await supabaseAdmin
      .from('ijazah_collection')
      .select('ID, english_name, arabic_name, collection_station, received')
      .eq('ID', parsedId)
      .single()

    if (dbError || !record) {
      return NextResponse.json(
        { success: false, error: `No ijazah record found for ID #${parsedId}. Please check your ID number and try again.` },
        { status: 404 }
      )
    }

    if (!record.collection_station) {
      return NextResponse.json({
        success: true,
        found: true,
        stationsReady: false,
        record: {
          ID: record.ID,
          english_name: record.english_name,
          arabic_name: record.arabic_name,
          collection_station: null,
          received: record.received,
        },
      })
    }

    return NextResponse.json({
      success: true,
      found: true,
      stationsReady: true,
      record: {
        ID: record.ID,
        english_name: record.english_name,
        arabic_name: record.arabic_name,
        collection_station: record.collection_station,
        received: record.received,
      },
    })

  } catch (error: any) {
    console.error('Ijazah Lookup Error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}