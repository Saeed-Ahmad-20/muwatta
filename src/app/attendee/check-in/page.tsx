'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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
  
  // NEW: Track if they were already checked in
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketCode.trim()) return

    setLoading(true)
    setError('')
    setSuccessAttendee(null)
    setAlreadyCheckedIn(false) // Reset on new submission

    try {
      // 1. Find the attendee by Ticket Code
      const { data: attendee, error: fetchError } = await supabase
        .from('attendees')
        .select('id, attendee_name, arabic_name, tt_ticket_id, checked_in_at')
        .eq('tt_ticket_id', ticketCode.trim())
        .single()

      if (fetchError || !attendee) {
        throw new Error("Ticket Code not found. Please check your ticket and try again.")
      }

      // 2. Check if they already did this
      if (attendee.checked_in_at) {
        setAlreadyCheckedIn(true) // Flag as already registered
        setSuccessAttendee(attendee) // Show them their ID again if they forgot!
        setTicketCode('')
        return
      }

      // 3. Log their official arrival time
      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('attendees')
        .update({ checked_in_at: now })
        .eq('id', attendee.id)

      if (updateError) throw new Error("Connection error. Please try again.")

      const updatedAttendee = { ...attendee, checked_in_at: now }

      // 4. Update UI
      setSuccessAttendee(updatedAttendee)
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className={`w-full ${successAttendee ? 'max-w-2xl' : 'max-w-md'} bg-gray-50 rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden transition-all duration-300 relative`}>
        
        {/* Header (Matches My Details) */}
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">Event Arrival</h1>
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
              
              {/* NEW: Already Checked In Banner */}
              {alreadyCheckedIn && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center justify-center text-center shadow-sm">
                  <svg className="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-bold text-sm md:text-base">You have already checked in! Here are your details again.</span>
                </div>
              )}

              {/* Welcome Card */}
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

              {/* ID Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Daily Attendance ID</span>
                <p className="text-6xl md:text-7xl font-black text-brand-burgundy tracking-tight py-2">{successAttendee.id}</p>
                <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 font-bold text-sm">
                  ⚠️ Take a screenshot. You will need this ID to log your attendance every morning and afternoon.
                </div>
              </div>

              {/* Instructions Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-sm">
                <h3 className="text-lg font-bold text-brand-burgundy mb-4 flex items-center border-b border-gray-100 pb-2">
                  <svg className="w-5 h-5 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  How to use your Attendee Tabs:
                </h3>
                <ul className="space-y-3 text-gray-700 font-medium">
                  <li className="flex items-start">
                    <span className="mr-3 text-lg leading-none">📝</span>
                    <span><strong>Register Attendance:</strong> Use your ID and Postcode on the Attendance tab to log your AM and PM sessions every day.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-lg leading-none">👤</span>
                    <span><strong>My Details:</strong> View your registration information and update any details that may require changing.</span>
                  </li>
                </ul>
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