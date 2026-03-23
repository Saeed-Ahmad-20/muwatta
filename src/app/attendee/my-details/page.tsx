'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const EVENT_DATES = [
  { id: '2026-04-04', label: 'Day 1 (Apr 4)' },
  { id: '2026-04-05', label: 'Day 2 (Apr 5)' },
  { id: '2026-04-06', label: 'Day 3 (Apr 6)' },
  { id: '2026-04-07', label: 'Day 4 (Apr 7)' },
]

export default function MyDetails() {
  const [attendeeName, setAttendeeName] = useState('')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [successData, setSuccessData] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessData(null)
    setAttendanceRecords([])

    try {
      if (!attendeeName || !postcode) {
        throw new Error("Please enter both your name and Postcode.")
      }

      // Changed from .eq to .ilike to make it case-insensitive while requiring exact spelling
      const { data, error: dbError } = await supabase
        .from('attendees')
        .select('*')
        .ilike('attendee_name', attendeeName.trim())

      if (dbError || !data || data.length === 0) {
        throw new Error("We couldn't find an attendee registered with that exact name. Please check your spelling.")
      }

      const inputPostcode = postcode.replace(/\s+/g, '').toLowerCase()
      
      const matchedAttendee = data.find((a: any) => {
        const dbPostcode = (a.postal_code || '').replace(/\s+/g, '').toLowerCase()
        return dbPostcode === inputPostcode
      })

      if (!matchedAttendee) {
        throw new Error("The postcode provided does not match our records for this name.")
      }

      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('attendee_id', matchedAttendee.id)

      if (recordsError) {
        console.error("Could not fetch attendance records", recordsError)
      } else {
        setAttendanceRecords(records || [])
      }

      setSuccessData(matchedAttendee)

    } catch (err: any) {
      setError(err.message || "An error occurred while verifying your details.")
    } finally {
      setLoading(false)
    }
  }

  const hasAttended = (dateId: string, session: 'am' | 'pm') => {
    return attendanceRecords.some(
      record => record.event_date === dateId && record.session_type === session
    )
  }

  const DetailItem = ({ label, value, isRtl = false }: { label: string, value: string | null, isRtl?: boolean }) => (
    <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
      <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">{label}</span>
      <span className={`block text-sm text-gray-900 ${isRtl ? 'font-bold text-lg' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
        {value || '-'}
      </span>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className={`w-full ${successData ? 'max-w-4xl' : 'max-w-md'} bg-gray-50 rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden transition-all duration-300`}>
        
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">My Details</h1>
          <p className="text-sm text-brand-gold-light mt-2">Verify your registration info & attendance</p>
        </div>

        <div className="p-6 md:p-8">
          {successData ? (
            <div className="animate-in fade-in zoom-in space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-brand-burgundy">{successData.attendee_name}</h2>
                  <p className="text-sm font-bold text-brand-gold mt-1">ID: #{successData.id}</p>
                </div>
                <button 
                  onClick={() => {
                    setSuccessData(null)
                    setAttendeeName('')
                    setPostcode('')
                    setAttendanceRecords([])
                  }}
                  className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition text-sm w-full sm:w-auto"
                >
                  Check Another
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-brand-burgundy mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  My Attendance Log
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {EVENT_DATES.map((date) => (
                    <div key={date.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                      <span className="text-sm font-bold text-brand-burgundy mb-1">{date.label}</span>
                      <div className="flex space-x-3 mt-2 w-full justify-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-brand-burgundy-dark mb-1">AM</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasAttended(date.id, 'am') ? 'bg-brand-burgundy text-brand-gold border-brand-burgundy-dark' : 'bg-gray-50 border border-gray-200 text-gray-300'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasAttended(date.id, 'am') ? 3 : 1.5} d={hasAttended(date.id, 'am') ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-brand-burgundy-dark mb-1">PM</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasAttended(date.id, 'pm') ? 'bg-brand-burgundy text-brand-gold border-brand-burgundy-dark' : 'bg-gray-50 border border-gray-200 text-gray-300'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasAttended(date.id, 'pm') ? 3 : 1.5} d={hasAttended(date.id, 'pm') ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-brand-burgundy mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Registration Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <DetailItem label="Arabic Name (Ijazah)" value={successData.arabic_name} isRtl={true} />
                  </div>
                  <DetailItem label="Email Address" value={successData.email} />
                  <DetailItem label="Mobile Number" value={successData.mobile_number} />
                  <DetailItem label="Admission Type" value={successData.admission_type} />
                  <DetailItem label="Emergency Contact" value={`${successData.emergency_contact_name} (${successData.emergency_contact_number})`} />
                  <div className="md:col-span-2">
                    <DetailItem label="Medical Conditions" value={successData.medical_conditions} />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <form onSubmit={handleCheck} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">Attendee Name</label>
                <input 
                  type="text" 
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">Postcode</label>
                <input 
                  type="text" 
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="e.g. M16 9LX"
                  required 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold mt-2 disabled:opacity-50"
              >
                {loading ? 'Retrieving...' : 'Check My Details'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}