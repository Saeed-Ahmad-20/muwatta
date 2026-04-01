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

  // Helper to generate the Ticket Tailor wallet link
  const getWalletLink = (ticketId: string, type: 'apple' | 'google') => {
    // Ticket Tailor's native endpoint for generating passes
    return `https://www.tickettailor.com/digital-ticket/${ticketId}/${type === 'apple' ? 'apple-wallet' : 'google-pay'}`
  }

  // --- MAIN FORM ---
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className={`w-full ${successAttendee ? 'max-w-2xl' : 'max-w-md'} bg-gray-50 rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden transition-all duration-300 relative`}>
        
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">Check-In</h1>
          <p className="text-sm text-brand-gold-light mt-2">Log your official arrival using your Ticket Tailor code from your confirmation email and receive your ID Number</p>
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
                  placeholder="e.g. tick-12345"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors text-center text-2xl font-bold"
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

              {/* ========================================== */}
              {/* DIGITAL WALLET PASS BUTTONS                */}
              {/* ========================================== */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4 text-center uppercase tracking-wider">Save Your Digital Ticket</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  
                  {/* Apple Wallet Button */}
                  <a 
                    href={getWalletLink(successAttendee.tt_ticket_id, 'apple')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition font-bold shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 22 184.8 4 273.5q-18 84.7 49.3 175.6c27.1 39.7 59.8 82.2 102.4 82.2 38.2 0 52.5-23.6 98.6-23.6 46.1 0 58.9 23.6 100.4 23.6 43.8 0 73.2-43.2 100.2-83.2 18.1-27.8 29.8-55.1 30.5-57.6-20.2-10.5-49.2-34.6-49.2-84.2zM240 85.3c21.4-25.9 35.8-58.4 31.9-90.1-28.1 1.2-61.9 19.1-84 44.5-19.3 21.9-35.3 55.4-30.8 86.1 31.2 2.4 61.5-14.6 82.9-40.5z"/>
                    </svg>
                    Apple Wallet
                  </a>

                  {/* Google Wallet Button */}
                  <a 
                    href={getWalletLink(successAttendee.tt_ticket_id, 'google')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition font-bold shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none">
                      <path d="M43.611 20.083H42V20H24V28H35.303C33.666 32.684 29.227 36 24 36C17.373 36 12 30.627 12 24C12 17.373 17.373 12 24 12C27.059 12 29.842 13.154 31.961 15.039L37.628 9.372C34.046 6.016 29.268 4 24 4C12.955 4 4 12.955 4 24C4 35.045 12.955 44 24 44C35.045 44 44 35.045 44 24C44 22.659 43.862 21.35 43.611 20.083Z" fill="#FFC107"/>
                      <path d="M43.611 20.083H42V20H24V28H35.303C34.425 30.493 32.753 32.559 30.612 33.916L37.628 39.373C35.91 40.89 33.725 42.062 31.332 42.791L30.612 33.916Z" fill="#FF3D00"/>
                      <path d="M24 44C29.532 44 34.554 41.972 38.332 38.791L30.612 33.916C28.752 35.253 26.471 36 24 36C18.773 36 14.334 32.684 12.697 28H5.352V33.682C9.077 40.062 16.035 44 24 44Z" fill="#4CAF50"/>
                      <path d="M37.628 9.372L31.961 15.039C29.842 13.154 27.059 12 24 12C18.773 12 14.334 15.316 12.697 20H5.352V14.318C9.077 7.938 16.035 4 24 4C29.268 4 34.046 6.016 37.628 9.372Z" fill="#1976D2"/>
                    </svg>
                    Google Pay
                  </a>
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