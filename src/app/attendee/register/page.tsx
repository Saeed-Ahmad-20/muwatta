'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getServerTime } from '@/app/actions'

const EVENT_DATES = [
  { id: '2026-04-04', label: 'Saturday, April 4th' },
  { id: '2026-04-05', label: 'Sunday, April 5th' },
  { id: '2026-04-06', label: 'Monday, April 6th' },
  { id: '2026-04-07', label: 'Tuesday, April 7th' },
]

export default function RegisterAttendance() {
  const [isMounted, setIsMounted] = useState(false)
  const [idNumber, setIdNumber] = useState('')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<any>(null)
  
  const [availableDates, setAvailableDates] = useState<typeof EVENT_DATES>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isAmEnabled, setIsAmEnabled] = useState(false)
  const [isPmEnabled, setIsPmEnabled] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState({ am: false, pm: false })
  const [isEventOpen, setIsEventOpen] = useState(true)
  const [todayString, setTodayString] = useState('')

  const [timeOffset, setTimeOffset] = useState<number | null>(null)
  
  useEffect(() => {
    setIsMounted(true)
    async function syncClock() {
      try {
        const clientTime = Date.now()
        const serverIso = await getServerTime()
        const serverTime = new Date(serverIso).getTime()
        setTimeOffset(serverTime - clientTime)
      } catch (e) {
        setTimeOffset(0)
      }
    }
    syncClock()
  }, [])

  useEffect(() => {
    if (!isMounted || timeOffset === null) return 

    const checkTimeAndDates = () => {
      const actualNow = new Date(Date.now() + timeOffset)
      
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      const parts = formatter.formatToParts(actualNow)
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00'
      
      const year = getPart('year')
      const month = getPart('month')
      const day = getPart('day')
      const currentHour = parseInt(getPart('hour'), 10)
      const currentMinute = parseInt(getPart('minute'), 10)
      
      const currentTodayStr = `${year}-${month}-${day}`
      setTodayString(currentTodayStr)

      const validDates = EVENT_DATES 
      setAvailableDates(validDates)

      if (validDates.length === 0) {
        setIsEventOpen(false)
        return
      }

      setIsEventOpen(true)

      const activeDate = selectedDate || validDates[0].id
      if (!selectedDate && validDates.length > 0) {
        setSelectedDate(activeDate)
        return
      }

      // --- TESTING MODE ENABLED ---
      setIsAmEnabled(true)
      setIsPmEnabled(true)
    }

    checkTimeAndDates()
    const interval = setInterval(checkTimeAndDates, 30000) 
    return () => clearInterval(interval)
  }, [isMounted, timeOffset, selectedDate])

  const handleSessionToggle = (session: 'am' | 'pm') => {
    setSelectedSessions(prev => ({
      ...prev,
      [session]: !prev[session]
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessData(null)

    try {
      if (!selectedDate) {
        throw new Error("Please select a date.")
      }

      if (!idNumber || !postcode) {
        throw new Error("Please enter both an ID and a Postcode.")
      }

      if (!selectedSessions.am && !selectedSessions.pm) {
        throw new Error("Please select at least one session (AM or PM).")
      }

      const { data: attendee, error: dbError } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', parseInt(idNumber))
        .single()

      if (dbError || !attendee) {
        throw new Error("We couldn't find an attendee with that ID Number.")
      }

      const dbPostcode = (attendee.postal_code || '').replace(/\s+/g, '').toLowerCase()
      const inputPostcode = postcode.replace(/\s+/g, '').toLowerCase()

      if (dbPostcode !== inputPostcode) {
        throw new Error("The postcode provided does not match our records for this ID.")
      }

      const recordsToInsert = []
      if (selectedSessions.am) {
        recordsToInsert.push({ 
          attendee_id: attendee.id, 
          attendee_name: attendee.attendee_name, 
          event_date: selectedDate, 
          session_type: 'am' 
        })
      }
      if (selectedSessions.pm) {
        recordsToInsert.push({ 
          attendee_id: attendee.id, 
          attendee_name: attendee.attendee_name, 
          event_date: selectedDate, 
          session_type: 'pm' 
        })
      }

      const { error: insertError } = await supabase
        .from('attendance_records')
        .upsert(recordsToInsert, { onConflict: 'attendee_id, event_date, session_type', ignoreDuplicates: true })

      if (insertError) {
        console.error(insertError)
        throw new Error("Failed to save attendance to the database. Please try again.")
      }

      const selectedDateLabel = EVENT_DATES.find(d => d.id === selectedDate)?.label

      setSuccessData({
        ...attendee,
        registered_date: selectedDateLabel,
        registered_sessions: selectedSessions
      })

    } catch (err: any) {
      setError(err.message || "An error occurred while verifying your details.")
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted || timeOffset === null) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Synchronizing secure clock...</p>
      </div>
    )
  }

  if (!isEventOpen) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-brand-burgundy mb-2">Registration Not Open</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Attendance tracking for the Muwatta Recital will open on Saturday, April 4th, 2026. Please check back then.
        </p>
      </div>
    )
  }

  const isTodaySelected = selectedDate === todayString

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">Register Attendance</h1>
          <p className="text-sm text-brand-gold-light mt-2">Log your recital progress</p>
        </div>

        <div className="p-8">
          {successData ? (
            <div className="text-center animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-brand-burgundy mb-2">Attendance Logged</h2>
              <p className="text-gray-600 mb-2">
                Jazakallah Khair, <strong className="text-brand-burgundy">{successData.attendee_name}</strong>!
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 mt-4 border border-gray-200">
                <p className="text-sm font-bold text-brand-burgundy">
                  {successData.registered_date}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Sessions: 
                  {successData.registered_sessions.am && <span className="font-bold text-brand-gold ml-1">AM</span>}
                  {successData.registered_sessions.am && successData.registered_sessions.pm && " & "}
                  {successData.registered_sessions.pm && <span className="font-bold text-brand-gold ml-1">PM</span>}
                </p>
              </div>
              
              <button 
                onClick={() => {
                  setSuccessData(null)
                  setIdNumber('')
                  setPostcode('')
                  setSelectedSessions({ am: false, pm: false })
                }}
                className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition"
              >
                Register Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-2">Select Date</label>
                <select 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em 1.2em' }}
                >
                  <option value="" disabled>Select an event date</option>
                  {availableDates.map((date) => (
                    <option key={date.id} value={date.id}>
                      {date.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-2">Select Session(s)</label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    disabled={!isAmEnabled}
                    onClick={() => handleSessionToggle('am')}
                    title={!isAmEnabled ? "The AM session opens at 6:00 AM" : ""}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all duration-200 ${
                      !isAmEnabled 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selectedSessions.am 
                          ? 'border-brand-burgundy bg-brand-burgundy text-brand-gold' 
                          : 'border-gray-200 bg-white text-gray-500 hover:border-brand-burgundy hover:text-brand-burgundy'
                    }`}
                  >
                    AM Session
                  </button>
                  <button
                    type="button"
                    disabled={!isPmEnabled}
                    onClick={() => handleSessionToggle('pm')}
                    title={!isPmEnabled && isAmEnabled ? "The PM session opens at 1:30 PM" : ""}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all duration-200 ${
                      !isPmEnabled 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selectedSessions.pm 
                          ? 'border-brand-burgundy bg-brand-burgundy text-brand-gold' 
                          : 'border-gray-200 bg-white text-gray-500 hover:border-brand-burgundy hover:text-brand-burgundy'
                    }`}
                  >
                    PM Session
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">ID Number</label>
                <input 
                  type="number" 
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 1001"
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
                {loading ? 'Verifying...' : 'Submit Attendance'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}