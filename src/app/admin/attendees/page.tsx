'use client'

import { useEffect, useState, useMemo } from 'react'

type Attendee = {
  id: number
  admission_type: string
  description: string
  attendee_name: string
  email: string
  mobile_number: string
  address_line: string
  city: string
  postal_code: string
  country: string
  emergency_contact_name: string
  emergency_contact_number: string
  medical_conditions: string
  position: string
  arabic_name: string
  tt_ticket_id: string | null
}

type AttendanceRecord = {
  id: number
  attendee_id: number
  attendee_name: string
  event_date: string
  session_type: 'am' | 'pm'
}

const EVENT_DATES = [
  '2026-04-04',
  '2026-04-05',
  '2026-04-06',
  '2026-04-07',
]

// --- MOVED OUTSIDE COMPONENT TO PREVENT RE-RENDER BUGS ---
function renderDetailItem(label: string, value: string | null, isRtl = false) {
  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
      <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">{label}</span>
      <span className={`block text-sm text-gray-900 ${isRtl ? 'font-bold text-lg' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
        {value || '-'}
      </span>
    </div>
  )
}

export default function AttendanceTracker() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null) 
  const [searchTerm, setSearchTerm] = useState('')

  // Modal Modes
  const [modalMode, setModalMode] = useState<'view' | 'editProfile' | 'editAttendance'>('view')
  
  // Profile Edit States
  const [editForm, setEditForm] = useState<Partial<Attendee>>({})
  const [savingDetails, setSavingDetails] = useState(false)

  // Attendance Edit States
  const [attendanceDraftState, setAttendanceDraftState] = useState<Record<string, boolean>>({})
  const [savingAttendance, setSavingAttendance] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/attendees')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setAttendees(result.attendees)
      setAttendanceRecords(result.records)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load attendees database.')
    } finally {
      setLoading(false)
    }
  }

  const syncTicketTailor = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync', { method: 'POST' })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      
      if (result.success) {
        alert(`Successfully synced ${result.count} valid tickets!`)
        fetchData()
      } else {
        alert(`Sync failed: ${result.error}`)
      }
    } catch (error: any) {
      console.error("Failed to sync", error)
      alert(`Sync failed: ${error.message}`)
    }
    setSyncing(false)
  }

  const hasAttended = (attendeeId: number, date: string, session: 'am' | 'pm') => {
    return attendanceRecords.some(
      record => record.attendee_id === attendeeId && record.event_date === date && record.session_type === session
    )
  }

  // --- PROFILE EDITING LOGIC ---
  const handleSaveChanges = async () => {
    if (!selectedAttendee) return
    setSavingDetails(true)

    try {
      const response = await fetch('/api/admin/update-attendee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAttendee.id,
          updates: editForm
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update attendee.")
      }

      const updatedAttendee = { ...selectedAttendee, ...editForm } as Attendee
      setAttendees(prev => prev.map(a => a.id === updatedAttendee.id ? updatedAttendee : a))
      setSelectedAttendee(updatedAttendee)
      setModalMode('view')
      
    } catch (err: any) {
      alert("Error saving details: " + err.message)
    } finally {
      setSavingDetails(false)
    }
  }

  // --- ATTENDANCE EDITING LOGIC ---
  const currentAttendeeRecords = useMemo(() => {
    if (!selectedAttendee) return []
    return attendanceRecords.filter(r => r.attendee_id === selectedAttendee.id)
  }, [selectedAttendee, attendanceRecords])

  useEffect(() => {
    if (modalMode === 'editAttendance' && selectedAttendee) {
      const initialState: Record<string, boolean> = {}
      EVENT_DATES.forEach(date => {
        ['am', 'pm'].forEach(session => {
          const exists = currentAttendeeRecords.some(r => r.event_date === date && r.session_type === session)
          initialState[`${date}-${session}`] = exists
        })
      })
      setAttendanceDraftState(initialState)
    }
  }, [modalMode, selectedAttendee, currentAttendeeRecords])

  const hasAttendanceChanges = useMemo(() => {
    if (!selectedAttendee) return false
    for (const date of EVENT_DATES) {
      for (const session of ['am', 'pm']) {
        const key = `${date}-${session}`
        const isDraftChecked = attendanceDraftState[key]
        const isActuallyChecked = currentAttendeeRecords.some(r => r.event_date === date && r.session_type === session)
        
        if (isDraftChecked !== isActuallyChecked) return true
      }
    }
    return false
  }, [attendanceDraftState, selectedAttendee, currentAttendeeRecords])

  const toggleCheckbox = (dateId: string, session: 'am' | 'pm') => {
    const key = `${dateId}-${session}`
    setAttendanceDraftState(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveAttendance = async () => {
    if (!selectedAttendee) return
    setSavingAttendance(true)

    const additions: any[] = []
    const removals: number[] = []

    EVENT_DATES.forEach(date => {
      ['am', 'pm'].forEach(session => {
        const key = `${date}-${session}`
        const isChecked = attendanceDraftState[key]
        const existingRecord = currentAttendeeRecords.find(r => r.event_date === date && r.session_type === session)

        if (isChecked && !existingRecord) {
          additions.push({ event_date: date, session_type: session })
        } else if (!isChecked && existingRecord) {
          removals.push(existingRecord.id)
        }
      })
    })

    try {
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
      await fetchData() // Re-fetch to get accurate IDs for new records
      alert("Attendance records successfully updated!")
      setModalMode('view')

    } catch (err: any) {
      alert("Failed to save changes: " + err.message)
    } finally {
      setSavingAttendance(false)
    }
  }

  // --- CHANGED TO A STANDARD RENDER FUNCTION TO PREVENT FOCUS LOSS BUG ---
  const renderInputField = (label: string, fieldKey: keyof Attendee, isRtl = false, disabled = false) => {
    return (
      <div className={`p-3 rounded-md border shadow-sm ${disabled ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-brand-burgundy/30'}`}>
        <label className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">{label}</label>
        <input 
          type="text" 
          value={(editForm[fieldKey] as string) || ''}
          onChange={(e) => !disabled && setEditForm({ ...editForm, [fieldKey]: e.target.value })}
          dir={isRtl ? 'rtl' : 'ltr'}
          disabled={disabled}
          className={`w-full px-3 py-2 rounded text-sm ${isRtl ? 'font-bold text-lg' : ''} ${disabled ? 'bg-transparent text-gray-500 cursor-not-allowed outline-none' : 'bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-burgundy'}`}
        />
      </div>
    )
  }

  const filteredAttendees = attendees.filter((attendee) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      attendee.attendee_name.toLowerCase().includes(searchLower) ||
      attendee.id.toString().includes(searchLower) ||
      (attendee.tt_ticket_id && attendee.tt_ticket_id.toLowerCase().includes(searchLower)) ||
      (attendee.arabic_name && attendee.arabic_name.toLowerCase().includes(searchLower))
    )
  })

  const closeModal = () => {
    setSelectedAttendee(null)
    setModalMode('view')
    setEditForm({})
  }

  return (
    <div className="p-8">
      <div className="max-w-full mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-brand-burgundy">Attendees DB</h1>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            <button 
              onClick={syncTicketTailor}
              disabled={syncing}
              className="px-4 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition disabled:opacity-50 whitespace-nowrap"
            >
              {syncing ? 'Syncing...' : 'Sync Ticket Tailor'}
            </button>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-gray-200 text-brand-burgundy font-bold rounded hover:bg-gray-300 transition whitespace-nowrap"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <div className="mb-6 relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search Name, Arabic Name, ID, or Ticket ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-brand-burgundy">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-brand-burgundy">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-brand-gold uppercase tracking-wider w-24 border-r border-brand-burgundy-dark">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-brand-gold uppercase tracking-wider min-w-[200px] border-r border-brand-burgundy-dark">Attendee Name</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-brand-gold uppercase tracking-wider min-w-[150px] border-r border-brand-burgundy-dark">Arabic Name</th>
                  
                  {EVENT_DATES.map((date, index) => (
                    <th key={date} className="px-4 py-3 text-center text-xs font-bold text-brand-gold uppercase tracking-wider border-r border-brand-burgundy-dark">
                      Day {index + 1}<br/>
                      <span className="text-[10px] text-brand-gold-light opacity-80">{date.slice(-5)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                    
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-burgundy cursor-pointer border-r border-gray-200"
                      onClick={() => setSelectedAttendee(attendee)}
                      title="View Details"
                    >
                      #{attendee.id}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-burgundy cursor-pointer border-r border-gray-200"
                      onClick={() => setSelectedAttendee(attendee)}
                      title="View Details"
                    >
                      {attendee.attendee_name}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-burgundy cursor-pointer border-r border-gray-200 text-right"
                      dir="rtl"
                      onClick={() => setSelectedAttendee(attendee)}
                      title="View Details"
                    >
                      {attendee.arabic_name || '-'}
                    </td>

                    {EVENT_DATES.map((date) => (
                      <td key={date} className="px-4 py-2 whitespace-nowrap border-r border-gray-200 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-brand-burgundy-dark mb-1">AM</span>
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${hasAttended(attendee.id, date, 'am') ? 'bg-brand-burgundy text-brand-gold' : 'bg-gray-100 border border-gray-200'}`}>
                              {hasAttended(attendee.id, date, 'am') && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-brand-burgundy-dark mb-1">PM</span>
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${hasAttended(attendee.id, date, 'pm') ? 'bg-brand-burgundy text-brand-gold' : 'bg-gray-100 border border-gray-200'}`}>
                              {hasAttended(attendee.id, date, 'pm') && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    ))}

                  </tr>
                ))}
                
                {attendees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No attendees found. Sync your data to begin.
                    </td>
                  </tr>
                )}
                {attendees.length > 0 && filteredAttendees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No attendees matched your search for "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE MODAL */}
      {selectedAttendee && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border-2 border-brand-burgundy flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-brand-burgundy-dark flex justify-between items-center sticky top-0 bg-brand-burgundy text-brand-gold z-10 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold">{selectedAttendee.attendee_name}</h2>
                <p className="text-sm font-bold text-brand-gold-light">ID: #{selectedAttendee.id}</p>
              </div>
              <div className="flex items-center space-x-3">
                
                {/* Mode Toggles */}
                {modalMode === 'view' && (
                  <>
                    <button 
                      onClick={() => {
                        setEditForm(selectedAttendee)
                        setModalMode('editProfile')
                      }}
                      className="px-4 py-2 bg-white text-brand-burgundy-dark font-bold rounded hover:bg-gray-100 transition-colors text-sm shadow-sm"
                    >
                      Edit Details
                    </button>
                    <button 
                      onClick={() => setModalMode('editAttendance')}
                      className="px-4 py-2 bg-brand-gold text-brand-burgundy-dark font-bold rounded hover:bg-yellow-400 transition-colors text-sm shadow-sm"
                    >
                      Edit Attendance
                    </button>
                  </>
                )}

                <button 
                  onClick={closeModal}
                  className="ml-2 text-brand-gold hover:text-white text-3xl leading-none bg-brand-burgundy-dark hover:bg-brand-burgundy h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                  title="Close"
                >
                  &times;
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 bg-gray-50 flex-1">
              
              {/* MODE 1: EDIT PROFILE */}
              {modalMode === 'editProfile' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200 flex items-center text-sm font-medium">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Directly editing profile. Changes saved here bypass the approval queue and go live instantly.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      {/* DISABLED TICKET ID FIELD */}
                      {renderInputField("Ticket ID (Barcode)", "tt_ticket_id", false, true)}
                    </div>
                    <div className="md:col-span-2">
                      {renderInputField("Full Name", "attendee_name")}
                    </div>
                    <div className="md:col-span-2">
                      {renderInputField("Arabic Name (Ijazah)", "arabic_name", true)}
                    </div>
                    {renderInputField("Email Address", "email")}
                    {renderInputField("Mobile Number", "mobile_number")}
                    {renderInputField("Admission Type", "admission_type")}
                    {renderInputField("Description (Ticket Type)", "description")}
                    {renderInputField("Emergency Contact Name", "emergency_contact_name")}
                    {renderInputField("Emergency Contact Number", "emergency_contact_number")}
                    <div className="md:col-span-2">
                      {renderInputField("Medical Conditions", "medical_conditions")}
                    </div>
                    <div className="md:col-span-2">
                      {renderInputField("Imam or Teacher?", "position")}
                    </div>
                    <div className="md:col-span-2 bg-white p-4 rounded-md border border-brand-burgundy/30 shadow-sm space-y-4">
                      <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider border-b border-gray-100 pb-2">Home Address</span>
                      {renderInputField("Address Line", "address_line")}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {renderInputField("City", "city")}
                        {renderInputField("Postal Code", "postal_code")}
                        {renderInputField("Country", "country")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: EDIT ATTENDANCE */}
              {modalMode === 'editAttendance' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 flex items-center text-sm font-medium">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Tick or untick boxes to instantly override this attendee's official session logs.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {EVENT_DATES.map((date, idx) => (
                      <div key={date} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h4 className="font-bold text-gray-900 text-sm mb-3 border-b border-gray-200 pb-2">
                          Day {idx + 1} ({date.slice(-5)})
                        </h4>
                        
                        <div className="flex space-x-4">
                          <label className="flex-1 flex items-center justify-center p-3 rounded-md cursor-pointer border-2 transition-all duration-200 has-[:checked]:border-brand-burgundy has-[:checked]:bg-brand-burgundy/5 bg-gray-50 border-gray-200 hover:border-brand-burgundy/50">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 text-brand-burgundy rounded border-gray-300 focus:ring-brand-burgundy"
                              checked={!!attendanceDraftState[`${date}-am`]}
                              onChange={() => toggleCheckbox(date, 'am')}
                              disabled={savingAttendance}
                            />
                            <span className="ml-2 font-bold text-gray-700 text-sm">AM</span>
                          </label>
                          
                          <label className="flex-1 flex items-center justify-center p-3 rounded-md cursor-pointer border-2 transition-all duration-200 has-[:checked]:border-brand-burgundy has-[:checked]:bg-brand-burgundy/5 bg-gray-50 border-gray-200 hover:border-brand-burgundy/50">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 text-brand-burgundy rounded border-gray-300 focus:ring-brand-burgundy"
                              checked={!!attendanceDraftState[`${date}-pm`]}
                              onChange={() => toggleCheckbox(date, 'pm')}
                              disabled={savingAttendance}
                            />
                            <span className="ml-2 font-bold text-gray-700 text-sm">PM</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 3: VIEW (DEFAULT) */}
              {modalMode === 'view' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    {renderDetailItem("Ticket ID", selectedAttendee.tt_ticket_id)}
                  </div>
                  <div className="md:col-span-2">
                    {renderDetailItem("Full Name", selectedAttendee.attendee_name)}
                  </div>
                  <div className="md:col-span-2">
                    {renderDetailItem("Arabic Name (Ijazah)", selectedAttendee.arabic_name, true)}
                  </div>
                  {renderDetailItem("Email Address", selectedAttendee.email)}
                  {renderDetailItem("Mobile Number", selectedAttendee.mobile_number)}
                  {renderDetailItem("Admission Type", selectedAttendee.admission_type)}
                  {renderDetailItem("Description", selectedAttendee.description)}
                  {renderDetailItem("Emergency Contact Name", selectedAttendee.emergency_contact_name)}
                  {renderDetailItem("Emergency Contact Number", selectedAttendee.emergency_contact_number)}
                  <div className="md:col-span-2">
                    {renderDetailItem("Medical Conditions", selectedAttendee.medical_conditions)}
                  </div>
                  <div className="md:col-span-2">
                    {renderDetailItem("Imam or Teacher?", selectedAttendee.position)}
                  </div>
                  <div className="md:col-span-2 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                    <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-2">Home Address</span>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {[
                        selectedAttendee.address_line,
                        selectedAttendee.city,
                        selectedAttendee.postal_code,
                        selectedAttendee.country
                      ].filter(Boolean).join('\n')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Only shows when editing) */}
            {modalMode !== 'view' && (
              <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center sticky bottom-0">
                
                {modalMode === 'editAttendance' && (
                  <div>
                    {hasAttendanceChanges ? (
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
                  </div>
                )}
                
                {modalMode === 'editProfile' && <div></div>}

                <div className="flex space-x-3">
                  <button 
                    onClick={() => setModalMode('view')}
                    disabled={savingDetails || savingAttendance}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>

                  {modalMode === 'editProfile' && (
                    <button 
                      onClick={handleSaveChanges}
                      disabled={savingDetails}
                      className="px-6 py-2.5 bg-brand-burgundy text-brand-gold font-bold rounded hover:bg-brand-burgundy-dark transition disabled:opacity-50 shadow-sm flex items-center"
                    >
                      {savingDetails ? 'Saving...' : 'Save Profile'}
                    </button>
                  )}

                  {modalMode === 'editAttendance' && (
                    <button 
                      onClick={handleSaveAttendance}
                      disabled={savingAttendance || !hasAttendanceChanges}
                      className="px-6 py-2.5 bg-brand-burgundy text-brand-gold font-bold rounded hover:bg-brand-burgundy-dark transition disabled:opacity-50 shadow-sm flex items-center"
                    >
                      {savingAttendance ? 'Processing...' : 'Confirm Override'}
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}