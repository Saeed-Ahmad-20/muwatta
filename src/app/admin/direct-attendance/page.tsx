'use client'

import { useState, useEffect, useMemo } from 'react'

const EVENT_DATES = [
  { id: '2026-04-04', label: 'Day 1 (Saturday, April 4th)' },
  { id: '2026-04-05', label: 'Day 2 (Sunday, April 5th)' },
  { id: '2026-04-06', label: 'Day 3 (Monday, April 6th)' },
  { id: '2026-04-07', label: 'Day 4 (Tuesday, April 7th)' },
]

export default function DirectAttendanceManager() {
  const [attendees, setAttendees] = useState<any[]>([])
  const [allRecords, setAllRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Selection State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Checkbox Grid State
  const [draftState, setDraftState] = useState<Record<string, boolean>>({})
  const [processing, setProcessing] = useState(false)

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/attendees')
      const result = await response.json()

      if (!response.ok || !result.success) throw new Error(result.error)

      setAttendees(result.attendees || [])
      setAllRecords(result.records || [])
    } catch (error: any) {
      alert("Error loading data: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Filter logic for the search bar
  const filteredAttendees = useMemo(() => {
    if (!searchTerm.trim()) return []
    const lowerSearch = searchTerm.toLowerCase()
    
    return attendees.filter(a => {
      const nameMatch = a.attendee_name ? a.attendee_name.toLowerCase().includes(lowerSearch) : false
      const idMatch = a.id ? a.id.toString().includes(lowerSearch) : false
      const ticketMatch = a.tt_ticket_id ? a.tt_ticket_id.toLowerCase().includes(lowerSearch) : false
      
      return nameMatch || idMatch || ticketMatch
    }).slice(0, 5) // Show top 5 results
  }, [searchTerm, attendees])

  // 3. Get records for the currently selected person
  const currentAttendeeRecords = useMemo(() => {
    if (!selectedAttendee) return []
    return allRecords.filter(r => r.attendee_id === selectedAttendee.id)
  }, [selectedAttendee, allRecords])

  // 4. Initialize Checkboxes when Attendee is Selected
  useEffect(() => {
    if (!selectedAttendee) {
      setDraftState({})
      return
    }

    const initialState: Record<string, boolean> = {}
    EVENT_DATES.forEach(date => {
      ['am', 'pm'].forEach(session => {
        const exists = currentAttendeeRecords.some(r => r.event_date === date.id && r.session_type === session)
        initialState[`${date.id}-${session}`] = exists
      })
    })
    setDraftState(initialState)
  }, [selectedAttendee, currentAttendeeRecords])

  // 5. Determine if changes have been made (to enable/disable Save button)
  const hasChanges = useMemo(() => {
    if (!selectedAttendee) return false
    for (const date of EVENT_DATES) {
      for (const session of ['am', 'pm']) {
        const key = `${date.id}-${session}`
        const isDraftChecked = draftState[key]
        const isActuallyChecked = currentAttendeeRecords.some(r => r.event_date === date.id && r.session_type === session)
        
        if (isDraftChecked !== isActuallyChecked) return true
      }
    }
    return false
  }, [draftState, selectedAttendee, currentAttendeeRecords])

  // 6. Handle Toggling a Checkbox
  const toggleCheckbox = (dateId: string, session: 'am' | 'pm') => {
    const key = `${dateId}-${session}`
    setDraftState(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // 7. Process the Delta (Save Changes)
  const handleSaveChanges = async () => {
    if (!selectedAttendee) return
    setProcessing(true)

    const additions: any[] = []
    const removals: number[] = []

    // Calculate what needs to be added vs removed
    EVENT_DATES.forEach(date => {
      ['am', 'pm'].forEach(session => {
        const key = `${date.id}-${session}`
        const isChecked = draftState[key]
        const existingRecord = currentAttendeeRecords.find(r => r.event_date === date.id && r.session_type === session)

        if (isChecked && !existingRecord) {
          additions.push({ event_date: date.id, session_type: session })
        } else if (!isChecked && existingRecord) {
          removals.push(existingRecord.id)
        }
      })
    })

    try {
      // FIX: Explicitly tell TypeScript this array holds fetch Promises
      const promises: Promise<Response>[] = []

      additions.forEach(add => {
        promises.push(
          fetch('/api/admin/direct-attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add',
              attendee_id: selectedAttendee.id,
              attendee_name: selectedAttendee.attendee_name,
              event_date: add.event_date,
              session_type: add.session_type
            })
          })
        )
      })

      removals.forEach(recordId => {
        promises.push(
          fetch('/api/admin/direct-attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', recordId })
          })
        )
      })

      await Promise.all(promises)

      // Re-fetch all data to ensure UI matches the database exactly
      await fetchData()
      alert("Attendance records successfully updated!")

    } catch (err: any) {
      alert("Failed to save changes: " + err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading && allRecords.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-burgundy mb-2">Direct Attendance Override</h1>
      <p className="text-gray-600 mb-8">Manually adjust attendance logs. Tick or untick boxes and save to instantly update the database.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Search & Select */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
            <h2 className="text-lg font-bold text-brand-burgundy mb-4">1. Find Attendee</h2>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search Name or ID..."
                value={searchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setIsDropdownOpen(true)
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy"
              />
              
              {/* Dropdown Results */}
              {isDropdownOpen && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {filteredAttendees.length > 0 ? (
                    filteredAttendees.map(attendee => (
                      <button
                        key={attendee.id}
                        onClick={() => {
                          setSelectedAttendee(attendee)
                          setSearchTerm('')
                          setIsDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-brand-burgundy/5 border-b border-gray-50 last:border-0 transition"
                      >
                        <div className="font-bold text-brand-burgundy">{attendee.attendee_name}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">ID: #{attendee.id}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No attendees found.</div>
                  )}
                </div>
              )}
            </div>

            {selectedAttendee && (
              <div className="mt-6 p-4 bg-brand-burgundy/5 rounded-lg border border-brand-burgundy/20">
                <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">Currently Selected</span>
                <p className="text-xl font-bold text-brand-burgundy">{selectedAttendee.attendee_name}</p>
                <p className="text-sm font-bold text-gray-600 mt-1">ID: #{selectedAttendee.id}</p>
                {selectedAttendee.tt_ticket_id && (
                  <p className="text-xs font-mono text-gray-500 mt-1">{selectedAttendee.tt_ticket_id}</p>
                )}
                <button 
                  onClick={() => setSelectedAttendee(null)}
                  className="mt-3 text-sm text-red-600 font-bold hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Checkbox Grid */}
        <div className="lg:col-span-2">
          {selectedAttendee ? (
            <div className="bg-white rounded-xl border border-brand-burgundy shadow-sm overflow-hidden animate-in fade-in">
              
              <div className="bg-brand-burgundy p-4 flex justify-between items-center text-brand-gold">
                <h3 className="font-bold">2. Edit Attendance Logs</h3>
                <span className="text-sm">
                  {currentAttendeeRecords.length} / 8 Sessions Logged
                </span>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {EVENT_DATES.map((date) => (
                    <div key={date.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 text-sm mb-3 border-b border-gray-200 pb-2">{date.label}</h4>
                      
                      <div className="flex space-x-4">
                        {/* AM Checkbox */}
                        <label className="flex-1 flex items-center justify-center p-3 rounded-md cursor-pointer border-2 transition-all duration-200 has-[:checked]:border-brand-burgundy has-[:checked]:bg-brand-burgundy/5 bg-white border-gray-200 hover:border-brand-burgundy/50">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 text-brand-burgundy rounded border-gray-300 focus:ring-brand-burgundy"
                            checked={!!draftState[`${date.id}-am`]}
                            onChange={() => toggleCheckbox(date.id, 'am')}
                            disabled={processing}
                          />
                          <span className="ml-2 font-bold text-gray-700">AM Session</span>
                        </label>
                        
                        {/* PM Checkbox */}
                        <label className="flex-1 flex items-center justify-center p-3 rounded-md cursor-pointer border-2 transition-all duration-200 has-[:checked]:border-brand-burgundy has-[:checked]:bg-brand-burgundy/5 bg-white border-gray-200 hover:border-brand-burgundy/50">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 text-brand-burgundy rounded border-gray-300 focus:ring-brand-burgundy"
                            checked={!!draftState[`${date.id}-pm`]}
                            onChange={() => toggleCheckbox(date.id, 'pm')}
                            disabled={processing}
                          />
                          <span className="ml-2 font-bold text-gray-700">PM Session</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  {hasChanges ? (
                    <span className="text-yellow-600 font-bold text-sm flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Unsaved Changes
                    </span>
                  ) : (
                    <span className="text-green-600 font-bold text-sm flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Up to date
                    </span>
                  )}
                  
                  <button 
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || processing}
                    className="px-8 py-3 bg-brand-burgundy text-brand-gold font-bold rounded-lg hover:bg-brand-burgundy-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {processing ? 'Saving...' : 'Confirm Changes'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <span className="font-bold text-lg text-gray-500">No Attendee Selected</span>
              <span className="text-sm mt-1">Search and select an attendee on the left to view and edit their attendance.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}