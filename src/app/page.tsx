'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Attendee = {
  id: string
  ticket_id: string
  first_name: string
  last_name: string
  email: string
  checked_in: boolean
}

export default function AttendanceTracker() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchAttendees()
  }, [])

  const fetchAttendees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false })

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
      
      if (result.success) {
        alert(`Successfully synced from Ticket Tailor!`)
        fetchAttendees() // Reload the list
      } else {
        alert(`Sync failed: ${result.error}`)
      }
    } catch (error) {
      console.error("Failed to sync", error)
    }
    setSyncing(false)
  }

  const toggleCheckIn = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('attendees')
      .update({ checked_in: !currentStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating check-in status:', error)
    } else {
      setAttendees((prev) =>
        prev.map((attendee) =>
          attendee.id === id ? { ...attendee, checked_in: !currentStatus } : attendee
        )
      )
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
          <div className="space-x-4">
            <button 
              onClick={fetchAttendees}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Refresh Local Data
            </button>
            <button 
              onClick={syncTicketTailor}
              disabled={syncing}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Ticket Tailor'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading attendees...</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendees.map((attendee) => (
                  <tr key={attendee.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {attendee.first_name} {attendee.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{attendee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${attendee.checked_in ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {attendee.checked_in ? 'Checked In' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleCheckIn(attendee.id, attendee.checked_in)}
                        className={`px-4 py-2 rounded text-white transition ${attendee.checked_in ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                      >
                        {attendee.checked_in ? 'Undo' : 'Check In'}
                      </button>
                    </td>
                  </tr>
                ))}
                {attendees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No attendees yet. Click "Sync Ticket Tailor" to pull your orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}