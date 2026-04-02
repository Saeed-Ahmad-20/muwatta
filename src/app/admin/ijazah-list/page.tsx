'use client'

import { useState, useEffect, useMemo } from 'react'

type IjazahAttendee = {
  id: number
  attendee_name: string
  arabic_name: string | null
  checked_in_at: string
}

type AttendanceRecord = {
  attendee_id: number
}

export default function IjazahList() {
  const [attendees, setAttendees] = useState<IjazahAttendee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showOnlyWithAttendance, setShowOnlyWithAttendance] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [ijazahRes, attendeesRes] = await Promise.all([
        fetch('/api/admin/ijazah'),
        fetch('/api/admin/attendees')
      ])

      const ijazahResult = await ijazahRes.json()
      const attendeesResult = await attendeesRes.json()

      if (!ijazahRes.ok || !ijazahResult.success) {
        throw new Error(ijazahResult.error || 'Failed to fetch Ijazah list.')
      }

      setAttendees(ijazahResult.data)

      if (attendeesRes.ok && attendeesResult.success) {
        setAttendanceRecords(attendeesResult.records || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Set of attendee IDs who have logged attendance at least once
  const attendeesWithAttendance = useMemo(() => {
    return new Set(attendanceRecords.map(r => r.attendee_id))
  }, [attendanceRecords])

  // Filtered list based on toggle
  const filteredAttendees = useMemo(() => {
    if (!showOnlyWithAttendance) return attendees
    return attendees.filter(a => attendeesWithAttendance.has(a.id))
  }, [attendees, showOnlyWithAttendance, attendeesWithAttendance])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'English Name', 'Arabic Name']

    const rows = filteredAttendees.map(a => [
      a.id,
      `"${(a.attendee_name || '').replace(/"/g, '""')}"`,
      `"${(a.arabic_name || '').replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    // BOM prefix so Excel handles Arabic (UTF-8) correctly
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ijazah-list-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-brand-burgundy rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Ijazah list...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-4 md:p-8 print:p-0 print:bg-white">

      {/* Hide this top bar when printing */}
      <div className="max-w-6xl mx-auto mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-brand-burgundy">Ijazah List</h1>
            <p className="text-gray-600 mt-1">Attendees who have officially checked in at the venue.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center">
              <span className="text-sm font-bold text-gray-500 mr-2 uppercase tracking-wider">Showing:</span>
              <span className="text-lg font-black text-brand-burgundy">{filteredAttendees.length}</span>
              {showOnlyWithAttendance && (
                <span className="text-sm text-gray-400 ml-1">/ {attendees.length}</span>
              )}
            </div>
            <button
              onClick={handleExportCSV}
              disabled={filteredAttendees.length === 0}
              className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print List
            </button>
          </div>
        </div>

        {/* Attendance Toggle */}
        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-brand-burgundy mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            <div>
              <span className="text-sm font-bold text-brand-burgundy">Filter: Logged Attendance</span>
              <p className="text-xs text-gray-500 mt-0.5">Only show attendees who have registered at least one AM or PM session</p>
            </div>
          </div>
          <button
            onClick={() => setShowOnlyWithAttendance(prev => !prev)}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:ring-offset-2 ${
              showOnlyWithAttendance ? 'bg-brand-burgundy' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showOnlyWithAttendance ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center font-medium print:hidden">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">

        {filteredAttendees.length === 0 ? (
          <div className="p-12 text-center text-gray-500 print:hidden">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            {showOnlyWithAttendance ? (
              <>
                <p className="text-lg font-medium">No attendees matched the filter.</p>
                <p className="text-sm mt-1">None of the checked-in attendees have logged attendance yet.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No attendees have checked in yet.</p>
                <p className="text-sm mt-1">Once attendees scan their tickets at the door, they will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-burgundy text-brand-gold print:bg-transparent print:text-black">
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark print:border-black w-24">ID</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark print:border-black">English Name</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark print:border-black text-right">Arabic Name (Ijazah)</th>
                  {/* Attendance column hidden when printing */}
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark text-center w-36 print:hidden">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 print:divide-gray-400">
                {filteredAttendees.map((attendee, index) => {
                  const hasAttendance = attendeesWithAttendance.has(attendee.id)
                  return (
                    <tr
                      key={attendee.id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} print:bg-transparent break-inside-avoid`}
                    >
                      <td className="px-6 py-4 text-gray-600 font-medium print:text-black">
                        #{attendee.id}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-brand-burgundy print:text-black">{attendee.attendee_name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {attendee.arabic_name ? (
                          <span className="font-bold text-lg text-gray-900 font-serif print:text-black" dir="rtl">
                            {attendee.arabic_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm italic print:text-gray-500">Not Provided</span>
                        )}
                      </td>
                      {/* Attendance column hidden when printing */}
                      <td className="px-6 py-4 text-center print:hidden">
                        {hasAttendance ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Logged
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            None
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}