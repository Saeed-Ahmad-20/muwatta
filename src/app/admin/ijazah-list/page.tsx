'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type IjazahAttendee = {
  id: number
  attendee_name: string
  arabic_name: string | null
  checked_in_at: string
}

export default function IjazahList() {
  const [attendees, setAttendees] = useState<IjazahAttendee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchIjazahList()
  }, [])

  const fetchIjazahList = async () => {
    try {
      setLoading(true)
      // Only fetch attendees who have a checked_in_at timestamp
      const { data, error: fetchError } = await supabase
        .from('attendees')
        .select('id, attendee_name, arabic_name, checked_in_at')
        .not('checked_in_at', 'is', null)
        .order('id', { ascending: true })

      if (fetchError) throw fetchError
      setAttendees(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-brand-burgundy rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Ijazah list...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-4 md:p-8 print:p-0 print:bg-white">
      
      {/* Hide this top bar when printing */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-brand-burgundy">Ijazah List</h1>
          <p className="text-gray-600 mt-1">Attendees who have officially checked in at the venue.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center">
            <span className="text-sm font-bold text-gray-500 mr-2 uppercase tracking-wider">Total Count:</span>
            <span className="text-lg font-black text-brand-burgundy">{attendees.length}</span>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print List
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center font-medium print:hidden">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {attendees.length === 0 ? (
          <div className="p-12 text-center text-gray-500 print:hidden">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className="text-lg font-medium">No attendees have checked in yet.</p>
            <p className="text-sm mt-1">Once attendees scan their tickets at the door, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-burgundy text-brand-gold print:bg-transparent print:text-black">
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark print:border-black w-24">ID</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark print:border-black">English Name</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark print:border-black text-right">Arabic Name (Ijazah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 print:divide-gray-400">
                {attendees.map((attendee, index) => (
                  <tr 
                    key={attendee.id} 
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} print:bg-transparent break-inside-avoid`}
                  >
                    <td className="px-6 py-4 text-gray-600 font-medium print:text-black">
                      #{attendee.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-burgundy print:text-black">{attendee.attendee_name}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {attendee.arabic_name ? (
                        <span className="font-bold text-lg text-gray-900 font-serif print:text-black" dir="rtl">
                          {attendee.arabic_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm italic print:text-gray-500">Not Provided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}