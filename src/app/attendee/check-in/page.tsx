'use client'

import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'

type CheckedInAttendee = {
  id: number
  attendee_name: string
  arabic_name: string | null
  tt_ticket_id: string
  tt_internal_id: string | null 
  checked_in_at: string
}

export default function ArrivalCheckIn() {
  const [ticketCode, setTicketCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successAttendee, setSuccessAttendee] = useState<CheckedInAttendee | null>(null)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLDivElement>(null)

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

  // ==========================================
  // HELPER: Download Pass as Image 
  // ==========================================
  const handleDownloadPass = async () => {
    if (!passRef.current || !successAttendee) return
    
    try {
      const dataUrl = await toPng(passRef.current, {
        pixelRatio: 3, // High quality for retina mobile screens
        cacheBust: true,
      })
      
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `Muwatta-Pass-${successAttendee.attendee_name.replace(/\s+/g, '-')}.png`
      link.click()

    } catch (err) {
      console.error("Failed to download pass:", err)
      alert("Something went wrong generating your pass. Please try taking a screenshot instead!")
    }
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

              {/* ========================================== */}
              {/* DIGITAL PASS (VISIBLE CONTAINER)           */}
              {/* ========================================== */}
              <div className="mx-auto w-[350px]">
                <div 
                  ref={passRef} 
                  style={{
                    backgroundColor: '#630A38', // Matched to --color-brand-burgundy
                    borderColor: '#DFC063',     // Matched to --color-brand-gold
                    borderWidth: '4px',
                    borderStyle: 'solid',
                  }}
                  className="w-full rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden"
                >
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                  <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>

                  <div className="text-center relative z-10 border-b pb-4 mb-6" style={{ borderColor: 'rgba(223, 192, 99, 0.3)' }}>
                    <h2 className="text-sm font-bold tracking-widest uppercase mb-1" style={{ color: '#DFC063' }}>Muwatta Recital 2026</h2>
                    <p className="text-xs" style={{ color: 'rgba(223, 192, 99, 0.8)' }}>Ashton Central Mosque</p>
                  </div>

                  <div className="text-center relative z-10 space-y-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#DFC063' }}>Attendee Name</span>
                      <p className="text-2xl font-bold text-white">{successAttendee.attendee_name}</p>
                      {successAttendee.arabic_name && (
                        <p className="text-lg mt-1" style={{ color: 'rgba(223, 192, 99, 0.8)' }} dir="rtl">{successAttendee.arabic_name}</p>
                      )}
                    </div>

                    <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                      <span className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#DFC063' }}>Daily Attendance ID</span>
                      <p className="text-5xl font-black text-white tracking-tight">{successAttendee.id}</p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#DFC063' }}>Registration Code</span>
                      <p className="text-sm font-mono" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{successAttendee.tt_ticket_id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={handleDownloadPass}
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-brand-gold text-brand-burgundy rounded-lg hover:bg-white transition font-bold shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Save Pass to Photos
                </button>

                <button
                  onClick={handleReset}
                  className="flex-1 py-4 px-4 bg-white text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition font-bold shadow-sm"
                >
                  Done
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}