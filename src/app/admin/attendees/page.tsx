'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
}

export default function AttendanceTracker() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null) // State for the pop-up

  useEffect(() => {
    fetchAttendees()
  }, [])

  const fetchAttendees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .order('id', { ascending: true }) 

    if (error) {
      console.error('Error fetching attendees:', error)
    } else {
      setAttendees(data || [])
    }
    setLoading(false)
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
        fetchAttendees()
      } else {
        alert(`Sync failed: ${result.error}`)
      }
    } catch (error: any) {
      console.error("Failed to sync", error)
      alert(`Sync failed: ${error.message}`)
    }
    setSyncing(false)
  }

  // A small helper component to make the pop-up details look incredibly clean
  const DetailItem = ({ label, value, isRtl = false }: { label: string, value: string | null, isRtl?: boolean }) => (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`block text-sm text-gray-900 ${isRtl ? 'font-bold text-lg' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
        {value || '-'}
      </span>
    </div>
  )

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Attendee Data Viewer</h1>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            <button 
              onClick={syncTicketTailor}
              disabled={syncing}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50 whitespace-nowrap"
            >
              {syncing ? 'Syncing...' : 'Sync Ticket Tailor'}
            </button>
            <button 
              onClick={fetchAttendees}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition whitespace-nowrap"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* The Simplified Data Table */}
        {loading ? (
          <p className="text-gray-600">Loading attendees...</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">ID #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee Name</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendees.map((attendee) => (
                  <tr 
                    key={attendee.id} 
                    onClick={() => setSelectedAttendee(attendee)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    title="Click to view details"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      #{attendee.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {attendee.attendee_name}
                    </td>
                  </tr>
                ))}
                {attendees.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                      No attendees found. Sync your data to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* The Attendee Detail Pop-up Modal */}
      {selectedAttendee && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedAttendee(null)} // Closes if you click outside the modal
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()} // Prevents clicks inside the modal from closing it
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAttendee.attendee_name}</h2>
                <p className="text-sm font-medium text-blue-600">ID: #{selectedAttendee.id}</p>
              </div>
              <button 
                onClick={() => setSelectedAttendee(null)}
                className="text-gray-400 hover:text-gray-900 text-3xl leading-none bg-gray-100 hover:bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                title="Close"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Content - Organized in a Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Core Info */}
                <div className="md:col-span-2">
                  <DetailItem label="Arabic Name (Ijazah)" value={selectedAttendee.arabic_name} isRtl={true} />
                </div>
                
                <DetailItem label="Email Address" value={selectedAttendee.email} />
                <DetailItem label="Mobile Number" value={selectedAttendee.mobile_number} />
                
                {/* Ticket Details */}
                <DetailItem label="Admission Type" value={selectedAttendee.admission_type} />
                <DetailItem label="Description" value={selectedAttendee.description} />
                
                {/* Emergency & Medical */}
                <DetailItem label="Emergency Contact Name" value={selectedAttendee.emergency_contact_name} />
                <DetailItem label="Emergency Contact Number" value={selectedAttendee.emergency_contact_number} />
                <div className="md:col-span-2">
                  <DetailItem label="Medical Conditions" value={selectedAttendee.medical_conditions} />
                </div>

                {/* Additional Info */}
                <div className="md:col-span-2">
                  <DetailItem label="Imam or Teacher?" value={selectedAttendee.position} />
                </div>
                
                {/* Address Block */}
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-md border border-gray-100">
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Home Address</span>
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