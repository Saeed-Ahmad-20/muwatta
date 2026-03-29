'use client'

import { useState, useEffect } from 'react'
import { getServerTime } from '@/app/actions'

const EVENT_DATES = [
  { id: '2026-04-04', label: 'Saturday, April 4th' },
  { id: '2026-04-05', label: 'Sunday, April 5th' },
  { id: '2026-04-06', label: 'Monday, April 6th' },
  { id: '2026-04-07', label: 'Tuesday, April 7th' },
]

// ============================================
// 🔧 TESTING OVERRIDE - Remove for production!
// ============================================
const TESTING_MODE = true
const FAKE_NOW = new Date('2026-04-06T11:00:00+01:00') // April 6, 11:00 AM BST
// ============================================

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
  
  const [appState, setAppState] = useState<'loading' | 'too_early' | 'open' | 'concluded'>('loading')
  const [todayString, setTodayString] = useState('')
  const [timeOffset, setTimeOffset] = useState<number | null>(null)
  
  // 1. Synchronize the secure clock on load
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

  // 2. Continuously monitor time constraints
  useEffect(() => {
    if (!isMounted || timeOffset === null) return 

    const checkTimeAndDates = () => {
      // 🔧 TESTING: Use fake time instead of real time
      const actualNow = TESTING_MODE
        ? FAKE_NOW
        : new Date(Date.now() + timeOffset)
      
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
      
      const currentTodayStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`
      setTodayString(currentTodayStr)

      if (currentTodayStr > '2026-04-10') {
        setAppState('concluded')
        return
      }

      if (currentTodayStr < '2026-04-04') {
        setAppState('too_early')
        return
      }

      setAppState('open')

      const unlockedDates = EVENT_DATES.filter(d => d.id <= currentTodayStr)
      setAvailableDates(unlockedDates)

      const activeDateId = selectedDate || (unlockedDates.length > 0 ? unlockedDates[unlockedDates.length - 1].id : '')
      if (!selectedDate && activeDateId) {
        setSelectedDate(activeDateId)
      }

      if (activeDateId === currentTodayStr) {
        const currentHour = parseInt(getPart('hour'))
        const currentMinute = parseInt(getPart('minute'))
        const decimalTime = currentHour + (currentMinute / 60)

        const isAmTime = decimalTime >= 6.0 && decimalTime < 24.0
        const isPmTime = decimalTime >= 13.5 && decimalTime < 24.0

        setIsAmEnabled(isAmTime)
        setIsPmEnabled(isPmTime)

        setSelectedSessions(prev => ({
          am: prev.am && isAmTime,
          pm: prev.pm && isPmTime
        }))
      } else {
        setIsAmEnabled(true)
        setIsPmEnabled(true)
      }
    }

    checkTimeAndDates()
    const interval = setInterval(checkTimeAndDates, 30000) 
    return () => clearInterval(interval)
  }, [isMounted, timeOffset, selectedDate])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessData(null)

    try {
      if (!selectedDate || (!selectedSessions.am && !selectedSessions.pm)) {
        throw new Error("Please select a date and at least one active session.")
      }

      if (!idNumber || !postcode) {
        throw new Error("Please enter both your ID Number and a Postcode.")
      }

      const isRetroactive = selectedDate < todayString

      // ==========================================
      // SECURE API CALL (Bypasses RLS Safely)
      // ==========================================
      const response = await fetch('/api/attendee/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idNumber,
          postcode,
          selectedDate,
          selectedSessions,
          isRetroactive
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "An error occurred while verifying your details.")
      }

      const selectedDateLabel = EVENT_DATES.find(d => d.id === selectedDate)?.label

      // Update UI matching the exact data shape the API returned
      setSuccessData({
        ...result.attendee,
        registered_date: selectedDateLabel,
        newly_registered: { am: result.newAm, pm: result.newPm },
        already_registered: { am: result.dupAm, pm: result.dupPm },
        isRetroactive
      })

    } catch (err: any) {
      setError(err.message || "An error occurred while verifying your details.")
    } finally {
      setLoading(false)
    }
  }

  // --- RENDER STATES ---

  if (appState === 'loading' || !isMounted || timeOffset === null) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Synchronizing secure clock...</p>
      </div>
    )
  }

  if (appState === 'concluded') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center bg-brand-burgundy text-brand-gold">
        <svg className="w-20 h-20 mb-6 text-brand-gold mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h1 className="text-4xl font-bold mb-4">Alhamdulillah</h1>
        <p className="text-lg max-w-xl mx-auto opacity-90 leading-relaxed">
          The historic recital of al-Muwatta' of Imam Malik Ibn Anas with Shaykh Muhammad al-Yaqoubi has officially concluded. Registration is now permanently closed. May Allah accept everyone's efforts and attendance.
        </p>
      </div>
    )
  }

  if (appState === 'too_early') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-brand-burgundy mb-2">Registration Not Open</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Attendance tracking for the Muwatta Recital will open on Saturday, April 4th, 2026. Please check back then.
        </p>
      </div>
    )
  }

  // --- MAIN FORM ---
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">Register Attendance</h1>
          <p className="text-sm text-brand-gold-light mt-2">Log your recital progress</p>
        </div>

        <div className="p-6 md:p-8">
          {successData ? (
            <div className="text-center animate-in fade-in zoom-in">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${successData.isRetroactive ? 'bg-yellow-50 text-yellow-600 border-yellow-200 border' : 'bg-green-50 text-green-600 border-green-200 border'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {successData.isRetroactive 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  }
                </svg>
              </div>
              <h2 className="text-xl font-bold text-brand-burgundy mb-2">
                {successData.isRetroactive ? 'Attendance Submitted' : 'Attendance Logged'}
              </h2>
              <p className="text-gray-600 mb-2">
                Jazakallah Khair, <strong className="text-brand-burgundy">{successData.attendee_name}</strong>!
              </p>

              {successData.arabic_name && (
                <p className="text-2xl font-bold text-brand-burgundy mb-2" dir="rtl">
                  {successData.arabic_name}
                </p>
              )}

              {successData.isRetroactive && (
                <div className="text-xs bg-yellow-50 text-yellow-800 p-3 rounded-lg mt-3 mb-2 border border-yellow-200">
                  Because this is a past date, your attendance has been sent to an admin for manual approval.
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 mt-4 border border-gray-200">
                <p className="text-sm font-bold text-brand-burgundy">
                  {successData.registered_date}
                </p>
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  Successfully Logged Now: 
                  {successData.newly_registered.am && <span className="font-bold text-brand-gold ml-1">AM</span>}
                  {successData.newly_registered.am && successData.newly_registered.pm && " & "}
                  {successData.newly_registered.pm && <span className="font-bold text-brand-gold ml-1">PM</span>}
                </p>

                {(successData.already_registered.am || successData.already_registered.pm) && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 font-medium">
                    Note: Your attendance had already been logged for the 
                    {successData.already_registered.am && " AM"}
                    {successData.already_registered.am && successData.already_registered.pm && " and"}
                    {successData.already_registered.pm && " PM"} session(s) previously.
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => {
                  setSuccessData(null)
                  setIdNumber('')
                  setPostcode('')
                  setSelectedSessions({ am: false, pm: false })
                }}
                className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition w-full md:w-auto"
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
                  {availableDates.map((date) => (
                    <option key={date.id} value={date.id}>
                      {date.label} {date.id === todayString ? '(Today)' : ''}
                    </option>
                  ))}
                </select>
                {selectedDate && selectedDate < todayString && (
                  <p className="text-xs text-yellow-600 mt-2 flex items-center font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Retroactive log: Requires admin approval
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-2">Session(s) Attended</label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    disabled={!isAmEnabled}
                    onClick={() => setSelectedSessions(prev => ({...prev, am: !prev.am}))}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all duration-200 ${
                      !isAmEnabled 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selectedSessions.am 
                          ? 'border-brand-burgundy bg-brand-burgundy text-brand-gold shadow-md' 
                          : 'border-gray-200 bg-white text-gray-50 hover:border-brand-burgundy hover:text-brand-burgundy'
                    }`}
                  >
                    AM Session
                  </button>
                  <button
                    type="button"
                    disabled={!isPmEnabled}
                    onClick={() => setSelectedSessions(prev => ({...prev, pm: !prev.pm}))}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all duration-200 ${
                      !isPmEnabled 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selectedSessions.pm 
                          ? 'border-brand-burgundy bg-brand-burgundy text-brand-gold shadow-md' 
                          : 'border-gray-200 bg-white text-gray-500 hover:border-brand-burgundy hover:text-brand-burgundy'
                    }`}
                  >
                    PM Session
                  </button>
                </div>
                {!isAmEnabled && !isPmEnabled && (
                  <p className="text-xs text-red-500 mt-2 text-center">There are no active sessions available for this date yet.</p>
                )}
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
                disabled={loading || (!isAmEnabled && !isPmEnabled) || (!selectedSessions.am && !selectedSessions.pm)}
                className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold mt-2 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}