'use client'

import { useState, useRef } from 'react'

type CheckedInAttendee = {
  id: number
  attendee_name: string
  arabic_name: string | null
  tt_ticket_id: string
  checked_in_at: string
}

export default function ArrivalCheckIn() {
  const [ticketCode, setTicketCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successAttendee, setSuccessAttendee] = useState<CheckedInAttendee | null>(null)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketCode.trim()) return

    setLoading(true)
    setError('')
    setSuccessAttendee(null)
    setAlreadyCheckedIn(false)

    try {
      const response = await fetch('/api/attendee/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "An error occurred during check-in.")
      }

      setAlreadyCheckedIn(result.alreadyCheckedIn)
      setSuccessAttendee(result.attendee)
      setTicketCode('')

    } catch (err: any) {
      setError(err.message)
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSuccessAttendee(null)
    setError('')
    setTicketCode('')
    setAlreadyCheckedIn(false)
  }

  // --- MAIN FORM ---
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className={`w-full ${successAttendee ? 'max-w-2xl' : 'max-w-md'} bg-gray-50 rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden transition-all duration-300 relative`}>
        
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">Check-In</h1>
          <p className="text-sm text-brand-gold-light mt-2">Log your official arrival and receive your ID Number</p>
        </div>

        <div className="p-6 md:p-8">
          {!successAttendee ? (
            <form onSubmit={handleCheckIn} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-2 text-center uppercase tracking-wider">
                  Ticket Code
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="e.g. TICK-12345"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors text-center text-2xl font-bold uppercase"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !ticketCode.trim()}
                className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold mt-2 disabled:opacity-50"
              >
                {loading ? 'Finding Ticket...' : 'Complete Registration'}
              </button>
            </form>
          ) : (
            <div className="animate-in fade-in zoom-in space-y-6">
              
              {alreadyCheckedIn && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center justify-center text-center shadow-sm">
                  <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-bold text-sm md:text-base">You have already checked in! Here are your details again.</span>
                </div>
              )}

              <div className="flex flex-col items-center text-center bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${alreadyCheckedIn ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                
                <h2 className="text-2xl font-bold text-brand-burgundy">
                  Welcome, {successAttendee.attendee_name}!
                </h2>
                {successAttendee.arabic_name && (
                  <p className="text-xl font-bold text-brand-burgundy mt-2" dir="rtl">
                    {successAttendee.arabic_name}
                  </p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Daily Attendance ID</span>
                <p className="text-6xl md:text-7xl font-black text-brand-burgundy tracking-tight py-2">{successAttendee.id}</p>
                <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 font-bold text-sm">
                  ⚠️ Take a screenshot. You will need this ID to log your attendance every morning and afternoon.
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold shadow-sm"
              >
                Done
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}