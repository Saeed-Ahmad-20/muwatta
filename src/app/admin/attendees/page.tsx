'use client'

import { useEffect, useState } from 'react'

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

export default function AttendanceTracker() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null) 
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    try {
      // Fetch securely through our new API route
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

  const DetailItem = ({ label, value, isRtl = false }: { label: string, value: string | null, isRtl?: boolean }) => (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
      <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">{label}</span>
      <span className={`block text-sm text-gray-900 ${isRtl ? 'font-bold text-lg' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
        {value || '-'}
      </span>
    </div>
  )

  const filteredAttendees = attendees.filter((attendee) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      attendee.attendee_name.toLowerCase().includes(searchLower) ||
      attendee.id.toString().includes(searchLower) ||
      (attendee.tt_ticket_id && attendee.tt_ticket_id.toLowerCase().includes(searchLower))
    )
  })

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
            placeholder="Search Name, ID, or Ticket ID..."
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
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No attendees found. Sync your data to begin.
                    </td>
                  </tr>
                )}
                {attendees.length > 0 && filteredAttendees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No attendees matched your search for "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAttendee && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedAttendee(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border-2 border-brand-burgundy"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-brand-burgundy-dark flex justify-between items-center sticky top-0 bg-brand-burgundy text-brand-gold z-10">
              <div>
                <h2 className="text-2xl font-bold">{selectedAttendee.attendee_name}</h2>
                <p className="text-sm font-bold text-brand-gold-light">ID: #{selectedAttendee.id}</p>
              </div>
              <button 
                onClick={() => setSelectedAttendee(null)}
                className="text-brand-gold hover:text-white text-3xl leading-none bg-brand-burgundy-dark hover:bg-brand-burgundy h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                title="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <DetailItem label="Ticket ID" value={selectedAttendee.tt_ticket_id} />
                </div>
                <div className="md:col-span-2">
                  <DetailItem label="Arabic Name (Ijazah)" value={selectedAttendee.arabic_name} isRtl={true} />
                </div>
                <DetailItem label="Email Address" value={selectedAttendee.email} />
                <DetailItem label="Mobile Number" value={selectedAttendee.mobile_number} />
                <DetailItem label="Admission Type" value={selectedAttendee.admission_type} />
                <DetailItem label="Description" value={selectedAttendee.description} />
                <DetailItem label="Emergency Contact Name" value={selectedAttendee.emergency_contact_name} />
                <DetailItem label="Emergency Contact Number" value={selectedAttendee.emergency_contact_number} />
                <div className="md:col-span-2">
                  <DetailItem label="Medical Conditions" value={selectedAttendee.medical_conditions} />
                </div>
                <div className="md:col-span-2">
                  <DetailItem label="Imam or Teacher?" value={selectedAttendee.position} />
                </div>
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-md border border-gray-100">
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
            </div>

          </div>
        </div>
      )}
    </div>
  )
}